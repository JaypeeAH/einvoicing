/** Moves focus to an element (making it focusable first) and scrolls it into view. */
export const focusElement = (element: HTMLElement) => {
    if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1')
    }
    element.focus({ preventScroll: true })
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
