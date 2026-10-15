# CAS e-invoice JSON v2.1 and how this app fills it

Source: `source/Annex B - EIS e-invoice JSON File format v2.1 (Sept 2026).xlsx` (sheets "1.e-invoice
format-CAS", "3.Annex-correction", "4.Annex-Scenario1/2") and API guide chapters 4–5. Implemented in
`src/server/eis/format.ts`; tested against BIR's own example in `src/server/eis/format.test.ts`.

Rules that apply to every field: numbers have 2 decimals and may be negative; empty strings for absent
text, `0` for absent numbers; amounts in pesos.

## Header

| #   | Field           | Rule                                                                                                                                                                                            | Value in this app                                                                                                                                                                   |
| --- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `CompInvoiceId` | Document number in the taxpayer's system (≤50)                                                                                                                                                  | Invoice/memo number (same on every part of a mixed document)                                                                                                                        |
| 2   | `IssueDtm`      | `YYYYMMDD`                                                                                                                                                                                      | Invoice date                                                                                                                                                                        |
| 3   | `EisUniqueId`   | 24 chars: issue date (8) + EIS Cert Number (8) + 8 random uppercase alphanumerics                                                                                                               | Generated per part; kept across retries; new one if the EIS Cert Number changes (sandbox → production)                                                                              |
| 4   | `DocType`       | `01` invoice, `03` credit memo (v2.1 removed `02` debit memo)                                                                                                                                   | Sales/service invoice `01`; credit memo `03`; **debit memo `01` with `CorrYN = Y`, code `03`**                                                                                      |
| 5   | `TransClass`    | `01` VATable, `02` zero-rated, `03` VAT-exempt, `04` RBE local sales — one e-invoice each                                                                                                       | From each line's tax treatment; SC/PWD lines are VAT-exempt (`03`); non-VAT seller sales `03` (see open questions)                                                                  |
| 6   | `CorrYN`        | `Y` for corrected/adjusted documents                                                                                                                                                            | `Y` for credit and debit memos                                                                                                                                                      |
| 7   | `CorrectionCd`  | Required if `CorrYN = Y`: 01 error, 02 duplication, 03 addition/reduction, 04 cancellation, 05 return, 09 others                                                                                | Memo's **Type of adjustment** (new field); defaults: credit memo 05, debit memo 03, else 09                                                                                         |
| 8   | `PrevUniqueId`  | `EisUniqueId` of the corrected e-invoice; 24 zeros if the original is not in the system; **not transmitted** if the original predates the PTT; several originals → one here, the rest in `Rmk1` | The original's e-invoice of the same classification (else its first one); if the original was never transmitted, the memo is not transmitted (status _Cancelled — not transmitted_) |
| 9   | `Rmk1`          | Remarks (≤500)                                                                                                                                                                                  | Memos: original number — reason — other original IDs. Invoices replacing a manual invoice: "Replaces manual invoice …"                                                              |

## Seller and buyer

| Field                                 | Rule                                                     | Value                                            |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| `SellerInfo.Tin`                      | 9 digits, no dashes                                      | Issue-time snapshot of the organization TIN      |
| `SellerInfo.BranchCd`                 | 5 digits (`101` → `00101`)                               | Issuing branch code                              |
| `SellerInfo.Type`                     | `0` VAT, `1` non-VAT, `2` Registered Business Enterprise | From VAT registration (RBE not supported yet)    |
| `SellerInfo.RegNm`/`BusinessNm`       | As on the COR; business name = registered name if none   | Snapshot                                         |
| `SellerInfo.Email`                    | Optional                                                 | Organization e-mail                              |
| `SellerInfo.RegAddr`                  | Registered address                                       | Branch address snapshot                          |
| `BuyerInfo.Tin`                       | 9 digits; `000000000` if the buyer has none              | Buyer TIN or `000000000`                         |
| `BuyerInfo.BranchCd`                  | 5 digits                                                 | Buyer branch or `00000`                          |
| `BuyerInfo.RegNm`                     | Mandatory                                                | Buyer name, business name, or "Walk-in customer" |
| `BuyerInfo.RegAddr`, `Email`          | Optional                                                 | From the invoice                                 |
| `DevAddr`, `AirNum(Dt)`, `LadNum(Dt)` | Optional (exporters)                                     | Empty (not captured yet)                         |

## Items (1–1,000 per e-invoice)

| Field         | Rule                                              | Value                                                                                                |
| ------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Nm`, `Desc`  | Name and description (≤100 each)                  | Line description (truncated)                                                                         |
| `Qty`, `Unit` | Quantity (2 decimals), unit                       | Line quantity and unit                                                                               |
| `UnitCost`    | Price per unit **net of VAT**                     | `SalesAmt ÷ Qty`                                                                                     |
| `SalesAmt`    | `Qty × UnitCost`, net of VAT                      | Gross line amount converted to VAT-exclusive with the line's own ratio (net ÷ amount after discount) |
| `RegDscntAmt` | Outright discount (VAT and income tax deductible) | `SalesAmt − NetSales`                                                                                |
| `SpeDscntAmt` | Conditional discount (income tax only)            | 0                                                                                                    |
| `NetSales`    | `SalesAmt − (RegDscntAmt + SpeDscntAmt)`          | Line net amount before the statutory (SC/PWD…) discount                                              |

BIR's own example (5 × ₱100 VAT-inclusive with ₱150 off) gives `UnitCost 89.29`, `SalesAmt 446.43`,
`NetSales 312.50` — reproduced exactly by the tests.

## Totals

| Field                   | Rule                                                | Value                                                                              |
| ----------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `TotNetItemSales`       | Σ `NetSales`                                        | Same                                                                               |
| `Discount.ScAmt/PwdAmt` | Senior citizen / PWD discount on the total          | Statutory discount of the part, by discount type                                   |
| `Discount.RegAmt`       | Outright document-level discount                    | 0 (the app has line discounts only)                                                |
| `Discount.SpeAmt`       | Conditional document-level discount                 | Solo parent / NAAC / MOV statutory discounts (see open questions), `Rmk2` names it |
| `OtherTaxRev`           | Other taxable revenue                               | 0                                                                                  |
| `TotNetSalesAftDisct`   | `TotNetItemSales + OtherTaxRev − discounts`         | Σ line net amounts                                                                 |
| `VATAmt`                | VAT on the document; 0 for `02`/`03`                | Σ line VAT                                                                         |
| `WithholdIncome`        | Withheld by the buyer (income tax)                  | Invoice withholding, split across parts in proportion to net sales                 |
| `WithholdBusVAT/PT`     | Withheld VAT / percentage tax                       | 0 (not supported yet)                                                              |
| `OtherNonTaxCharge`     | Non-taxable charges                                 | 0                                                                                  |
| `NetAmtPay`             | Amount payable                                      | Net + VAT − withholding (parts add up to the invoice's amount due)                 |
| `ForCur`                | Optional foreign currency block                     | Omitted (PHP only)                                                                 |
| `PtuNum`                | CAS permit / acknowledgment number (≤50), mandatory | CAS Acknowledgment Certificate number (ACCN) snapshot, else the PTI number         |

## Credit memos

All amounts except `Qty` are **negative** (`UnitCost`, `SalesAmt`, discounts, `NetSales`, totals, `VATAmt`,
withholding, `NetAmtPay`), as in the format's correction annex. Corrections keep the issue date rules of
the annex: an _error_ or _duplicate_ correction carries the original's date; a return, cancellation or
change carries the date it happened.
