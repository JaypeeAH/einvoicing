# BIR EIS requirements

This folder holds what BIR publishes for the **Electronic Invoicing/Receipting and Sales Reporting System
(EIS)**, summaries of what each document requires, and how this app meets it. Source:
<https://eis-cert.bir.gov.ph> (API Guide and Downloads pages), downloaded October 2026.

| Document                                                       | What it covers                                                                           |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [01-certification-process.md](01-certification-process.md)     | Sign-up → sandbox tests → EIS Certificate → PTT → production; who holds which credential |
| [02-api-protocol.md](02-api-protocol.md)                       | The four APIs, headers, encryption, signing, error and result codes                      |
| [03-json-format-and-mapping.md](03-json-format-and-mapping.md) | CAS e-invoice JSON v2.1 field by field, and where each value comes from in this app      |
| [04-implementation.md](04-implementation.md)                   | What changed in the backend to align, deployment requirements, open questions            |
| [source/](source/)                                             | BIR's original files (guide, JSON format, user guide, error table, key, sample code)     |

## Summary

1. **The taxpayer, not the software provider, is certified.** Each taxpayer (our customer) signs up on the
   EIS Certification portal, creates an _application_, passes the sandbox API tests with the system they
   use (this app), gets an **EIS Certificate**, then a **Permit to Transmit (PTT)**. BIR issues the
   credentials to the taxpayer; the taxpayer enters them in this app. We do not issue BIR credentials.
2. **Four APIs**: Authentication (token valid 6 hours), Invoice Issuance (1–100 e-invoices per call),
   Inquiry Result (poll for BIR's verdict per e-invoice) and an optional Invoice Result Callback (BIR pushes
   the result to us). This app uses polling, so the 5-step certification test applies (7 with callback).
3. **Security is layered**: HMAC-SHA256 on every request, RSA to exchange a temporary key, AES-256 for
   every payload, an RS256 JWS signature on every e-invoice with a key pair generated on the portal, and an
   **IP whitelist** (max 4 IPs) for production.
4. **One e-invoice per tax classification.** A document mixing VATable, zero-rated and VAT-exempt items is
   transmitted as separate e-invoices with the same document number and different EIS unique IDs.
5. **Corrections are new documents.** Once transmitted, a document is never voided; a credit memo (negative
   amounts, `CorrYN = Y`, a correction code and the original's EIS unique ID) adjusts it. Debit memos were
   removed from the format in v2.1.
6. **Results are asynchronous.** The issuance call only acknowledges receipt; BIR registers the e-invoices
   later ("within the next business day") and the Inquiry Result API returns `SUC001` or an error per
   e-invoice.

## Notes on the downloaded files

- `07.30.2026 EIS e-invoice API development guide v2.3.pdf` and `09.26.2022_..._v2.2.pdf` are **the same
  file** (identical checksum). Its revision history lists a v2.3 (2026-07-30, "Changed JSON format"), and it
  documents the v2.1 JSON changes. Only one copy is kept in `source/`.
- `EIS e-invoice JSON File format v2.01_...xlsx` and `4_ANNEX B ... v2.1 ... (Sept 2026).xlsx` have **the
  same content**: the September 26, 2026 _proposed_ CAS format (sheet "1.e-invoice format-CAS_v2.2") with
  the v2.1 revision "Removed DM/DN". Check the Downloads page for the final version before certifying.
- The sample code (Python, Java, C#) is the reference for byte-level details the guide leaves open (key
  encoding, IV, header names, time zone). The C# build output and macOS metadata were not copied.
