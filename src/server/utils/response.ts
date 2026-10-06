import 'server-only'

import { NextResponse } from 'next/server'
import { ApiError } from '@/@types/errors'

const NO_STORE = { 'Cache-Control': 'private, no-store' }

/** JSON response. Tenant data is never cached by shared caches. */
export const getJsonResponse = <T>(data: T, init?: { status?: number }) =>
    NextResponse.json(data, { status: init?.status ?? 200, headers: NO_STORE })

export const getEmptyResponse = () => new NextResponse(null, { status: 204, headers: NO_STORE })

/** File download (e.g. CSV exports of BIR books). */
export const getFileResponse = (content: string | Blob | ArrayBuffer, fileName: string, contentType: string) =>
    new NextResponse(content, {
        status: 200,
        headers: {
            ...NO_STORE,
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${fileName.replace(/[^\w.\-]/g, '_')}"`,
        },
    })

interface PostgrestLikeError {
    code?: string
    message?: string
    details?: string | null
    hint?: string | null
}

const isPostgrestError = (error: unknown): error is PostgrestLikeError =>
    !!error && typeof error === 'object' && 'code' in error && 'message' in error && !(error instanceof Error)

/** Maps Postgres / PostgREST error codes raised by RLS, constraints and our functions to HTTP statuses. */
const getPostgrestStatus = (code?: string) => {
    switch (code) {
        case '42501': // insufficient privilege / RLS violation / raised permission errors
            return 403
        case 'P0002': // raised "not found"
        case 'PGRST116': // .single() found no row
            return 404
        case '23505': // unique violation
            return 409
        case '23514': // check violation / business rule
        case '23502': // not null
        case '23503': // foreign key
        case '22P02': // invalid input syntax
        case 'P0001':
            return 400
        default:
            return 500
    }
}

const friendlyPostgrestMessage = (error: PostgrestLikeError, status: number) => {
    if (error.code === '42501' && error.message?.includes('row-level security')) {
        return 'You do not have permission to do this.'
    }
    if (error.code === '23505') {
        return 'A record with the same details already exists.'
    }
    if (status === 500) {
        return 'Something went wrong while saving. Please try again.'
    }
    return error.message || 'The request could not be completed.'
}

export const getApiErrorResponse = (error: unknown) => {
    if (error instanceof ApiError) {
        return NextResponse.json(
            { message: error.message, code: error.code, details: error.details },
            { status: error.status, headers: NO_STORE },
        )
    }
    if (isPostgrestError(error)) {
        const status = getPostgrestStatus(error.code)
        if (status === 500) console.error('Database error', error)
        return NextResponse.json(
            { message: friendlyPostgrestMessage(error, status), code: error.code },
            { status, headers: NO_STORE },
        )
    }
    console.error('Unhandled API error', error)
    return NextResponse.json(
        { message: 'Something went wrong. Please try again.', code: 'INTERNAL' },
        { status: 500, headers: NO_STORE },
    )
}
