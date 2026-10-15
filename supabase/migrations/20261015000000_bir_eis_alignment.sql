-- =====================================================================================================
-- Align EIS transmission with the BIR EIS e-invoice API (development guide v2.2/2.3) and the CAS
-- e-invoice JSON File Format v2.1. See docs/bir-eis/ for the requirements and the mapping.
--
--   * eis_connections  — per-organization EIS credentials (secrets encrypted by the app; service role only)
--   * eis_submissions  — one row per Invoice Issuance call (submitId → ackId → processing result)
--   * eis_documents    — the e-invoices actually sent: one per document and tax classification, because
--                        mixed VATable / zero-rated / exempt documents are transmitted separately
--   * invoices.correction_code — CorrectionCd reported for credit/debit memos
--   * claim_eis_transmissions() / eis_pending_organizations() — job helpers (no double sending, no
--     organizations skipped)
--   * void_invoice() — also blocked once any part of a document reached BIR
-- =====================================================================================================

-- -----------------------------------------------------------------------------------------------------
-- Correction code on memos (JSON format field 7: 01 error, 02 duplication, 03 addition/reduction,
-- 04 cancellation, 05 return, 09 others)
-- -----------------------------------------------------------------------------------------------------

alter table public.invoices
    add column correction_code text
        check (correction_code is null or correction_code in ('01', '02', '03', '04', '05', '09'));

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
            reference_invoice_id, adjustment_reason, correction_code, manual_invoice_reference, notes
        )
        select organization_id, branch_id, document_type, invoice_date, due_date, payment_terms, customer_id,
            buyer_name, buyer_business_name, buyer_tin, buyer_branch_code, buyer_address, buyer_email,
            coalesce(buyer_is_vat_registered, false), coalesce(prices_include_vat, true),
            coalesce(withholding_tax_rate, 0), special_discount_type, special_discount_id_number,
            special_discount_holder_name, special_discount_holder_tin, reference_invoice_id, adjustment_reason,
            correction_code, manual_invoice_reference, notes
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
            correction_code = r.correction_code,
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

-- -----------------------------------------------------------------------------------------------------
-- EIS credentials issued on the EIS Certification portal (eis-cert.bir.gov.ph). Columns ending in
-- `_sealed` are AES-256-GCM encrypted by the app with EIS_CREDENTIALS_KEY. No policies: only the service
-- role can read or write this table; the API checks permissions and never returns the secrets.
-- -----------------------------------------------------------------------------------------------------

create table public.eis_connections (
    organization_id uuid primary key references public.organizations (id) on delete cascade,
    environment text not null default 'sandbox' check (environment in ('sandbox', 'production')),
    api_base_url text not null check (api_base_url ~ '^https://'),
    accreditation_id text not null check (accreditation_id ~ '^\d{8}$'),
    application_id text not null,
    user_id text not null,
    jws_key_id text not null,
    application_key_sealed text not null,
    password_sealed text not null,
    jws_private_key_sealed text not null,
    -- Authentication token and session secret key, reused until they expire (6 hours)
    auth_token_sealed text,
    session_key_sealed text,
    token_expires_at timestamptz,
    last_tested_at timestamptz,
    last_test_ok boolean,
    last_test_message text,
    updated_by uuid references auth.users (id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger eis_connections_updated_at before update on public.eis_connections
    for each row execute function public.set_updated_at();

alter table public.eis_connections enable row level security;
revoke all on public.eis_connections from anon, authenticated;

-- -----------------------------------------------------------------------------------------------------
-- Invoice Issuance calls and their processing results (API guide 7.2 and 7.3)
-- -----------------------------------------------------------------------------------------------------

create table public.eis_submissions (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete restrict,
    environment text not null check (environment in ('sandbox', 'production')),
    simulated boolean not null default false,
    accreditation_id text not null,
    submit_id text not null unique,
    ack_id text,
    -- processing (02) → completed (01) or unavailable (03, e.g. FRS002 decryption failure)
    status text not null default 'processing' check (status in ('processing', 'completed', 'unavailable')),
    document_count int not null check (document_count between 1 and 100),
    success_count int,
    fail_count int,
    response_code text,
    response_message text,
    submitted_at timestamptz not null default now(),
    next_check_at timestamptz not null default now(),
    check_attempts int not null default 0,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index eis_submissions_org_idx on public.eis_submissions (organization_id, submitted_at desc);
create index eis_submissions_pending_idx on public.eis_submissions (next_check_at) where status = 'processing';

create trigger eis_submissions_updated_at before update on public.eis_submissions
    for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------------------------------
-- e-Invoices sent to the EIS: one per issued document and tax classification (TransClass). `payload` is
-- the exact JSON that was signed and sent, kept as evidence of what BIR received.
-- -----------------------------------------------------------------------------------------------------

create table public.eis_documents (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations (id) on delete restrict,
    transmission_id uuid not null references public.eis_transmissions (id) on delete restrict,
    invoice_id uuid not null references public.invoices (id) on delete restrict,
    trans_class text not null check (trans_class in ('01', '02', '03', '04')),
    eis_unique_id text not null unique check (eis_unique_id ~ '^[0-9A-Za-z]{24}$'),
    accreditation_id text not null,
    payload jsonb not null,
    status public.transmission_status not null default 'queued',
    submission_id uuid references public.eis_submissions (id) on delete restrict,
    result_code text,
    result_message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (transmission_id, trans_class)
);

create index eis_documents_invoice_idx on public.eis_documents (invoice_id);
create index eis_documents_submission_idx on public.eis_documents (submission_id) where submission_id is not null;

create trigger eis_documents_updated_at before update on public.eis_documents
    for each row execute function public.set_updated_at();

alter table public.eis_submissions enable row level security;
alter table public.eis_documents enable row level security;
revoke all on public.eis_submissions, public.eis_documents from anon;

-- Members can see what was sent; only the transmission job (service role) writes
create policy eis_submissions_select on public.eis_submissions for select to authenticated
    using (public.is_org_member(organization_id));
create policy eis_documents_select on public.eis_documents for select to authenticated
    using (public.is_org_member(organization_id));

-- -----------------------------------------------------------------------------------------------------
-- Job helpers
-- -----------------------------------------------------------------------------------------------------

alter table public.eis_transmissions add column claimed_at timestamptz;

create index eis_transmissions_pending_idx on public.eis_transmissions (due_at)
    where status in ('queued', 'failed');

-- Claims transmissions to send so two runs (scheduled job, "Send now") never send the same document twice.
-- A claim expires after 10 minutes in case a run dies. With p_transmission_id, claims that one transmission
-- (manual retry, including rejected ones) regardless of the automatic attempt limit.
create or replace function public.claim_eis_transmissions(
    p_organization_id uuid,
    p_limit int,
    p_max_attempts int,
    p_transmission_id uuid default null
)
returns setof uuid
language sql
security definer
set search_path = ''
as $$
    update public.eis_transmissions t
    set claimed_at = now()
    where t.id in (
        select c.id
        from public.eis_transmissions c
        where c.organization_id = p_organization_id
          and (c.claimed_at is null or c.claimed_at < now() - interval '10 minutes')
          and (
              (p_transmission_id is null and c.status in ('queued', 'failed') and c.attempts < p_max_attempts)
              or (c.id = p_transmission_id and c.status in ('queued', 'failed', 'rejected'))
          )
        order by c.due_at
        limit p_limit
        for update skip locked
    )
    returning t.id;
$$;

-- Organizations with work for the transmission job: documents to send or results to collect.
create or replace function public.eis_pending_organizations(p_max_attempts int)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
    select organization_id from public.eis_transmissions
    where status in ('queued', 'failed') and attempts < p_max_attempts
    union
    select organization_id from public.eis_submissions
    where status = 'processing' and next_check_at <= now();
$$;

-- The job's claim marker is bookkeeping, not a change worth an audit entry
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
        where key not in ('updated_at', 'claimed_at') and v_old -> key is distinct from value;
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

revoke execute on function public.claim_eis_transmissions(uuid, int, int, uuid) from public, anon, authenticated;
revoke execute on function public.eis_pending_organizations(int) from public, anon, authenticated;
grant execute on function public.claim_eis_transmissions(uuid, int, int, uuid) to service_role;
grant execute on function public.eis_pending_organizations(int) to service_role;

-- -----------------------------------------------------------------------------------------------------
-- Voiding: blocked once any e-invoice of the document was sent to or registered by BIR (a mixed document
-- is several e-invoices). Issue a credit memo instead (RMC 98-2026 Sec. IV.8).
-- -----------------------------------------------------------------------------------------------------

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
    if exists (select 1 from public.eis_transmissions where invoice_id = p_invoice_id and status in ('sent', 'accepted'))
        or exists (select 1 from public.eis_documents where invoice_id = p_invoice_id and status in ('sent', 'accepted')) then
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
