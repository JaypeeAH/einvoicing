# BIR compliance guide

How this system maps to the Philippine BIR invoicing and e-invoicing rules in force as of **October 2026**,
what each taxpayer still has to do, and what is not covered yet. Review it with your tax adviser before a
taxpayer files its registration; rules and BIR technical specifications change.

> **Important — there is no "BIR accreditation" for invoicing software.** BIR does not accredit e-invoicing
> or CAS software or providers (BIR advisories, 2025–2026). The **taxpayer** registers the system (CAS
> Acknowledgment Certificate), obtains the **Permit to Issue (PTI)** e-invoices, completes **EIS
> certification** and, when required, the **Permit to Transmit (PTT)**. As the provider you co-sign the
> taxpayer's Joint Sworn Statement. Never market the product as "BIR-accredited", "BIR-approved" or
> "BIR-certified"; say it is _designed to meet RMC 5-2021 and RMC 98-2026 requirements_ and _helps you obtain
> your AC, PTI and EIS certification_. RMC 98-2026 announced a separate framework for Electronic Invoicing
> Service Providers (ESPs); check whether it has been issued before offering the service as an ESP.

## Regulations covered

| Reference                            | Subject                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| RA 11976 (EOPT Act)                  | Invoice is the primary document for goods and services; official receipts are supplementary |
| RR 7-2024 (as amended by RR 11-2024) | Mandatory invoice information, buyer details threshold, 5-year record retention             |
| RMC 5-2021 and Annex B               | CAS/CBA registration (Acknowledgment Certificate) and system technical standards            |
| RR 9-2009                            | Content of the books of accounts (Sales Journal columns)                                    |
| RR 8-2022                            | Electronic Invoicing System (EIS), 3-day transmission once a PTT is held                    |
| RR 26-2025                           | E-invoicing deadline **December 31, 2026**; micro taxpayers exempt                          |
| RMC 98-2026                          | E-invoicing guidelines: PTI, EIS certification within 6 months, corrections, downtime       |
| RR 16-2005 as amended                | Summary List of Sales (quarterly, VAT taxpayers)                                            |

## Requirements and how they are met

### Invoice content (RR 7-2024 Sec. 6; RMC 5-2021 Annex B)

| Requirement                                                                                           | Implementation                                                                                         |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Seller registered name, business name/style, registered address                                       | Printed in the invoice header from the snapshot taken at issue (`InvoiceDocument`)                     |
| "VAT REG TIN" / "NON-VAT REG TIN" + 9-digit TIN + branch code                                         | Header line, e.g. `VAT REG TIN: 123-456-789-00000`                                                     |
| Document title ("Sales Invoice", "Service Invoice", "Credit Memo", "Debit Memo")                      | Header, from the document type                                                                         |
| Serial number, at least 6 running digits, system-controlled                                           | Assigned by `issue_invoice()` from the branch's registered series, zero-padded (min. 6)                |
| Date of transaction                                                                                   | Invoice date (cannot be in the future)                                                                 |
| Buyer name, address, TIN (+ branch code) — mandatory for ₱1,000+ sales to VAT-registered buyers       | "Sold to" block; enforced before issuing (`getInvoiceIssueProblems`)                                   |
| Quantity, unit cost, description                                                                      | Lines table                                                                                            |
| VAT shown separately; VATable / VAT-exempt / zero-rated / VAT breakdown                               | Totals block; lines labelled "VAT-Exempt Sale" / "Zero-Rated Sale"                                     |
| Non-VAT: "Sales subject to percentage tax" / "Exempt sales"                                           | Totals block for non-VAT sellers; VATable lines are blocked                                            |
| SC / PWD / Solo Parent / NAAC / MOV discounts: ID no., name, TIN, discount breakdown, signature space | Special-discount section; discount computed on the VAT-exclusive price and the line becomes VAT-exempt |
| ACCN (Acknowledgment Certificate no.), date issued and approved series range                          | Footer, from the series used to number the document                                                    |
| PTI number (e-invoices)                                                                               | Footer, from the approved PTI registration                                                             |
| "REPRINT" on copies after the first                                                                   | Print counter: first print `ORIGINAL`, later prints `REPRINT`                                          |
| Supplementary documents marked "THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX"                    | Printed on credit and debit memos                                                                      |
| No "valid for five years" phrase (removed by RR 6-2022)                                               | Not printed                                                                                            |

### System controls (RMC 5-2021 Annex B)

| Requirement                                                                                          | Implementation                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Numbering controlled by the system, unique per document type and branch, within the registered range | `document_series` (one active series per branch and type) + `issue_invoice()` with row locks; numbers are only assigned on issue, so drafts never leave gaps; issuing stops when the range is used up |
| A posted transaction can be voided but not modified                                                  | Database triggers block every change to issued/voided documents and their lines; `void_invoice()` requires a reason                                                                                   |
| Corrections by supplementary documents                                                               | Credit memo (decrease, cannot exceed the remaining invoice amount) and debit memo (increase), both referencing the original invoice (RMC 98-2026 Sec. IV.8)                                           |
| Every record stamped with the user ID                                                                | `created_by`, `issued_by`, `voided_by`, `uploaded_by`, `assessed_by`                                                                                                                                  |
| Audit trail: timestamp, user, action, old and new values, protected from change                      | `audit_logs` written by triggers on every table; append-only (updates/deletes raise an error); issue, void, print, export and download events                                                         |
| Users cannot edit generated reports                                                                  | Reports are computed from issued documents; CSV exports are logged in the audit trail                                                                                                                 |
| Totals auto-checked                                                                                  | Server recalculates every line; the database recomputes totals from the lines when issuing; the mock EIS rejects mismatched totals                                                                    |
| Report header: registered name, address, TIN, software name and version, generated by, date-time     | Sales Journal and Summary List of Sales (screen and CSV)                                                                                                                                              |
| Data extractable for BIR in electronic format                                                        | CSV export of the Sales Journal and Summary List of Sales                                                                                                                                             |
| Tamper evidence (good practice)                                                                      | SHA-256 hash of each issued document chained to the previous one                                                                                                                                      |
| Access approval process; revoke access on termination                                                | Only owners/admins invite users; suspend or remove at any time; role-based permissions enforced in the UI, API and database (RLS)                                                                     |
| Passwords alphanumeric and changed every 30 days                                                     | App rule (10+ chars, letters and numbers) and forced change after `PASSWORD_MAX_AGE_DAYS` (30)                                                                                                        |
| No concurrent logins; lockout after failed sign-ins                                                  | Supabase Auth settings: _Enforce single session per user_ and sign-in rate limits (see SUPABASE-SETUP.md)                                                                                             |
| Encrypted access, firewall, authenticated application                                                | HTTPS only (HSTS header), Supabase-managed Postgres, every API route authenticated, row-level security                                                                                                |
| Backups, archive/restore, disaster recovery                                                          | Supabase PITR + scheduled long-term exports (see SUPABASE-SETUP.md §6) — operational responsibility                                                                                                   |

### E-invoicing (RR 8-2022, RR 26-2025, RMC 98-2026)

| Requirement                                                                                                                         | Implementation                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Who must e-invoice by Dec 31, 2026 (small/medium/large online sellers, LTS, EOPT large, CAS/invoicing-software users; micro exempt) | Compliance Center questionnaire (`assessCoverage`), result stored with history                                     |
| PTI before the first e-invoice; one PTI for head office and branches                                                                | Registrations tracker; PTI number printed on invoices                                                              |
| EIS certification within 6 months of the PTI                                                                                        | Due date set automatically from the PTI approval date; dashboard/checklist warnings                                |
| Issued e-invoice never deleted or altered                                                                                           | Immutability triggers; voiding is blocked once BIR has received the document — issue a credit memo instead         |
| Downtime: manual invoices replaced by e-invoices referencing them                                                                   | "Replaces manual invoice no." field, printed and transmitted                                                       |
| JSON transmission, signed (JWS), within 3 days once a PTT is held                                                                   | Transmission queue (`eis_transmissions`) with 3-day due date, retries, scheduled job, `BirEisProvider` (JWS RS256) |
| Head office and branches comply together                                                                                            | Organization-wide settings; branches share the PTI                                                                 |

## What the taxpayer must do (outside the system)

1. Keep the BIR **Certificate of Registration (Form 2303)** of the head office and each branch, and enter the
   details exactly in Company Profile / Branches.
2. **Register the system with the RDO (CAS Acknowledgment Certificate)** — file the checklist: Joint Sworn
   Statement (Annex A-2, signed with the provider), system description and screen/report specifications
   (Annex A-3), sample invoices, a printed audit trail, signed Annex B. Then enter the ACCN, date and
   approved serial ranges in **Invoice Series**.
3. **Apply for the PTI** (e-invoicing) with the RDO / LT office before issuing e-invoices.
4. **Complete EIS certification** at eis-cert.bir.gov.ph within 6 months of the PTI (5 mandatory tests, 7 if
   the callback API is used), using the test environment with `EIS_PROVIDER=bir` and the sandbox credentials.
5. When BIR issues the **PTT**, enter it in Registrations and turn on **EIS transmission** in Company Profile.
6. Notify the RDO before changing the system: a new **software version** (`NEXT_PUBLIC_SOFTWARE_VERSION`) or
   major enhancement needs a new registration; minor changes need a written notice.
7. File the **Summary List of Sales** quarterly (by the 25th day after the quarter) and submit the
   computerized books within 30 days after year-end, as applicable.
8. Keep records and backups for at least 5 years (10 if your sworn statement says so).

## Known gaps and recommended next steps

These are not built yet. Address the ones that apply before going live with real taxpayers.

| Gap                                      | Why it matters                                                                                                                                                                              | Suggested approach                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BIR EIS JSON field mapping**           | BIR's EIS API specification (schema, endpoints, encryption) is only given to taxpayers on the certification portal. `BirEisProvider.toBirDocument()` currently sends the canonical payload. | Map to the official schema version, add payload encryption if required, implement the callback API if used, and pass the certification tests.         |
| **Electronic delivery to the buyer**     | A valid e-invoice must be delivered electronically (email, online view, QR code…). The app offers print/save-as-PDF and a pre-filled email link only.                                       | Add transactional email (SMTP/Resend) with a PDF attachment or a secure buyer link with QR code.                                                      |
| **Other books of accounts**              | CAS registration covers the books the system produces. This system produces the Sales Journal; General Journal/Ledger, Purchase and Cash books come from the accounting system.             | Register this as the invoicing system component, or integrate/export to the accounting system that keeps the other books.                             |
| **SLSP DAT file**                        | eSubmission/RELIEF expects a DAT file.                                                                                                                                                      | CSV is provided; add a DAT generator following the current RELIEF file layout.                                                                        |
| **Withholding certificates (2306/2307)** | Annex B asks CAS to generate them (relevant when the taxpayer is the withholding agent).                                                                                                    | Out of scope for sales invoicing; handle in the purchasing/accounting system.                                                                         |
| **CAPTCHA and account lockout UI**       | Repeated failed sign-ins are rate-limited by Supabase but not shown as a lockout.                                                                                                           | Enable Supabase CAPTCHA and add the widget to the sign-in form.                                                                                       |
| **Data Privacy Act (RA 10173)**          | Customer data is personal information.                                                                                                                                                      | Publish a privacy notice (`NEXT_PUBLIC_PRIVACY_URL`), sign a data processing agreement with each taxpayer, register with the NPC if thresholds apply. |
| **Independent security review**          | Expected by RDOs and enterprise customers.                                                                                                                                                  | Penetration test before production; keep dependency updates current.                                                                                  |
