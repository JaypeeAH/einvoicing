import Card from '@/components/ui/Card'
import { ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/constants/roles.constant'

/** What each role can do, so owners can pick the least access a person needs. */
export default function RolesExplainer() {
    return (
        <Card header={{ content: 'What each role can do' }}>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {ROLES.map((role) => (
                    <div key={role} className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                        <dt className="font-semibold text-gray-900 dark:text-gray-100">{ROLE_LABELS[role]}</dt>
                        <dd className="mt-1 text-sm text-gray-500 dark:text-gray-400">{ROLE_DESCRIPTIONS[role]}</dd>
                    </div>
                ))}
            </dl>
        </Card>
    )
}
