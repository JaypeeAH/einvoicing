# How this app implements the EIS

## Alignment review (October 2026)

| Area             | Before                                                                       | Now                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Authentication   | None (application secret sent as a bearer token)                             | Authentication API: RSA-encrypted credentials, HMAC, AES-decrypted token and session key, reused 6 hours     |
| Request security | Ad-hoc headers                                                               | `accreditationId`, `applicationId`, `datetime` (PH time), HMAC `authorization`, `authToken`                  |
| Payload          | The app's own JSON, one JWS without `kid`, unencrypted, one invoice per call | CAS e-invoice JSON v2.1, JWS RS256 with `kid`, AES-256 encrypted, up to 100 per `submitId`                   |
| Mixed documents  | One payload                                                                  | One e-invoice per `TransClass`, same `CompInvoiceId`, own `EisUniqueId`                                      |
| Results          | HTTP status treated as accepted/rejected                                     | Acknowledgment = _sent_; Inquiry Result API later sets _accepted_/_rejected_ per e-invoice                   |
| Corrections      | Not modelled                                                                 | `CorrYN`, `CorrectionCd` (new memo field), `PrevUniqueId`, negative credit memos, pre-PTT originals not sent |
| Credentials      | Environment variables shared by every organization                           | Per-organization EIS connection, secrets encrypted at rest, entered and tested in the app                    |
| Job              | Read at most 1,000 queued rows (could skip organizations); could double-send | Database claim with `skip locked`; all organizations with work; per-organization error isolation             |
| Voiding          | Blocked when the transmission was sent                                       | Also blocked when any part of a mixed document was sent or registered                                        |

## Backend changes

**Database** — `supabase/migrations/20261015000000_bir_eis_alignment.sql`

- `invoices.correction_code` (01/02/03/04/05/09) and `save_invoice_draft()` saving it.
- `eis_connections` — one row per organization: environment, API URL, EIS Cert Number, application ID,
  user ID, key ID, and `*_sealed` secrets (application key, password, private key, token, session key).
  Row-level security on with no policies and grants revoked: only the service role reads it.
- `eis_submissions` — one row per Invoice Issuance call: `submit_id`, `ack_id`, status (processing →
  completed/unavailable), counts, next inquiry time with backoff.
- `eis_documents` — one row per e-invoice (document × classification): `eis_unique_id` (unique), the exact
  JSON sent (`payload`), status, BIR result code and message. Members can read; only the job writes.
- `eis_transmissions.claimed_at`, `claim_eis_transmissions()`, `eis_pending_organizations()` (service role
  only); `audit_row_change()` ignores `claimed_at`; `void_invoice()` checks `eis_documents`.

**Server code** — `src/server/eis/`

| File                | Responsibility                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `crypto.ts`         | AES-256-CBC (BIR key/IV convention), RSA PKCS#1, HMAC, JWS RS256 with `kid`, IDs, secrets at rest (AES-256-GCM) |
| `format.ts`         | Invoice → CAS e-invoices per classification; pre-send checks mirroring BIR's verification codes                 |
| `BirEisGateway.ts`  | Authentication / Invoice Issuance / Inquiry Result calls, token reuse, E03 re-authentication                    |
| `MockEisGateway.ts` | `EIS_PROVIDER=mock`: acknowledges and answers with the same format checks; nothing leaves the app               |
| `publicKey.ts`      | Published EIS public key (`EIS_PUBLIC_KEY` overrides)                                                           |
| `index.ts`          | Picks the gateway for an organization                                                                           |

`src/server/data/transmissions.ts` runs the job: claim → build/rebuild e-invoices → validate → sign and send
in batches of 100 (one batch per run in the sandbox, E19) → record the submission → later inquire and set
each e-invoice and document status. `src/server/data/eisConnections.ts` saves, loads, tests and audits the
connection (secrets never logged or returned).

**API**

| Route                           | Permission        | Purpose                                         |
| ------------------------------- | ----------------- | ----------------------------------------------- |
| `GET /api/eis/connection`       | compliance:view   | Connection summary without secrets              |
| `PUT /api/eis/connection`       | settings:manage   | Save (blank secret = keep the saved one)        |
| `DELETE /api/eis/connection`    | settings:manage   | Remove                                          |
| `POST /api/eis/connection/test` | settings:manage   | Call the Authentication API                     |
| `POST /api/transmissions/send`  | compliance:manage | Send pending (or retry one) and collect results |
| `GET /api/cron/transmissions`   | `CRON_SECRET`     | Same for every organization with work           |

**UI** — Compliance → EIS Transmissions: EIS connection card (set up, test, remove), EIS unique IDs and
result codes per document. Credit/debit memo editor: _Type of adjustment_ (correction code).

**Configuration** — `EIS_PROVIDER` (`mock`/`bir`), `EIS_CREDENTIALS_KEY` (required to save connections:
`openssl rand -base64 32`), optional `EIS_PUBLIC_KEY`, `EIS_TIMEOUT_MS`. The old `EIS_BASE_URL`,
`EIS_APPLICATION_ID`, `EIS_APPLICATION_SECRET` and `EIS_SIGNING_PRIVATE_KEY` are no longer read.

## Production network requirement

The production EIS accepts calls only from **up to 4 whitelisted IP addresses per application** (E07), and
the taxpayer declares them in the PTT sworn statement. Vercel serverless functions do not have fixed outgoing
IPs by default. Before the first customer goes to production, choose one:

1. **Static outgoing IPs on the host** (for example Vercel's static IP / Secure Compute options, depending on
   the plan) — simplest if available; then whitelist those IPs.
2. **Run the transmission job on a small server with a static IP** (VM, container service with a NAT
   gateway/elastic IP) calling the same code (`runEisTransmissions`), with the cron pointed at it.
3. **A static-IP egress proxy** for the EIS calls only. Node 24 can route `fetch` through `HTTPS_PROXY` when
   `NODE_USE_ENV_PROXY=1` is set (exclude Supabase with `NO_PROXY`); verify on the target runtime.

The sandbox has no IP whitelist, so certification tests work from any deployment.

## Open questions to confirm with BIR (e-mail or the portal Q&A)

1. **ASP model** (accreditation prefix 51): can one accreditation transmit for many client taxpayers, or must
   each client hold its own? The app currently assumes each client holds its own.
2. **Non-VAT sellers**: which `TransClass` applies (sent as `03` now)? Does EIS apply to them at all?
3. **Solo parent / NAAC / MOV discounts**: `SpeAmt` (sent now) or `RegAmt`?
4. **Debit memos** after v2.1 removed DocType `02`: sent as `DocType 01` + `CorrYN Y` + `CorrectionCd 03`
   referencing the original — confirm.
5. **`PtuNum`** for systems registered under RMC 5-2021/98-2026: the CAS Acknowledgment Certificate number
   (sent now) or the PTI number?
6. **Inquiry Result `data`**: plain JSON (as in the guide) or encrypted? Both are handled.
7. **Production paths**: `/api/...` (sample code) or `/api/{version}/...` / `https://eis-api.bir.gov.ph/v2`
   (guide examples).
8. Final version of the **v2.1 JSON format** (the downloaded file is labelled "proposed changes").

## Not built yet

- Invoice Result **Callback** endpoint (optional; polling is used).
- RBE seller type (`Type 2`) and `TransClass 04`; withholding of VAT/percentage tax; other taxable revenue
  and non-taxable charges; foreign currency (`ForCur`); export proof fields (airway bill, bill of lading).
- POS/CRM format (summarized sales, `Msn`/`Min`) — this app issues CAS-format invoices only.
