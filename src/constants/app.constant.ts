/** Cookie holding the persisted theme (mode, side-nav collapse). */
export const THEME_COOKIE = 'theme'

/** Cookie holding the organization the user is currently working in. */
export const ORGANIZATION_COOKIE = 'org'

/** URL search param used by detail pages to open a tab */
export const TAB_URL_KEY = 'tab'

export const DEFAULT_PAGE_SIZE = 20

/** Compliance document uploads: PDF or image, at most 10 MB (matches the Storage bucket settings). */
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
