'use client'

import { useEffect, useState } from 'react'

/** Returns `value` once it has stopped changing for `wait` milliseconds. */
export default function useDebounce<T>(value: T, wait = 300) {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), wait)
        return () => clearTimeout(timer)
    }, [value, wait])
    return debounced
}
