import cn from 'classnames'
import { twMerge } from 'tailwind-merge'

/** Combines `classnames` with `tailwind-merge` so later Tailwind classes win conflicts. */
export default function classNames(...args: cn.ArgumentArray) {
    return twMerge(cn(args))
}
