/** Errors thrown by server code and mapped to HTTP status codes by the API handler wrappers. */
export class ApiError extends Error {
    status: number
    code?: string
    details?: unknown
    constructor(status: number, message: string, code?: string, details?: unknown) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.code = code
        this.details = details
    }
}

export class DataError extends ApiError {
    constructor(message = 'The request is invalid.', details?: unknown) {
        super(400, message, 'BAD_REQUEST', details)
        this.name = 'DataError'
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message = 'Please sign in to continue.') {
        super(401, message, 'UNAUTHORIZED')
        this.name = 'UnauthorizedError'
    }
}

export class ForbiddenError extends ApiError {
    constructor(message = 'You do not have permission to do this.') {
        super(403, message, 'FORBIDDEN')
        this.name = 'ForbiddenError'
    }
}

export class NotFoundError extends ApiError {
    constructor(message = 'The record was not found.') {
        super(404, message, 'NOT_FOUND')
        this.name = 'NotFoundError'
    }
}

export class ConflictError extends ApiError {
    constructor(message = 'The record was changed by someone else.') {
        super(409, message, 'CONFLICT')
        this.name = 'ConflictError'
    }
}
