'use client'

import { useEffect, useState } from 'react'
import Input, { type InputProps } from '@/components/ui/Input'

type DebounceInputProps = Omit<InputProps, 'onChange' | 'value'> & {
    value: string
    /** Called once the user stops typing. Pass a stable function (e.g. a store action). */
    onChange: (value: string) => void
    wait?: number
}

/** Text input that reports changes after the user stops typing (search boxes). */
export default function DebounceInput({ value, onChange, wait = 350, ...rest }: DebounceInputProps) {
    const [text, setText] = useState(value)
    const [previousValue, setPreviousValue] = useState(value)

    // Follow outside changes to `value` (e.g. filters reset) without an effect
    if (value !== previousValue) {
        setPreviousValue(value)
        setText(value)
    }

    useEffect(() => {
        if (text === value) return
        const timer = setTimeout(() => onChange(text), wait)
        return () => clearTimeout(timer)
    }, [text, value, wait, onChange])

    return <Input {...rest} value={text} onChange={(e) => setText(e.target.value)} />
}
