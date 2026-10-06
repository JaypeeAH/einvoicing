'use client'

import CollapsibleSection from '@/components/ui/CollapsibleSection'
import SectionHeading from '@/components/landing/SectionHeading'

const QUESTIONS = [
    {
        question: 'Do I have to issue e-invoices?',
        answer: 'By December 31, 2026, small, medium and large taxpayers that sell online, use a computerized accounting system or invoicing software, or are under the Large Taxpayers Service must issue e-invoices (RR 26-2025). Micro taxpayers (below ₱3 million in gross sales) are exempt. The Compliance Center asks a few questions and tells you where you stand.',
    },
    {
        question: 'Is this software accredited by BIR?',
        answer: 'BIR does not accredit invoicing software. You register the system with your RDO and receive an Acknowledgment Certificate, then get a Permit to Issue e-invoices and pass EIS certification. The app prints the certificate details on your invoices and tracks each step for you.',
    },
    {
        question: 'Can I still change an invoice after issuing it?',
        answer: 'No — BIR rules do not allow issued invoices to be edited or deleted. If something is wrong you void it with a reason (before it is sent to BIR) or issue a credit or debit memo that references the original invoice.',
    },
    {
        question: 'Does it work for non-VAT businesses and branches?',
        answer: 'Yes. Non-VAT sellers get the correct “Non-VAT Reg TIN” label and percentage-tax breakdown. Each branch has its own branch code and invoice series, and one login can manage several businesses.',
    },
    {
        question: 'How are senior citizen and PWD discounts handled?',
        answer: 'Turn on the special discount on the invoice, enter the ID number and name, and tick the qualifying items. The discount is computed on the VAT-exclusive price, those items become VAT-exempt, and a signature line is printed.',
    },
    {
        question: 'Where is my data stored?',
        answer: 'In a secured database with row-level security: each business only ever sees its own records. Issued invoices and the audit trail cannot be deleted, so your records are kept for the 5 years BIR requires.',
    },
]

/** Common questions from small-business owners, as expandable answers. */
export default function FaqSection() {
    return (
        <section id="faq" className="scroll-mt-20 py-20 sm:py-28">
            <div className="container px-4 sm:px-6">
                <SectionHeading eyebrow="FAQ" title="Questions business owners ask" />
                <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-gray-200 bg-white p-2 sm:p-4 dark:border-gray-700 dark:bg-gray-800">
                    {QUESTIONS.map((item) => (
                        <CollapsibleSection
                            key={item.question}
                            expanded={false}
                            className="mb-0"
                            itemClass="h-auto min-h-12 py-3 text-base text-gray-900 dark:text-gray-100"
                            label={item.question}
                        >
                            <p className="px-3 pb-4 text-gray-600 dark:text-gray-400">{item.answer}</p>
                        </CollapsibleSection>
                    ))}
                </div>
            </div>
        </section>
    )
}
