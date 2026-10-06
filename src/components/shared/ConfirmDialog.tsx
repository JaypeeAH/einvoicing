'use client'

import Dialog from '@/components/ui/Dialog'
import Button, { type ButtonProps } from '@/components/ui/Button'
import StatusIcon from '@/components/ui/StatusIcon'
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
    isOpen: boolean
    type?: 'info' | 'success' | 'warning' | 'danger'
    title: ReactNode
    children?: ReactNode
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    onClose: () => void
    /** Submit this form id instead of calling onConfirm (lets a form inside the dialog validate first). */
    confirmForm?: string
    confirmButtonProps?: Partial<ButtonProps>
    closable?: boolean
    width?: number
}

const CONFIRM_CLASS = {
    info: '',
    success: '',
    warning: '!bg-warning hover:!bg-warning/90',
    danger: '!bg-error hover:!bg-error/90',
}

/** Confirmation dialog for consequential actions (issue, void, delete). */
export default function ConfirmDialog({
    isOpen,
    type = 'info',
    title,
    children,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onClose,
    confirmForm,
    confirmButtonProps,
    closable = true,
    width = 520,
}: ConfirmDialogProps) {
    return (
        <Dialog
            isOpen={isOpen}
            width={width}
            closable={closable}
            onClose={() => closable && onClose()}
            onRequestClose={() => closable && onClose()}
        >
            <div className="flex gap-4">
                <div className="mt-0.5 text-3xl">
                    <StatusIcon type={type} />
                </div>
                <div className="min-w-0 flex-auto">
                    <h4 className="heading-text mb-2 pr-6">{title}</h4>
                    <div className="text-gray-600 dark:text-gray-300">{children}</div>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <Button size="sm" onClick={onClose} disabled={!closable}>
                    {cancelText}
                </Button>
                <Button
                    size="sm"
                    variant="solid"
                    className={CONFIRM_CLASS[type]}
                    form={confirmForm}
                    type={confirmForm ? 'submit' : 'button'}
                    onClick={confirmForm ? undefined : onConfirm}
                    {...confirmButtonProps}
                >
                    {confirmText}
                </Button>
            </div>
        </Dialog>
    )
}
