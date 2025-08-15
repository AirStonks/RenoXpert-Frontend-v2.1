"use client"

import type React from "react"
import { useState } from "react"
import { X, Trash2, AlertTriangle } from "lucide-react"
import type { Invoice } from "../../../types"

interface DeleteInvoiceModalProps {
    invoice: Invoice | null
    isOpen: boolean
    onClose: () => void
    onConfirm: (invoiceId: string) => void
}

export default function DeleteInvoiceModal({ invoice, isOpen, onClose, onConfirm }: DeleteInvoiceModalProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleConfirm = async () => {
        if (!invoice) return

        setIsDeleting(true)
        try {
            await onConfirm(invoice.id)
            onClose()
        } catch (error) {
            console.error("Failed to delete invoice:", error)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    if (!isOpen || !invoice) return null

    return (
        <>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: scale(0.95) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                .modal-backdrop {
                    animation: fadeIn 300ms ease-in-out forwards;
                }
                .modal-content {
                    animation: slideIn 300ms ease-in-out forwards;
                }
            `}</style>

            <div
                className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={handleBackdropClick}
            >
                <div className="modal-content relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                        <h2 className="text-xl font-semibold text-gray-900">Delete Invoice</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 text-center">
                        {/* Warning Icon */}
                        <div className="mx-auto mb-6 w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                            <Trash2 className="h-10 w-10 text-red-600" />
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Are you sure you want to delete this invoice?</h3>

                        {/* Invoice Number */}
                        <p className="text-sm font-medium text-gray-700 mb-6">
                            Invoice Number: <span className="font-bold">{invoice.invoice_no}</span>
                        </p>

                        {/* Warning Message */}
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
                            <div className="flex items-start gap-3">
                                <div className="p-1 bg-amber-100 rounded-full flex-shrink-0">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Sale status will not be updated</h4>
                                    <p className="text-xs text-amber-700">
                                        Sale status will remain the same after deleting this invoice to prevent duplication of the Reno
                                        Progress being generated.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors duration-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" />
                                        Delete Invoice
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
