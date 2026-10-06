import Card from '@/components/ui/Card'
import { REGULATORY_REFERENCES } from '@/constants/bir.constant'

/** The BIR issuances behind the checklist, in plain language. */
export default function RegulationsCard() {
    return (
        <Card header={{ content: 'Regulations' }}>
            <ul className="flex flex-col gap-3">
                {REGULATORY_REFERENCES.map((reference) => (
                    <li key={reference.code}>
                        <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-bold text-primary">{reference.code}</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{reference.title}</span>
                        </div>
                        <p className="text-sm text-gray-500">{reference.summary}</p>
                    </li>
                ))}
            </ul>
        </Card>
    )
}
