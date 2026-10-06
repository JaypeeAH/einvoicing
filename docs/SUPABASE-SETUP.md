# Supabase setup (test and production)

The app uses Supabase for the database (Postgres with row-level security), authentication and private file
storage. Create **two separate Supabase projects** — one for **test/UAT** and one for **production** — so test
invoices never mix with real ones. Repeat every step below for each project.

The whole schema is in one file: [`supabase/migrations/20261006000000_initial_schema.sql`](../supabase/migrations/20261006000000_initial_schema.sql).

---

## 1. Create the projects

1. Go to <https://supabase.com/dashboard> → **New project**.
2. Name them e.g. `einvoicing-test` and `einvoicing-prod`.
3. Region: **Southeast Asia (Singapore)** — closest to the Philippines.
4. Save the database password in your password manager.
5. Production: use a paid plan so you get daily backups, Point-in-Time Recovery and the session controls
   described in step 4.

## 2. Run the schema

Pick **one** option.

### Option A — SQL Editor (no tools needed)

1. Open the project → **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase/migrations/20261006000000_initial_schema.sql`.
3. Click **Run**. It should finish with "Success. No rows returned".

### Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>     # the ref is in the project URL
npx supabase db push                                   # applies supabase/migrations/*
```

Use `--project-ref` of the test project first, check everything works, then repeat for production.

### Check it worked

Run this in the SQL Editor — it should list 14 tables, all with `rowsecurity = true`:

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
```

And this should return one private bucket:

```sql
select id, public from storage.buckets where id = 'compliance-documents';
```

## 3. Copy the keys into your environment

**Project Settings → API Keys / Data API:**

| Supabase value                                            | Environment variable                   |
| --------------------------------------------------------- | -------------------------------------- |
| Project URL                                               | `NEXT_PUBLIC_SUPABASE_URL`             |
| Publishable key (`sb_publishable_…`) or legacy `anon` key | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Secret key (`sb_secret_…`) or legacy `service_role` key   | `SUPABASE_SECRET_KEY` (server only!)   |

- Local development: copy `.env.example` → `.env.local` and fill in the **test** project values.
- Test deployment: use `.env.test.example` as the template (Vercel "Preview" environment).
- Production deployment: use `.env.production.example` (Vercel "Production" environment).

The secret key bypasses row-level security. Only put it in server-side environment variables — never in a
`NEXT_PUBLIC_` variable, never in the repository.

## 4. Authentication settings

**Authentication → URL Configuration**

- **Site URL**: your app URL (`NEXT_PUBLIC_APP_URL`), e.g. `https://test-einvoicing.vercel.app`. Email links
  are built from this, so a wrong value sends your team to the wrong place.
- **Redirect URLs**: add a wildcard for every origin that may receive a link — otherwise Supabase quietly
  falls back to the Site URL and links look like they "just open the homepage":
    ```
    https://test-einvoicing.vercel.app/**
    http://localhost:3000/**
    ```

**Authentication → Sign In / Providers → Email**

- Enable **Email** sign-in and **Confirm email**.
- **Minimum password length: 10** and **Password requirements: letters and digits** — the CAS security
  standard (RMC 5-2021 Annex B) requires alphanumeric passwords. The app also enforces this and forces a
  password change every 30 days (`PASSWORD_MAX_AGE_DAYS`).
- Enable **Leaked password protection** (paid plans).

**Authentication → Sessions** (paid plans) — CAS requires no concurrent logins under one user ID:

- Turn on **Enforce single session per user**.
- Set an **inactivity timeout** (e.g. 8 hours).

**Authentication → Rate Limits / Attack Protection**: keep the sign-in rate limits on (blocks repeated failed
sign-ins). Optionally enable CAPTCHA (requires adding the CAPTCHA widget to the sign-in form).

**Authentication → Emails → SMTP Settings**: configure your own SMTP server for production (Supabase's
built-in sender is heavily rate-limited and meant for testing).

**Authentication → Emails → Templates** — paste in the branded templates from
[`email-templates/`](./email-templates/), one per Supabase template. Their README lists the subject lines and
explains why the links must point at the app's `/auth/callback` route rather than `{{ .ConfirmationURL }}`:

| Supabase template    | File                  | `type` in the link |
| -------------------- | --------------------- | ------------------ |
| Invite user          | `invite-user.html`    | `invite`           |
| Confirm signup       | `confirm-signup.html` | `signup`           |
| Reset password       | `reset-password.html` | `recovery`         |
| Magic Link           | `magic-link.html`     | `magiclink`        |
| Change email address | `change-email.html`   | `email_change`     |

Leaving the stock templates in place is what causes "the link just opens the homepage, and then my password
never works" — see the README for the detail.

## 4b. When the app URL changes

The address lives in exactly three places. Change all three together, or invitation and reset links will
point at the old site:

1. **Vercel → Settings → Environment Variables → `NEXT_PUBLIC_APP_URL`** (then redeploy). Invitation links
   are built from this; if it is missing, they point at `http://localhost:3000`.
2. **Supabase → Authentication → URL Configuration → Site URL** — what `{{ .SiteURL }}` becomes in emails.
3. **Supabase → Authentication → URL Configuration → Redirect URLs** — add the new `https://…/**` entry.

Keep the old entry in Redirect URLs until links already sent have expired (24 hours).

## 5. Schedule EIS transmissions

When an organization turns on **EIS transmission** (after BIR issues its Permit to Transmit), each issued
invoice is queued and must reach BIR within 3 days. Users can press **Send pending now**, and a scheduled job
should also call `GET /api/cron/transmissions` every 15–60 minutes with
`Authorization: Bearer <CRON_SECRET>`.

**Option A — Supabase pg_cron** (works with any host). Enable the `pg_cron` and `pg_net` extensions
(**Database → Extensions**), then run:

```sql
select cron.schedule(
    'eis-transmissions',
    '*/30 * * * *',
    $$
    select net.http_get(
        url := 'https://test-einvoicing.vercel.app/api/cron/transmissions',
        headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
    );
    $$
);
```

**Option B — Vercel Cron** (Pro plan for schedules more frequent than daily). Add a `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/transmissions", "schedule": "*/30 * * * *" }] }
```

Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when the `CRON_SECRET` variable is set.

## 6. Backups and record retention

BIR requires books and records to be kept for **5 years** (RR 7-2024; RDOs may ask for 10 in sworn
statements). Issued invoices and the audit trail cannot be deleted by the app, but you still need backups:

- Production: enable **Point-in-Time Recovery** (Database → Backups).
- Schedule a monthly `pg_dump` (or Supabase's backup download) to separate cold storage and keep it for at
  least 5 years — 10 years if your sworn statement says so.
- Test restoring a backup into the test project at least once a year (part of the CAS disaster-recovery plan).

## 7. First sign-in

1. Start the app (`npm run dev`) or open the deployed URL.
2. **Sign up**, confirm the email, and complete **Register your business** (onboarding). You become the
   organization's **Owner**; the head office branch `00000` is created automatically.
3. Follow the checklist on the dashboard / Compliance Center (invoice series, CAS registration, …).

## Letting the assistant set this up for you

If you prefer that the schema be applied for you, provide **one** of the following for the **test** project
first (and later the production project):

- a **Supabase personal access token** (Account → Access Tokens) **and** the **project ref**, or
- the **database connection string** (Project Settings → Database → Connection string, "Session pooler"),
  including the database password.

Revoke the access token (or rotate the database password) after setup.
