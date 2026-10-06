# User guide — by role

This guide explains what each role can do and how to do the everyday tasks. Roles are set per organization
(a person can be an Owner of one business and a Viewer of another).

## Roles at a glance

| Role | Who it is for |
| --- | --- |
| **Owner** | The business owner. Full access, including users and company registration details. Every organization keeps at least one owner. |
| **Administrator** | Office manager / IT. Same as Owner, except only owners can grant or change the Owner role. |
| **Accountant** | Bookkeeper or accountant. Issues and voids invoices, credit and debit memos, runs reports and maintains BIR registrations. |
| **Cashier / Billing** | Front desk or billing staff. Creates customers and issues sales and service invoices. Cannot void or change settings. |
| **Viewer** | Read-only (e.g. external auditor, business partner). Sees invoices, reports and compliance status. |

### Permission matrix

| What you can do | Owner | Admin | Accountant | Cashier | Viewer |
| --- | :-: | :-: | :-: | :-: | :-: |
| View invoices, customers, products | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create drafts and issue sales / service invoices | ✓ | ✓ | ✓ | ✓ | |
| Add and edit customers | ✓ | ✓ | ✓ | ✓ | |
| Delete customers | ✓ | ✓ | ✓ | | |
| Add, edit and delete products & services | ✓ | ✓ | ✓ | | |
| Issue credit and debit memos | ✓ | ✓ | ✓ | | |
| Void issued documents | ✓ | ✓ | ✓ | | |
| Sales Journal and Summary List of Sales (view, export) | ✓ | ✓ | ✓ | | ✓ |
| View Compliance Center, registrations, transmissions, documents | ✓ | ✓ | ✓ | | ✓ |
| Update registrations, upload documents, run the coverage check, send EIS transmissions | ✓ | ✓ | ✓ | | |
| Delete registrations and documents | ✓ | ✓ | | | |
| Company profile, branches, invoice series | ✓ | ✓ | | | |
| Invite users, change roles, suspend/remove users | ✓ | ✓ | | | |
| View the audit trail | ✓ | ✓ | ✓ | | |

Menu items you cannot use are hidden. The same rules are enforced by the server and the database, so
changing a web address does not bypass them.

> Each person must sign in with **their own account**. BIR requires every record to carry the ID of the user
> who created it, and the audit trail shows who did what.

---

## Owner and Administrator

### First-time setup (about 15 minutes)

1. **Sign up** and confirm your email.
2. **Register your business** — enter the details exactly as on your BIR Certificate of Registration
   (Form 2303): registered name, business name/style, TIN, VAT or non-VAT, RDO, address. You become the
   Owner and the head office (branch `00000`) is created.
3. **Administration → Branches** — add every BIR-registered branch with its 5-digit branch code.
4. **BIR Compliance → Compliance Center** — answer *“Do I need to e-invoice?”* to see whether the
   December 31, 2026 deadline applies to you.
5. **Administration → Invoice Series** — for each branch, add the serial range for Sales Invoice (and/or
   Service Invoice, Credit Memo, Debit Memo) with the **Acknowledgment Certificate control number (ACCN)**
   and date. Until you have the certificate, use the range you declared in your application.
6. **Administration → Users & Roles** — invite your staff with the right role.
7. **Products & Services** and **Customers** — add your regular items and buyers (optional, but faster).

### Keeping BIR registrations up to date

Go to **BIR Compliance → Registrations & Permits** and record each step as it happens: CAS
Acknowledgment Certificate → Permit to Issue (PTI) → EIS certification (due 6 months after the PTI) → Permit
to Transmit (PTT). When you receive the PTT, open **Administration → Company Profile** and turn on **EIS
transmission**. Upload the documents (COR, sworn statement, permits) under **BIR Compliance → Documents**.

### Managing users

- **Invite**: Users & Roles → *Invite user* → name, email, role. New users receive an email to set a password.
- **Change role / suspend**: open the user. Suspended users can no longer sign in to your organization.
- **Remove**: when someone leaves the business, remove or suspend them the same day.
- You cannot change your own role. Only an Owner can make someone else an Owner.

### Changing company details

Company Profile changes apply to documents issued from then on — issued invoices keep the details printed
on them. If you change from non-VAT to VAT (or the reverse), update your BIR registration first and
register a new invoice series if your certificate changes.

### Audit trail

**Administration → Audit Trail** lists every change: who, when, what changed (old → new). It cannot be
edited or deleted. Use the filters to answer questions like “who voided invoice SI-000123?”.

---

## Accountant

### Issue an invoice

1. **Invoices & Memos → New → Sales invoice** (or Service invoice).
2. Choose the **branch** and **date**. Pick a **customer** (or type a one-time buyer). For VAT-registered
   buyers and sales of ₱1,000 or more, the buyer's name, TIN and address are required.
3. Add **items** from Products & Services or type them. Toggle **Prices include VAT** to match your price list.
4. Check the **Summary** (VATable, VAT-exempt, zero-rated, VAT, total).
5. **Save draft** to finish later, or **Save & issue**. Issuing assigns the next serial number for the branch
   and locks the document.

### Senior citizen, PWD, solo parent, national athlete, Medal of Valor discounts

In the invoice, turn on **Buyer presented a discount ID**, choose the discount, enter the ID number and name,
then tick **Apply discount** on the qualifying lines. The 20% (10% for solo parents) is computed on the
VAT-exclusive price and those lines become VAT-exempt. The cardholder signs the printed invoice.

### Fix a mistake

Issued documents can never be edited. Decide as follows:

| Situation | What to do |
| --- | --- |
| Not yet given to the buyer and not yet sent to BIR | **Void** it (… → Void, give a reason), then issue a correct invoice |
| Buyer returned goods, price reduced, or amount was too high | Open the invoice → … → **Issue credit memo**; enter only the amount being credited |
| Additional charge, or amount was too low | Open the invoice → … → **Issue debit memo** with the additional amount |
| Already transmitted to BIR | Voiding is blocked — issue a **credit memo** |

Voided documents keep their number and stay in the Sales Journal marked VOID.

### Print or send

**Print / PDF** opens the print view. The first print is marked **ORIGINAL**, later prints **REPRINT**. Use
your browser's *Save as PDF* to email a copy (… → *Email to buyer* opens your mail app).

### System downtime

If the system is unavailable, issue BIR-authorized manual invoices. When it is back, create an e-invoice for
each one and fill **More options → Replaces manual invoice no.**

### Month-end and quarter-end

- **Reports → Sales Journal**: choose the period (and branch) → *Export CSV* or *Print*.
- **Reports → Summary List of Sales**: choose the year and quarter → *Export CSV*. Use it to prepare the
  quarterly SLSP for eSubmission (due by the 25th day after the quarter).
- **BIR Compliance → EIS Transmissions** (once transmission is on): make sure nothing is overdue or
  rejected. *Send pending now* retries immediately; fix rejected documents with a credit memo.

---

## Cashier / Billing

- **Create and issue invoices** exactly as described for accountants (steps 1–5 above), including senior
  citizen / PWD discounts.
- **Add customers** from the invoice (*New* next to the customer box) or **Customers → Add customer**.
- **Print** the invoice for the customer from the invoice page.
- You **cannot void** or issue credit/debit memos. If you made a mistake, leave the invoice as is and ask
  your accountant or administrator — do not issue a duplicate.
- Drafts you no longer need can be deleted (they have no serial number yet).

## Viewer

- Browse **Invoices & Memos**, open any document and print it.
- Run and export the **Sales Journal** and **Summary List of Sales**.
- See the **Compliance Center**, registrations, documents and transmission status.
- Nothing can be changed with this role.

---

## Everyone

- **Change password**: user menu (top right) → *Change password*. Passwords need at least 10 characters with
  letters and numbers, and must be changed every 30 days (you will be asked automatically).
- **Switch business**: if you belong to more than one organization, click the business name at the top to
  switch.
- **Dark mode**: user menu → *Dark mode*.
- **Test environment**: a yellow *TEST ENVIRONMENT* bar means nothing you issue there is a real invoice.
