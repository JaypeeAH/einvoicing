-- =====================================================================================================
-- SME e-Invoicing — initial schema
--
-- Multi-tenant (one organization = one BIR taxpayer). Every table is protected by row-level security:
-- a user only sees organizations they are an active member of, and what they can change depends on
-- their role (see src/constants/permissions.constant.ts — keep both in sync).
--
-- BIR controls implemented in the database (so no client or API bug can bypass them):
--   * Serial numbers are assigned only when a document is issued, gap-free, per branch and document type,
--     within the registered range (RMC 5-2021 Annex B).
--   * Issued documents cannot be edited or deleted — only voided with a reason (RMC 5-2021; RMC 98-2026).
--   * Seller details, the CAS Acknowledgment Certificate and approved series are copied onto the
--     document at issue time, so later profile changes never alter an issued invoice.
--   * Each issued document stores a SHA-256 hash chained to the previous one (tamper evidence).
--   * Every change is written to an append-only audit trail (user, timestamp, old and new values).
-- =====================================================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------------------------------

create type public.member_role as enum ('owner', 'admin', 'accountant', 'cashier', 'viewer');
create type public.member_status as enum ('active', 'invited', 'suspended');
create type public.vat_registration as enum ('vat', 'non_vat');
create type public.taxpayer_size as enum ('micro', 'small', 'medium', 'large');
create type public.branch_status as enum ('active', 'closed');
create type public.customer_type as enum ('business', 'individual', 'government');
create type public.document_type as enum ('sales_invoice', 'service_invoice', 'credit_memo', 'debit_memo');
create type public.invoice_status as enum ('draft', 'issued', 'voided');
create type public.tax_treatment as enum ('vatable', 'zero_rated', 'vat_exempt', 'non_vat');
create type public.special_discount_type as enum ('senior_citizen', 'pwd', 'solo_parent', 'naac', 'mov');
create type public.registration_type as enum ('cor', 'cas_ac', 'pti', 'eis_certification', 'ptt');
create type public.registration_status as enum ('not_started', 'preparing', 'filed', 'approved', 'rejected', 'revoked');
create type public.transmission_status as enum ('queued', 'sent', 'accepted', 'rejected', 'failed', 'cancelled');
create type public.document_category as enum (
    'cor', 'cas_ac', 'sworn_statement', 'system_documentation', 'pti', 'eis_certification', 'ptt',
    'bir_correspondence', 'other'
);

-- -----------------------------------------------------------------------------------------------------
-- Shared trigger: updated_at
-- -----------------------------------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

-- -----------------------------------------------------------------------------------------------------
-- Profiles (one per auth user)
-- -----------------------------------------------------------------------------------------------------

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null,
    full_name text not null default '',
    -- CAS security standard: passwords are rotated every 30 days (RMC 5-2021 Annex B item 11)
    password_changed_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
    for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
    on conflict (id) do nothing;
    return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------------------------------
-- Organizations (the taxpayer / seller) and members
-- -----------------------------------------------------------------------------------------------------

create table public.organizations (
    id uuid primary key default gen_random_uuid(),
    registered_name text not null check (length(trim(registered_name)) >= 2),
    business_name text,
    tin text not null check (tin ~ '^\d{3}-\d{3}-\d{3}$'),
    vat_registration public.vat_registration not null,
    taxpayer_size public.taxpayer_size,
    rdo_code text not null check (rdo_code ~ '^\d{3}[A-Za-z]?$'),
    registered_address text not null,
    zip_code text not null check (zip_code ~ '^\d{4}$'),
    line_of_business text,
    email text,
    phone text,
    prices_include_vat boolean not null default true,
    -- Turn on once BIR issues a Permit to Transmit: issued invoices are then queued for the EIS
    eis_transmission_enabled boolean not null default false,
    created_by uuid references auth.users (id) default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger organizations_updated_at before update on public.organizations
    for each row execute function public.set_updated_at();

create table public.organization_members (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    user_id uuid not null references auth.users (id) on delete cascade,
    role public.member_role not null,
    status public.member_status not null default 'active',
    email text not null,
    full_name text not null default '',
    invited_by uuid references auth.users (id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (organization_id, user_id)
);

create index organization_members_user_idx on public.organization_members (user_id);

create trigger organization_members_updated_at before update on public.organization_members
    for each row execute function public.set_updated_at();

-- Permission helpers used by every policy. SECURITY DEFINER so policies on organization_members do not
-- recurse into themselves.
create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.organization_members m
        where m.organization_id = p_organization_id
          and m.user_id = (select auth.uid())
          and m.status = 'active'
    );
$$;

create or replace function public.has_org_role(p_organization_id uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.organization_members m
        where m.organization_id = p_organization_id
          and m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.role = any (p_roles)
    );
$$;

-- Role groups (mirror src/constants/permissions.constant.ts)
--   settings managers : owner, admin
--   accounting        : owner, admin, accountant
--   issuers           : owner, admin, accountant, cashier

-- Owners can only be granted or changed by owners, and an organization always keeps one active owner.
create or replace function public.protect_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_actor uuid := auth.uid();
    v_remaining_owners int;
begin
    -- An invited user accepting their own invitation (see accept_invitations)
    if tg_op = 'UPDATE' and old.user_id = v_actor and old.status = 'invited' and new.status = 'active'
        and new.role = old.role then
        return new;
    end if;

    if v_actor is not null and not public.has_org_role(coalesce(new.organization_id, old.organization_id), array['owner']::public.member_role[]) then
        if tg_op = 'INSERT' and new.role = 'owner'
            and not exists (select 1 from public.organization_members where organization_id = new.organization_id) then
            null; -- the first member bootstraps a new organization (create_organization)
        elsif (tg_op <> 'INSERT' and old.role = 'owner') or (tg_op <> 'DELETE' and new.role = 'owner') then
            raise exception 'Only an owner can grant or change owner access.' using errcode = '42501';
        end if;
    end if;

    if tg_op <> 'INSERT' and old.role = 'owner' and old.status = 'active'
        and (tg_op = 'DELETE' or new.role <> 'owner' or new.status <> 'active') then
        select count(*) into v_remaining_owners
        from public.organization_members
        where organization_id = old.organization_id and role = 'owner' and status = 'active' and id <> old.id;
        if v_remaining_owners = 0 then
            raise exception 'The organization must keep at least one active owner.' using errcode = '23514';
        end if;
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

create trigger organization_members_protect_owner
    before insert or update or delete on public.organization_members
    for each row execute function public.protect_owner_membership();

-- -----------------------------------------------------------------------------------------------------
-- Branches (head office = 00000) and document series
-- -----------------------------------------------------------------------------------------------------

create table public.branches (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    code text not null check (code ~ '^\d{5}$'),
    name text not null,
    address text not null,
    rdo_code text not null check (rdo_code ~ '^\d{3}[A-Za-z]?$'),
    is_head_office boolean not null default false,
    status public.branch_status not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (organization_id, code)
);

create unique index branches_one_head_office on public.branches (organization_id) where is_head_office;

create trigger branches_updated_at before update on public.branches
    for each row execute function public.set_updated_at();

create table public.document_series (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    branch_id uuid not null references public.branches (id) on delete restrict,
    document_type public.document_type not null,
    prefix text not null default '' check (prefix ~ '^[A-Za-z0-9-]*$'),
    start_number bigint not null check (start_number >= 1),
    end_number bigint not null,
    next_number bigint not null,
    padding int not null default 8 check (padding between 6 and 12),
    ac_number text not null,
    ac_date date not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (end_number >= start_number),
    check (next_number between start_number and end_number + 1),
    check (length(end_number::text) <= padding)
);

-- One active series per branch and document type
create unique index document_series_one_active on public.document_series (branch_id, document_type) where is_active;

create trigger document_series_updated_at before update on public.document_series
    for each row execute function public.set_updated_at();

-- Once a number has been used, the registered range and certificate cannot change (register a new series).
create or replace function public.protect_used_series()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if old.next_number > old.start_number and (
        new.prefix is distinct from old.prefix or
        new.start_number is distinct from old.start_number or
        new.end_number is distinct from old.end_number or
        new.padding is distinct from old.padding or
        new.ac_number is distinct from old.ac_number or
        new.ac_date is distinct from old.ac_date or
        new.branch_id is distinct from old.branch_id or
        new.document_type is distinct from old.document_type
    ) then
        raise exception 'This series has already been used. Register a new series instead of changing it.' using errcode = '23514';
    end if;
    if new.next_number < old.next_number then
        raise exception 'Serial numbers cannot be reused.' using errcode = '23514';
    end if;
    return new;
end;
$$;

create trigger document_series_protect_used before update on public.document_series
    for each row execute function public.protect_used_series();

create or replace function public.format_serial(p_prefix text, p_number bigint, p_padding int)
returns text
language sql
immutable
set search_path = ''
as $$
    select case when coalesce(p_prefix, '') = '' then lpad(p_number::text, greatest(p_padding, 6), '0')
                else p_prefix || '-' || lpad(p_number::text, greatest(p_padding, 6), '0') end;
$$;

-- -----------------------------------------------------------------------------------------------------
-- Customers and products
-- -----------------------------------------------------------------------------------------------------

create table public.customers (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    customer_type public.customer_type not null default 'business',
    registered_name text not null,
    business_name text,
    tin text check (tin is null or tin ~ '^\d{3}-\d{3}-\d{3}$'),
    branch_code text check (branch_code is null or branch_code ~ '^\d{5}$'),
    address text,
    email text,
    phone text,
    is_vat_registered boolean not null default false,
    is_active boolean not null default true,
    created_by uuid references auth.users (id) default auth.uid(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index customers_org_name_idx on public.customers (organization_id, registered_name);

create trigger customers_updated_at before update on public.customers
    for each row execute function public.set_updated_at();

create table public.products (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    sku text,
    name text not null,
    description text,
    unit text not null default 'pc',
    unit_price numeric(15, 4) not null default 0 check (unit_price >= 0),
    tax_treatment public.tax_treatment not null default 'vatable',
    is_service boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index products_org_name_idx on public.products (organization_id, name);
create unique index products_org_sku_idx on public.products (organization_id, sku) where sku is not null;

create trigger products_updated_at before update on public.products
    for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------------------------------
-- Invoices and memos
-- -----------------------------------------------------------------------------------------------------

create table public.invoices (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete restrict,
    branch_id uuid not null references public.branches (id) on delete restrict,
    series_id uuid references public.document_series (id) on delete restrict,
    document_type public.document_type not null,
    status public.invoice_status not null default 'draft',
    serial_number bigint,
    invoice_number text,
    invoice_date date not null,
    due_date date,
    payment_terms text,

    -- Buyer (copied from the customer so later customer edits never change the invoice)
    customer_id uuid references public.customers (id) on delete set null,
    buyer_name text,
    buyer_business_name text,
    buyer_tin text check (buyer_tin is null or buyer_tin ~ '^\d{3}-\d{3}-\d{3}$'),
    buyer_branch_code text check (buyer_branch_code is null or buyer_branch_code ~ '^\d{5}$'),
    buyer_address text,
    buyer_email text,
    buyer_is_vat_registered boolean not null default false,

    prices_include_vat boolean not null default true,
    withholding_tax_rate numeric(5, 4) not null default 0 check (withholding_tax_rate between 0 and 0.15),
    special_discount_type public.special_discount_type,
    special_discount_id_number text,
    special_discount_holder_name text,
    special_discount_holder_tin text,

    -- Credit/debit memos reference the invoice they adjust
    reference_invoice_id uuid references public.invoices (id) on delete restrict,
    adjustment_reason text,
    -- Replaces a manual invoice issued during system downtime (RMC 98-2026 Sec. IV.11)
    manual_invoice_reference text,
    notes text,
    currency text not null default 'PHP' check (currency = 'PHP'),

    -- Totals (recomputed from the lines when the document is issued)
    gross_amount numeric(15, 2) not null default 0,
    discount_amount numeric(15, 2) not null default 0,
    special_discount_amount numeric(15, 2) not null default 0,
    vatable_sales numeric(15, 2) not null default 0,
    vat_amount numeric(15, 2) not null default 0,
    zero_rated_sales numeric(15, 2) not null default 0,
    vat_exempt_sales numeric(15, 2) not null default 0,
    non_vat_sales numeric(15, 2) not null default 0,
    total_amount numeric(15, 2) not null default 0,
    withholding_tax_amount numeric(15, 2) not null default 0,
    amount_due numeric(15, 2) not null default 0,

    -- Seller snapshot taken at issue time
    seller_registered_name text,
    seller_business_name text,
    seller_tin text,
    seller_branch_code text,
    seller_address text,
    seller_vat_registration public.vat_registration,
    ac_number text,
    ac_date date,
    series_range text,
    pti_number text,

    -- Tamper evidence: SHA-256 of this document chained to the previous issued document
    integrity_hash text,
    previous_hash text,

    print_count int not null default 0,
    issued_at timestamptz,
    issued_by uuid references auth.users (id),
    voided_at timestamptz,
    voided_by uuid references auth.users (id),
    void_reason text,
    created_by uuid not null default auth.uid() references auth.users (id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (series_id, serial_number),
    check (status = 'draft' or (invoice_number is not null and serial_number is not null and integrity_hash is not null)),
    check (status <> 'voided' or (voided_at is not null and length(trim(void_reason)) >= 10)),
    check (document_type not in ('credit_memo', 'debit_memo') or reference_invoice_id is not null)
);

create index invoices_org_date_idx on public.invoices (organization_id, invoice_date desc);
create index invoices_org_status_idx on public.invoices (organization_id, status);
create index invoices_reference_idx on public.invoices (reference_invoice_id) where reference_invoice_id is not null;
create index invoices_customer_idx on public.invoices (customer_id);

create trigger invoices_updated_at before update on public.invoices
    for each row execute function public.set_updated_at();

create table public.invoice_lines (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid not null references public.invoices (id) on delete cascade,
    organization_id uuid not null references public.organizations (id) on delete restrict,
    line_number int not null check (line_number >= 1),
    product_id uuid references public.products (id) on delete set null,
    description text not null,
    unit text not null,
    quantity numeric(15, 4) not null check (quantity > 0),
    unit_price numeric(15, 4) not null check (unit_price >= 0),
    discount_amount numeric(15, 2) not null default 0 check (discount_amount >= 0),
    special_discount boolean not null default false,
    tax_treatment public.tax_treatment not null,
    gross_amount numeric(15, 2) not null,
    special_discount_amount numeric(15, 2) not null default 0,
    net_amount numeric(15, 2) not null,
    vat_amount numeric(15, 2) not null default 0,
    total_amount numeric(15, 2) not null,
    unique (invoice_id, line_number)
);

create index invoice_lines_invoice_idx on public.invoice_lines (invoice_id);

-- Issued and voided documents are immutable. Only these transitions are allowed:
--   draft  → anything (still editable)
--   issued → voided (with reason), print_count increments
--   voided → print_count increments
create or replace function public.enforce_invoice_immutability()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    v_mutable text[] := array['status', 'voided_at', 'voided_by', 'void_reason', 'print_count', 'updated_at'];
begin
    if tg_op = 'DELETE' then
        if old.status <> 'draft' then
            raise exception 'Issued documents cannot be deleted. Void the document instead.' using errcode = '42501';
        end if;
        return old;
    end if;

    if old.status = 'draft' then
        if new.status = 'voided' then
            raise exception 'A draft cannot be voided. Delete the draft instead.' using errcode = '23514';
        end if;
        return new;
    end if;

    if (to_jsonb(new) - v_mutable) is distinct from (to_jsonb(old) - v_mutable) then
        raise exception 'Issued documents cannot be changed. Void it or issue a credit/debit memo.' using errcode = '42501';
    end if;

    if old.status = 'issued' and new.status = 'draft' then
        raise exception 'An issued document cannot return to draft.' using errcode = '42501';
    end if;

    if old.status = 'voided' and (
        new.status <> 'voided' or new.void_reason is distinct from old.void_reason
        or new.voided_at is distinct from old.voided_at or new.voided_by is distinct from old.voided_by
    ) then
        raise exception 'A voided document cannot be changed.' using errcode = '42501';
    end if;

    if new.print_count < old.print_count then
        raise exception 'The print count cannot decrease.' using errcode = '42501';
    end if;

    return new;
end;
$$;

create trigger invoices_immutability before update or delete on public.invoices
    for each row execute function public.enforce_invoice_immutability();

create or replace function public.enforce_invoice_line_immutability()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    v_status public.invoice_status;
begin
    select status into v_status from public.invoices where id = coalesce(new.invoice_id, old.invoice_id);
    -- v_status is null while a draft is being deleted (cascade)
    if v_status is not null and v_status <> 'draft' then
        raise exception 'Lines of an issued document cannot be changed.' using errcode = '42501';
    end if;
    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

create trigger invoice_lines_immutability before insert or update or delete on public.invoice_lines
    for each row execute function public.enforce_invoice_line_immutability();

-- -----------------------------------------------------------------------------------------------------
-- BIR registrations, documents, EIS transmissions, coverage assessments
-- -----------------------------------------------------------------------------------------------------

create table public.registrations (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    registration_type public.registration_type not null,
    status public.registration_status not null default 'not_started',
    reference_number text,
    rdo_code text,
    system_name text,
    system_version text,
    filed_on date,
    approved_on date,
    due_on date,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (status <> 'approved' or (reference_number is not null and approved_on is not null))
);

create index registrations_org_idx on public.registrations (organization_id, registration_type);

create trigger registrations_updated_at before update on public.registrations
    for each row execute function public.set_updated_at();

-- EIS certification is due 6 months after the PTI (RMC 98-2026 Sec. IV.15)
create or replace function public.set_registration_due_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.registration_type = 'pti' and new.status = 'approved' and new.approved_on is not null then
        new.due_on := coalesce(new.due_on, (new.approved_on + interval '6 months')::date);
    end if;
    return new;
end;
$$;

create trigger registrations_due_date before insert or update on public.registrations
    for each row execute function public.set_registration_due_date();

create table public.compliance_documents (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    category public.document_category not null,
    title text not null,
    storage_path text not null unique,
    file_name text not null,
    mime_type text not null,
    file_size bigint not null check (file_size > 0),
    uploaded_by uuid references auth.users (id) default auth.uid(),
    created_at timestamptz not null default now()
);

create index compliance_documents_org_idx on public.compliance_documents (organization_id, category);

create table public.eis_transmissions (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete restrict,
    invoice_id uuid not null unique references public.invoices (id) on delete restrict,
    status public.transmission_status not null default 'queued',
    attempts int not null default 0,
    last_attempt_at timestamptz,
    -- Transmit within 3 calendar days of issue (RR 8-2022)
    due_at timestamptz not null,
    bir_reference text,
    response_code text,
    response_message text,
    payload_hash text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index eis_transmissions_org_status_idx on public.eis_transmissions (organization_id, status, due_at);

create trigger eis_transmissions_updated_at before update on public.eis_transmissions
    for each row execute function public.set_updated_at();

create table public.coverage_assessments (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete cascade,
    answers jsonb not null,
    result jsonb not null,
    assessed_by uuid references auth.users (id) default auth.uid(),
    created_at timestamptz not null default now()
);

create index coverage_assessments_org_idx on public.coverage_assessments (organization_id, created_at desc);

-- -----------------------------------------------------------------------------------------------------
-- Audit trail (append-only)
-- -----------------------------------------------------------------------------------------------------

create table public.audit_logs (
    id bigint generated always as identity primary key,
    organization_id uuid not null references public.organizations (id) on delete cascade,
    user_id uuid,
    user_email text,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    summary text not null,
    changes jsonb,
    created_at timestamptz not null default now()
);

create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create or replace function public.prevent_audit_log_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    raise exception 'The audit trail cannot be changed or deleted.' using errcode = '42501';
end;
$$;

create trigger audit_logs_append_only before update or delete on public.audit_logs
    for each row execute function public.prevent_audit_log_changes();

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
    v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
    v_row jsonb := coalesce(v_new, v_old);
    v_org uuid;
    v_action text := lower(tg_op);
    v_changes jsonb;
    v_label text;
    v_entity text := replace(tg_table_name, '_', ' ');
    v_user uuid := auth.uid();
begin
    v_org := case when tg_table_name = 'organizations' then (v_row ->> 'id')::uuid
                  else (v_row ->> 'organization_id')::uuid end;

    if tg_op = 'UPDATE' then
        select jsonb_object_agg(key, jsonb_build_object('from', v_old -> key, 'to', value))
        into v_changes
        from jsonb_each(v_new)
        where key not in ('updated_at') and v_old -> key is distinct from value;
        if v_changes is null then
            return new;
        end if;
    elsif tg_op = 'INSERT' then
        v_changes := v_new - array['created_at', 'updated_at'];
    else
        v_changes := v_old;
    end if;

    if tg_table_name = 'invoices' and tg_op = 'UPDATE' then
        if v_old ->> 'status' = 'draft' and v_new ->> 'status' = 'issued' then
            v_action := 'issue';
        elsif v_old ->> 'status' = 'issued' and v_new ->> 'status' = 'voided' then
            v_action := 'void';
        elsif v_changes ?& array['print_count'] and (select count(*) from jsonb_object_keys(v_changes)) = 1 then
            v_action := 'print';
        end if;
    end if;

    v_label := coalesce(
        v_row ->> 'invoice_number', v_row ->> 'registered_name', v_row ->> 'name', v_row ->> 'title',
        v_row ->> 'email', v_row ->> 'code', initcap(replace(v_row ->> 'registration_type', '_', ' ')),
        v_row ->> 'id'
    );

    insert into public.audit_logs (organization_id, user_id, user_email, action, entity_type, entity_id, summary, changes)
    values (
        v_org,
        v_user,
        (select email from auth.users where id = v_user),
        v_action,
        tg_table_name,
        (v_row ->> 'id')::uuid,
        initcap(v_action) || ' ' || v_entity || ': ' || coalesce(v_label, ''),
        v_changes
    );

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

create trigger audit_organizations after insert or update on public.organizations
    for each row execute function public.audit_row_change();
create trigger audit_organization_members after insert or update or delete on public.organization_members
    for each row execute function public.audit_row_change();
create trigger audit_branches after insert or update on public.branches
    for each row execute function public.audit_row_change();
create trigger audit_document_series after insert or update on public.document_series
    for each row execute function public.audit_row_change();
create trigger audit_customers after insert or update or delete on public.customers
    for each row execute function public.audit_row_change();
create trigger audit_products after insert or update or delete on public.products
    for each row execute function public.audit_row_change();
create trigger audit_invoices after insert or update or delete on public.invoices
    for each row execute function public.audit_row_change();
create trigger audit_registrations after insert or update or delete on public.registrations
    for each row execute function public.audit_row_change();
create trigger audit_compliance_documents after insert or delete on public.compliance_documents
    for each row execute function public.audit_row_change();
create trigger audit_eis_transmissions after insert or update on public.eis_transmissions
    for each row execute function public.audit_row_change();
create trigger audit_coverage_assessments after insert on public.coverage_assessments
    for each row execute function public.audit_row_change();

-- Records events that are not row changes (report exports, document downloads).
create or replace function public.log_audit_event(
    p_organization_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_summary text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if not public.is_org_member(p_organization_id) then
        raise exception 'Not a member of this organization.' using errcode = '42501';
    end if;
    insert into public.audit_logs (organization_id, user_id, user_email, action, entity_type, entity_id, summary)
    values (p_organization_id, auth.uid(), (select email from auth.users where id = auth.uid()),
            p_action, p_entity_type, p_entity_id, p_summary);
end;
$$;

-- -----------------------------------------------------------------------------------------------------
-- Workflows (RPC)
-- -----------------------------------------------------------------------------------------------------

-- Onboarding: creates the taxpayer, its head office branch and makes the caller the owner.
create or replace function public.create_organization(
    p_registered_name text,
    p_business_name text,
    p_tin text,
    p_vat_registration public.vat_registration,
    p_taxpayer_size public.taxpayer_size,
    p_rdo_code text,
    p_registered_address text,
    p_zip_code text,
    p_line_of_business text,
    p_email text,
    p_phone text,
    p_prices_include_vat boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user uuid := auth.uid();
    v_org uuid;
    v_profile public.profiles;
begin
    if v_user is null then
        raise exception 'Please sign in first.' using errcode = '42501';
    end if;

    select * into v_profile from public.profiles where id = v_user;

    insert into public.organizations (
        registered_name, business_name, tin, vat_registration, taxpayer_size, rdo_code, registered_address,
        zip_code, line_of_business, email, phone, prices_include_vat, created_by
    ) values (
        trim(p_registered_name), nullif(trim(p_business_name), ''), p_tin, p_vat_registration, p_taxpayer_size,
        upper(p_rdo_code), trim(p_registered_address), p_zip_code, nullif(trim(p_line_of_business), ''),
        nullif(trim(p_email), ''), nullif(trim(p_phone), ''), coalesce(p_prices_include_vat, true), v_user
    ) returning id into v_org;

    insert into public.organization_members (organization_id, user_id, role, status, email, full_name)
    values (v_org, v_user, 'owner', 'active', coalesce(v_profile.email, ''), coalesce(v_profile.full_name, ''));

    insert into public.branches (organization_id, code, name, address, rdo_code, is_head_office)
    values (v_org, '00000', 'Head Office', trim(p_registered_address), upper(p_rdo_code), true);

    return v_org;
end;
$$;

-- Saves a draft and replaces its lines in one transaction. Amounts are computed by the API
-- (src/utils/invoices/calculateInvoice.ts) and totals are summed here from the lines.
create or replace function public.save_invoice_draft(p_invoice_id uuid, p_invoice jsonb, p_lines jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
    v_id uuid := p_invoice_id;
    v_org uuid := (p_invoice ->> 'organization_id')::uuid;
begin
    if v_id is null then
        insert into public.invoices (
            organization_id, branch_id, document_type, invoice_date, due_date, payment_terms, customer_id,
            buyer_name, buyer_business_name, buyer_tin, buyer_branch_code, buyer_address, buyer_email,
            buyer_is_vat_registered, prices_include_vat, withholding_tax_rate, special_discount_type,
            special_discount_id_number, special_discount_holder_name, special_discount_holder_tin,
            reference_invoice_id, adjustment_reason, manual_invoice_reference, notes
        )
        select organization_id, branch_id, document_type, invoice_date, due_date, payment_terms, customer_id,
            buyer_name, buyer_business_name, buyer_tin, buyer_branch_code, buyer_address, buyer_email,
            coalesce(buyer_is_vat_registered, false), coalesce(prices_include_vat, true),
            coalesce(withholding_tax_rate, 0), special_discount_type, special_discount_id_number,
            special_discount_holder_name, special_discount_holder_tin, reference_invoice_id, adjustment_reason,
            manual_invoice_reference, notes
        from jsonb_populate_record(null::public.invoices, p_invoice)
        returning id into v_id;
    else
        update public.invoices i set
            branch_id = r.branch_id, document_type = r.document_type, invoice_date = r.invoice_date,
            due_date = r.due_date, payment_terms = r.payment_terms, customer_id = r.customer_id,
            buyer_name = r.buyer_name, buyer_business_name = r.buyer_business_name, buyer_tin = r.buyer_tin,
            buyer_branch_code = r.buyer_branch_code, buyer_address = r.buyer_address, buyer_email = r.buyer_email,
            buyer_is_vat_registered = coalesce(r.buyer_is_vat_registered, false),
            prices_include_vat = coalesce(r.prices_include_vat, true),
            withholding_tax_rate = coalesce(r.withholding_tax_rate, 0),
            special_discount_type = r.special_discount_type, special_discount_id_number = r.special_discount_id_number,
            special_discount_holder_name = r.special_discount_holder_name,
            special_discount_holder_tin = r.special_discount_holder_tin,
            reference_invoice_id = r.reference_invoice_id, adjustment_reason = r.adjustment_reason,
            manual_invoice_reference = r.manual_invoice_reference, notes = r.notes
        from jsonb_populate_record(null::public.invoices, p_invoice) r
        where i.id = v_id and i.status = 'draft';
        if not found then
            raise exception 'Only drafts can be edited.' using errcode = '42501';
        end if;
        delete from public.invoice_lines where invoice_id = v_id;
    end if;

    -- Lines always belong to the invoice's organization, whatever the payload says
    select organization_id into v_org from public.invoices where id = v_id;

    insert into public.invoice_lines (
        invoice_id, organization_id, line_number, product_id, description, unit, quantity, unit_price,
        discount_amount, special_discount, tax_treatment, gross_amount, special_discount_amount, net_amount,
        vat_amount, total_amount
    )
    select v_id, v_org, l.line_number, l.product_id, l.description, l.unit, l.quantity, l.unit_price,
        coalesce(l.discount_amount, 0), coalesce(l.special_discount, false), l.tax_treatment, l.gross_amount,
        coalesce(l.special_discount_amount, 0), l.net_amount, coalesce(l.vat_amount, 0), l.total_amount
    from jsonb_populate_recordset(null::public.invoice_lines, p_lines) l;

    perform public.refresh_invoice_totals(v_id);
    return v_id;
end;
$$;

create or replace function public.refresh_invoice_totals(p_invoice_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
    update public.invoices i set
        gross_amount = t.gross_amount,
        discount_amount = t.discount_amount,
        special_discount_amount = t.special_discount_amount,
        vatable_sales = t.vatable_sales,
        vat_amount = t.vat_amount,
        zero_rated_sales = t.zero_rated_sales,
        vat_exempt_sales = t.vat_exempt_sales,
        non_vat_sales = t.non_vat_sales,
        total_amount = t.total_amount,
        withholding_tax_amount = round(t.net_amount * i.withholding_tax_rate, 2),
        amount_due = t.total_amount - round(t.net_amount * i.withholding_tax_rate, 2)
    from (
        select
            coalesce(sum(gross_amount), 0) as gross_amount,
            coalesce(sum(discount_amount), 0) as discount_amount,
            coalesce(sum(special_discount_amount), 0) as special_discount_amount,
            coalesce(sum(net_amount) filter (where tax_treatment = 'vatable'), 0) as vatable_sales,
            coalesce(sum(vat_amount), 0) as vat_amount,
            coalesce(sum(net_amount) filter (where tax_treatment = 'zero_rated'), 0) as zero_rated_sales,
            coalesce(sum(net_amount) filter (where tax_treatment = 'vat_exempt'), 0) as vat_exempt_sales,
            coalesce(sum(net_amount) filter (where tax_treatment = 'non_vat'), 0) as non_vat_sales,
            coalesce(sum(total_amount), 0) as total_amount,
            coalesce(sum(net_amount), 0) as net_amount
        from public.invoice_lines where invoice_id = p_invoice_id
    ) t
    where i.id = p_invoice_id and i.status = 'draft';
$$;

-- Issues a draft: assigns the next serial number from the branch's active series, snapshots the seller
-- and registration details, computes the integrity hash and (when enabled) queues EIS transmission.
create or replace function public.issue_invoice(p_invoice_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_invoice public.invoices;
    v_org public.organizations;
    v_branch public.branches;
    v_series public.document_series;
    v_reference public.invoices;
    v_serial bigint;
    v_number text;
    v_previous_hash text;
    v_pti text;
    v_credited numeric;
    v_payload text;
begin
    select * into v_invoice from public.invoices where id = p_invoice_id for update;
    if not found then
        raise exception 'Document not found.' using errcode = 'P0002';
    end if;

    if not public.has_org_role(v_invoice.organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[]) then
        raise exception 'You do not have permission to issue documents.' using errcode = '42501';
    end if;
    if v_invoice.document_type in ('credit_memo', 'debit_memo')
        and not public.has_org_role(v_invoice.organization_id, array['owner', 'admin', 'accountant']::public.member_role[]) then
        raise exception 'Only owners, administrators and accountants can issue credit or debit memos.' using errcode = '42501';
    end if;
    if v_invoice.status <> 'draft' then
        raise exception 'Only drafts can be issued.' using errcode = '23514';
    end if;
    if not exists (select 1 from public.invoice_lines where invoice_id = p_invoice_id) then
        raise exception 'Add at least one line before issuing.' using errcode = '23514';
    end if;
    if v_invoice.invoice_date > (now() at time zone 'Asia/Manila')::date then
        raise exception 'The document date cannot be in the future.' using errcode = '23514';
    end if;

    -- Serialize issuing per organization so numbers and the hash chain are strictly ordered
    perform pg_advisory_xact_lock(hashtextextended(v_invoice.organization_id::text, 0));

    select * into v_org from public.organizations where id = v_invoice.organization_id;
    select * into v_branch from public.branches where id = v_invoice.branch_id;
    if v_branch.status <> 'active' then
        raise exception 'Branch % is closed.' , v_branch.code using errcode = '23514';
    end if;

    if v_invoice.document_type in ('credit_memo', 'debit_memo') then
        select * into v_reference from public.invoices where id = v_invoice.reference_invoice_id;
        if not found or v_reference.organization_id <> v_invoice.organization_id or v_reference.status <> 'issued'
            or v_reference.document_type not in ('sales_invoice', 'service_invoice') then
            raise exception 'A memo must reference an issued invoice of this organization.' using errcode = '23514';
        end if;
        if coalesce(trim(v_invoice.adjustment_reason), '') = '' then
            raise exception 'Enter the reason for the adjustment.' using errcode = '23514';
        end if;
        if v_invoice.document_type = 'credit_memo' then
            select coalesce(sum(total_amount), 0) into v_credited
            from public.invoices
            where reference_invoice_id = v_reference.id and document_type = 'credit_memo' and status = 'issued';
            perform public.refresh_invoice_totals(p_invoice_id);
            select * into v_invoice from public.invoices where id = p_invoice_id;
            if v_invoice.total_amount > v_reference.total_amount - v_credited then
                raise exception 'The credit memo exceeds the remaining amount of invoice %.', v_reference.invoice_number using errcode = '23514';
            end if;
        end if;
    end if;

    perform public.refresh_invoice_totals(p_invoice_id);
    select * into v_invoice from public.invoices where id = p_invoice_id;
    if v_invoice.total_amount <= 0 then
        raise exception 'The total must be more than zero.' using errcode = '23514';
    end if;

    select * into v_series
    from public.document_series
    where branch_id = v_invoice.branch_id and document_type = v_invoice.document_type and is_active
    for update;
    if not found then
        raise exception 'There is no active % series for branch %. Add one in Administration → Invoice Series.',
            replace(v_invoice.document_type::text, '_', ' '), v_branch.code using errcode = '23514';
    end if;
    if v_series.next_number > v_series.end_number then
        raise exception 'The % series for branch % is used up. Register a new series.',
            replace(v_invoice.document_type::text, '_', ' '), v_branch.code using errcode = '23514';
    end if;

    v_serial := v_series.next_number;
    v_number := public.format_serial(v_series.prefix, v_serial, v_series.padding);
    update public.document_series set next_number = next_number + 1 where id = v_series.id;

    select reference_number into v_pti
    from public.registrations
    where organization_id = v_invoice.organization_id and registration_type = 'pti' and status = 'approved'
    order by approved_on desc nulls last
    limit 1;

    select integrity_hash into v_previous_hash
    from public.invoices
    where organization_id = v_invoice.organization_id and status <> 'draft' and id <> p_invoice_id
    order by issued_at desc, id desc
    limit 1;

    v_payload := jsonb_build_object(
        'id', v_invoice.id,
        'document_type', v_invoice.document_type,
        'invoice_number', v_number,
        'invoice_date', v_invoice.invoice_date,
        'seller_tin', v_org.tin,
        'seller_branch_code', v_branch.code,
        'buyer_name', v_invoice.buyer_name,
        'buyer_tin', v_invoice.buyer_tin,
        'total_amount', v_invoice.total_amount,
        'vat_amount', v_invoice.vat_amount,
        'lines', (
            select jsonb_agg(jsonb_build_object(
                'n', line_number, 'd', description, 'q', quantity, 'p', unit_price, 't', tax_treatment,
                'net', net_amount, 'vat', vat_amount, 'total', total_amount) order by line_number)
            from public.invoice_lines where invoice_id = p_invoice_id
        )
    )::text;

    update public.invoices set
        status = 'issued',
        series_id = v_series.id,
        serial_number = v_serial,
        invoice_number = v_number,
        seller_registered_name = v_org.registered_name,
        seller_business_name = v_org.business_name,
        seller_tin = v_org.tin,
        seller_branch_code = v_branch.code,
        seller_address = v_branch.address,
        seller_vat_registration = v_org.vat_registration,
        ac_number = v_series.ac_number,
        ac_date = v_series.ac_date,
        series_range = public.format_serial(v_series.prefix, v_series.start_number, v_series.padding)
            || ' to ' || public.format_serial(v_series.prefix, v_series.end_number, v_series.padding),
        pti_number = v_pti,
        previous_hash = v_previous_hash,
        integrity_hash = encode(extensions.digest(coalesce(v_previous_hash, '') || v_payload, 'sha256'), 'hex'),
        issued_at = now(),
        issued_by = auth.uid()
    where id = p_invoice_id;

    if v_org.eis_transmission_enabled then
        insert into public.eis_transmissions (organization_id, invoice_id, due_at)
        values (v_invoice.organization_id, p_invoice_id, now() + interval '3 days');
    end if;

    return p_invoice_id;
end;
$$;

-- Voids an issued document. Not allowed once BIR has received it — issue a credit memo instead
-- (RMC 98-2026 Sec. IV.8).
create or replace function public.void_invoice(p_invoice_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_invoice public.invoices;
begin
    select * into v_invoice from public.invoices where id = p_invoice_id for update;
    if not found then
        raise exception 'Document not found.' using errcode = 'P0002';
    end if;
    if not public.has_org_role(v_invoice.organization_id, array['owner', 'admin', 'accountant']::public.member_role[]) then
        raise exception 'Only owners, administrators and accountants can void documents.' using errcode = '42501';
    end if;
    if v_invoice.status <> 'issued' then
        raise exception 'Only issued documents can be voided.' using errcode = '23514';
    end if;
    if length(trim(coalesce(p_reason, ''))) < 10 then
        raise exception 'Explain why the document is voided (at least 10 characters).' using errcode = '23514';
    end if;
    if exists (select 1 from public.invoices where reference_invoice_id = p_invoice_id and status = 'issued') then
        raise exception 'Void the credit/debit memos issued against this invoice first.' using errcode = '23514';
    end if;
    if exists (select 1 from public.eis_transmissions where invoice_id = p_invoice_id and status in ('sent', 'accepted')) then
        raise exception 'This document was already transmitted to BIR. Issue a credit memo instead of voiding it.' using errcode = '23514';
    end if;

    update public.eis_transmissions
    set status = 'cancelled', response_message = 'Document voided before transmission.'
    where invoice_id = p_invoice_id and status in ('queued', 'failed', 'rejected');

    update public.invoices
    set status = 'voided', voided_at = now(), voided_by = auth.uid(), void_reason = trim(p_reason)
    where id = p_invoice_id;
end;
$$;

-- Counts prints so copies after the first are marked "REPRINT" (RMC 5-2021 Annex B).
create or replace function public.record_invoice_print(p_invoice_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_invoice public.invoices;
begin
    select * into v_invoice from public.invoices where id = p_invoice_id for update;
    if not found or not public.is_org_member(v_invoice.organization_id) then
        raise exception 'Document not found.' using errcode = 'P0002';
    end if;
    if v_invoice.status = 'draft' then
        return 0;
    end if;
    update public.invoices set print_count = print_count + 1 where id = p_invoice_id;
    return v_invoice.print_count + 1;
end;
$$;

-- Activates the caller's pending invitations (called after they follow the invitation email link).
create or replace function public.accept_invitations()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_count int;
begin
    update public.organization_members
    set status = 'active'
    where user_id = auth.uid() and status = 'invited';
    get diagnostics v_count = row_count;
    return v_count;
end;
$$;

-- Stamps the caller's password change (used to enforce the 30-day rotation).
create or replace function public.mark_password_changed()
returns void
language sql
security definer
set search_path = ''
as $$
    update public.profiles set password_changed_at = now() where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------------------------------
-- Row-level security
-- -----------------------------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.branches enable row level security;
alter table public.document_series enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.registrations enable row level security;
alter table public.compliance_documents enable row level security;
alter table public.eis_transmissions enable row level security;
alter table public.coverage_assessments enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: your own row
create policy profiles_select_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
    using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Organizations
create policy organizations_select on public.organizations for select to authenticated
    using (public.is_org_member(id));
create policy organizations_update on public.organizations for update to authenticated
    using (public.has_org_role(id, array['owner', 'admin']::public.member_role[]))
    with check (public.has_org_role(id, array['owner', 'admin']::public.member_role[]));

-- Members: everyone sees their organization's members (and their own memberships); owners/admins manage
create policy members_select on public.organization_members for select to authenticated
    using (user_id = (select auth.uid()) or public.is_org_member(organization_id));
create policy members_insert on public.organization_members for insert to authenticated
    with check (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));
create policy members_update on public.organization_members for update to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]))
    with check (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));
create policy members_delete on public.organization_members for delete to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));

-- Branches and series: settings managers
create policy branches_select on public.branches for select to authenticated using (public.is_org_member(organization_id));
create policy branches_insert on public.branches for insert to authenticated
    with check (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));
create policy branches_update on public.branches for update to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]))
    with check (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));

create policy series_select on public.document_series for select to authenticated using (public.is_org_member(organization_id));
create policy series_insert on public.document_series for insert to authenticated
    with check (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));
create policy series_update on public.document_series for update to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]))
    with check (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));

-- Customers: issuers create and edit; accounting deletes
create policy customers_select on public.customers for select to authenticated using (public.is_org_member(organization_id));
create policy customers_insert on public.customers for insert to authenticated
    with check (public.has_org_role(organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[]));
create policy customers_update on public.customers for update to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[]))
    with check (public.has_org_role(organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[]));
create policy customers_delete on public.customers for delete to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]));

-- Products: accounting
create policy products_select on public.products for select to authenticated using (public.is_org_member(organization_id));
create policy products_insert on public.products for insert to authenticated
    with check (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]));
create policy products_update on public.products for update to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]))
    with check (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]));
create policy products_delete on public.products for delete to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]));

-- Invoices: issuers work on drafts; status changes only through issue_invoice / void_invoice
create policy invoices_select on public.invoices for select to authenticated using (public.is_org_member(organization_id));
create policy invoices_insert on public.invoices for insert to authenticated
    with check (
        status = 'draft'
        and created_by = (select auth.uid())
        and public.has_org_role(organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[])
        and (document_type in ('sales_invoice', 'service_invoice')
             or public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]))
    );
create policy invoices_update on public.invoices for update to authenticated
    using (status = 'draft' and public.has_org_role(organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[]))
    with check (
        status = 'draft'
        and public.has_org_role(organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[])
        and (document_type in ('sales_invoice', 'service_invoice')
             or public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]))
    );
create policy invoices_delete on public.invoices for delete to authenticated
    using (status = 'draft' and public.has_org_role(organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[]));

create policy invoice_lines_select on public.invoice_lines for select to authenticated using (public.is_org_member(organization_id));
create policy invoice_lines_insert on public.invoice_lines for insert to authenticated
    with check (public.has_org_role(organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[]));
create policy invoice_lines_update on public.invoice_lines for update to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[]))
    with check (public.has_org_role(organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[]));
create policy invoice_lines_delete on public.invoice_lines for delete to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin', 'accountant', 'cashier']::public.member_role[]));

-- Compliance: accounting manages; owners/admins delete
create policy registrations_select on public.registrations for select to authenticated using (public.is_org_member(organization_id));
create policy registrations_insert on public.registrations for insert to authenticated
    with check (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]));
create policy registrations_update on public.registrations for update to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]))
    with check (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]));
create policy registrations_delete on public.registrations for delete to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));

create policy documents_select on public.compliance_documents for select to authenticated using (public.is_org_member(organization_id));
create policy documents_insert on public.compliance_documents for insert to authenticated
    with check (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]));
create policy documents_delete on public.compliance_documents for delete to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin']::public.member_role[]));

create policy transmissions_select on public.eis_transmissions for select to authenticated using (public.is_org_member(organization_id));
create policy transmissions_update on public.eis_transmissions for update to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]))
    with check (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]));

create policy assessments_select on public.coverage_assessments for select to authenticated using (public.is_org_member(organization_id));
create policy assessments_insert on public.coverage_assessments for insert to authenticated
    with check (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]));

create policy audit_logs_select on public.audit_logs for select to authenticated
    using (public.has_org_role(organization_id, array['owner', 'admin', 'accountant']::public.member_role[]));

-- Anonymous visitors never touch application data; functions are callable by signed-in users only
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;

-- -----------------------------------------------------------------------------------------------------
-- Storage: private bucket for compliance documents, one folder per organization (<org id>/<file>)
-- -----------------------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('compliance-documents', 'compliance-documents', false, 10485760,
        array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy compliance_documents_read on storage.objects for select to authenticated
    using (bucket_id = 'compliance-documents'
           and public.is_org_member(((storage.foldername(name))[1])::uuid));
create policy compliance_documents_upload on storage.objects for insert to authenticated
    with check (bucket_id = 'compliance-documents'
                and public.has_org_role(((storage.foldername(name))[1])::uuid, array['owner', 'admin', 'accountant']::public.member_role[]));
create policy compliance_documents_remove on storage.objects for delete to authenticated
    using (bucket_id = 'compliance-documents'
           and public.has_org_role(((storage.foldername(name))[1])::uuid, array['owner', 'admin']::public.member_role[]));
