'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { invoicesPath } from '@/configs/app.config'
import { SearchIcon } from '@/configs/icons.config'

/** Header search box — finds invoices by number, buyer name or TIN. */
export default function HeaderSearch() {
    const router = useRouter()
    const [query, setQuery] = useState('')

    const onSubmit = (e: FormEvent) => {
        e.preventDefault()
        const q = query.trim()
        router.push(q ? `${invoicesPath}?query=${encodeURIComponent(q)}` : invoicesPath)
    }

    return (
        <form onSubmit={onSubmit} className="hidden md:block" role="search">
            <label className="relative block">
                <span className="sr-only">Search invoices</span>
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search invoice no., customer or TIN…"
                    className="h-10 w-72 rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white lg:w-80 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
            </label>
        </form>
    )
}
