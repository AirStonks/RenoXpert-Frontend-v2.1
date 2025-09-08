"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, CreditCard, Calendar, Building, FileText, Download, ExternalLink } from 'lucide-react'
import type { Payment, Attachment } from "../../../types"

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

interface PaymentDetailModalProps {
    paymentId: string | null
    payment: Payment | null
    isOpen: boolean
    onClose: () => void
}

export default function PaymentDetailModal({ paymentId, payment, isOpen, onClose }: PaymentDetailModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-MY", {
            style: "currency",
            currency: "MYR",
            minimumFractionDigits: 2,
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
    }

    const getPaymentMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
            credit_card: "Credit Card",
            epp: "EPP",
            bank_transfer: "Bank Transfer",
            fpx: "FPX",
            e_wallet: "E-Wallet",
            cash: "Cash",
        }
        return methods[method] || method
    }

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) {
            return "🖼️"
        }
        if (mimeType === "application/pdf") {
            return "📄"
        }
        return "📎"
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <>
            <style>{`
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
                <div className="modal-content relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white/95 backdrop-blur-sm border-b border-gray-200/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                                <CreditCard className="h-6 w-6 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                <span className="ml-3 text-gray-600">Loading payment details...</span>
                            </div>
                        ) : payment ? (
                            <div className="space-y-6">
                                {/* Payment Information */}
                                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl p-6 border border-blue-100/50">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Transaction No</span>
                                                <span className="text-sm font-bold text-gray-900">{payment.transaction_no}</span>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Payment Channel</span>
                                                <span className="text-sm font-medium text-gray-900 capitalize">{payment.payment_channel}</span>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Payment Method</span>
                                                <span className="text-sm font-medium text-gray-900">{getPaymentMethodLabel(payment.payment_method)}</span>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Amount</span>
                                                <span className="text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Payment Date</span>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm font-medium text-gray-900">{formatDate(payment.payment_date)}</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Bank</span>
                                                <div className="flex items-center gap-2">
                                                    <Building className="h-4 w-4 text-gray-500" />
                                                    <span className="text-sm font-medium text-gray-900">{payment.bank}</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Receiving Account</span>
                                                <span className="text-sm font-medium text-gray-900">{payment.receiving_account}</span>
                                            </div>

                                            <div className="flex justify-between items-start p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Remark</span>
                                                <span className="text-sm font-medium text-gray-900 text-right max-w-xs">
                                                    {payment.remark || "No remark provided"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments */}
                                {payment.attachments && payment.attachments.length > 0 && (
                                    <div className="bg-gradient-to-br from-gray-50/50 to-slate-50/50 rounded-2xl p-6 border border-gray-100/50">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments ({payment.attachments.length})</h3>
                                        <div className="space-y-3">
                                            {payment.attachments.map((attachment: Attachment, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-gray-100/30 hover:bg-white/80 transition-colors duration-200"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <FileText className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{attachment.original_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => window.open(AWS_S3_URL + attachment.file_url, '_blank')}
                                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                                                            title="View file"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const link = document.createElement('a')
                                                                link.href = AWS_S3_URL + attachment.file_url
                                                                link.download = attachment.original_name
                                                                link.click()
                                                            }}
                                                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                            title="Download file"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Transaction Timeline */}
                                <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl p-6 border border-emerald-100/50">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Timeline</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">Payment Completed</p>
                                                <p className="text-xs text-gray-600">{formatDate(payment.created_at)}</p>
                                            </div>
                                            <div className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                                                Completed
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <CreditCard className="h-8 w-8 text-gray-500" />
                                </div>
                                <p className="text-gray-600">Payment details not found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
