# EIS certification: the whole process

Source: _EIS Certification User Guide v1.2_ (`source/LT_EIS_CERT_User_Guide_20220520_V1.2.pdf`), the API
guide, the API error table and the PTT sworn statement template.

## Who does what

| Party                       | Role                                                                                                                                                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Taxpayer** (our customer) | Signs up on the portal as a _Taxpayer_, owns the application and its credentials, passes the tests, requests the EIS Certificate and PTT, signs the sworn statement, whitelists the IPs. Certification is **per taxpayer and per server/system**.                 |
| **Software provider** (us)  | Builds and runs the system. The portal has a _SW Provider_ account type that "tests the transmission function and supplies the SW to the taxpayer **without transmitting actual invoices**" — useful to rehearse the tests, but it cannot transmit for customers. |
| **BIR**                     | Approves the portal sign-up, the sandbox request, the EIS Certificate and the PTT; e-mails the production API URL after the PTT.                                                                                                                                  |

**Do we give credentials to the user?** No. BIR issues every credential to the taxpayer on the portal. The
taxpayer enters them in this app (**Compliance → EIS Transmissions → EIS connection**), where they are
stored encrypted and never displayed again. What we provide is the software, the fixed outgoing IP
addresses to whitelist, and guidance.

> The accreditation ID prefixes include **51 ASP-CAS** and **52 ASP-POS** (application service provider).
> Neither the guide nor the user guide explains how an ASP accreditation works (for example one
> accreditation transmitting for many sellers). Until BIR confirms that model, this app follows the
> documented path: each organization uses its own credentials. The data model allows a shared platform
> credential to be added later.

## Steps

| #   | Step                                     | Done by          | Details                                                                                                                                                                                                                                                                                          |
| --- | ---------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0   | Prerequisites                            | Taxpayer         | Registered system (CAS Acknowledgment Certificate) and **Permit to Issue (PTI)** e-invoices — see [../BIR-COMPLIANCE.md](../BIR-COMPLIANCE.md). EIS certification is due **within 6 months of the PTI** (RMC 98-2026).                                                                           |
| 1   | Sign up at eis-cert.bir.gov.ph           | Taxpayer         | Account type _Taxpayer_; details exactly as on the BIR Form 2303; TIN check; e-mail OTP (valid 10 min). Upload a **Secretary's Certificate or Board Resolution** (non-individual) or **Special Power of Attorney** (individual). BIR approves by e-mail. One account, one username.              |
| 2   | Create an application                    | Taxpayer         | Applications → Create Application. **Disabled if certification is not done within 6 months** of creation.                                                                                                                                                                                        |
| 3   | Generate the Application Key             | Taxpayer         | Application → Setting → _Generate Application Key_ (e-mail OTP). Used for the HMAC of the Authentication API.                                                                                                                                                                                    |
| 4   | Generate the digital signing key pair    | Taxpayer         | Setting → _Generate Digital Signing Key-pair_ (OTP) → **Download Credentials**. The file holds the private key and its key ID. Keep it secret; it signs every e-invoice (JWS).                                                                                                                   |
| 5   | Request the sandbox                      | Taxpayer         | EIS Cert → _Request for using Sandbox_. BIR approves by e-mail and assigns a **Test EIS Cert Number**.                                                                                                                                                                                           |
| 6   | Enter the sandbox connection in this app | Taxpayer (admin) | Environment _Sandbox_, API address `https://eis-cert.bir.gov.ph`, Test EIS Cert Number, Application ID, Application Key, portal user ID and password, signing key ID and private key. Press **Test connection**.                                                                                 |
| 7   | Pass the API tests                       | Taxpayer + app   | 5 steps (7 with callback): Authentication ×2, Invoice Issuance ×1 (3 with callback), Inquiry Result ×2. Issue a few invoices with EIS transmission on (see below); the portal shows progress per step. The sandbox allows **one issuance call per 10 seconds** (E19).                            |
| 8   | Request the EIS Certificate              | Taxpayer         | _Request Certificate_ when all steps pass. The test number is then locked (E08). BIR reviews the transmitted invoices and approves by e-mail; the certificate is under Setting → _View Certificates_.                                                                                            |
| 9   | Request the Permit to Transmit (PTT)     | Taxpayer         | EIS PTT → upload the documents, including the notarized **Sworn Statement** (`source/SWORN STATEMENT for PTT.docx`: software name, **IP addresses**, transmission schedule, record retention). BIR approves by e-mail.                                                                           |
| 10  | Whitelist the IPs                        | Taxpayer         | Setting → IP Whitelisting PTT: up to **4 IP addresses** (the app's fixed outgoing IPs). Production calls from other IPs fail with E07.                                                                                                                                                           |
| 11  | Switch the app to production             | Taxpayer (admin) | BIR e-mails the **production API URL**. Edit the EIS connection: environment _Production_, the production URL and the **EIS Cert Number** (not the test number), then **Test connection**. Record the PTT under Compliance → Registrations and turn on **EIS transmission** in Company settings. |
| 12  | Transmit                                 | App              | From the day after the PTT approval, every issued document is sent within **3 days** (RR 8-2022). Transmitted e-invoices are visible on the EIS taxpayer portal (eis.bir.gov.ph).                                                                                                                |

### Running the sandbox tests with this app

- Use a **test deployment** (`EIS_PROVIDER=bir`, e.g. test-einvoicing.vercel.app) or a separate test
  organization, with the taxpayer's **real TIN, branch and registered name** (BIR checks that the seller TIN
  is registered: ERR001), so test documents never mix with real books.
- Turn on EIS transmission for that organization, issue a few invoices (include a mixed
  VATable/zero-rated/exempt one and a credit memo), then press **Send pending now** on the Transmissions
  page. Press it again after a few minutes to collect the results (Inquiry Result steps).
- The Authentication steps pass with **Test connection** plus the first send.

## What the user needs from the system

- A place to enter and test the EIS credentials (Compliance → EIS Transmissions → EIS connection).
- The **outgoing IP addresses** to whitelist and to write in the sworn statement — provided by us per
  deployment (see [04-implementation.md](04-implementation.md#production-network-requirement)).
- The **software name and version** for the sworn statement (`NEXT_PUBLIC_SOFTWARE_NAME`/`_VERSION`).
- The transmission schedule for the sworn statement: "automatically, every 10–15 minutes and within 3 days of
  issue".
- Tracking of the registrations (EIS certification and PTT records under Compliance → Registrations).
- Transmission status per document, BIR's result codes, retry, and the EIS unique IDs.

## Credentials summary

| Credential                               | Where it comes from                                    | Used for                                              | Stored                               |
| ---------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------ |
| EIS Cert Number (8 digits; test vs real) | Portal → application (sandbox: Test EIS Cert Number)   | `accreditationId` header, part of every EIS unique ID | Plain                                |
| Application ID                           | Portal → application card / Setting                    | `applicationId` header                                | Plain                                |
| Application Key                          | Setting → Generate Application Key                     | HMAC key of the Authentication API                    | Encrypted (AES-256-GCM)              |
| Portal user ID and password              | Portal sign-up                                         | Inside the RSA-encrypted Authentication request       | User ID plain, password encrypted    |
| Signing key ID + private key             | Setting → Generate Digital Signing Key-pair → download | `kid` and RS256 signature of each e-invoice (JWS)     | Key ID plain, key encrypted          |
| EIS public key                           | Downloads (`source/EIS_Certification_Public_Key.txt`)  | RSA encryption of the Authentication request          | Built in (`EIS_PUBLIC_KEY` override) |
| Auth token + session key (6 hours)       | Returned by the Authentication API                     | `authToken` header, HMAC and AES key of other calls   | Encrypted, reused until expiry       |
