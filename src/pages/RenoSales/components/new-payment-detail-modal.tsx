"use client"

import type React from "react"
import { useState, useRef } from "react"
import { X, Upload, Trash2, CreditCard, Calendar, DollarSign, FileText, Building } from 'lucide-react'
import { Payment } from "../../../types"
import { Slide, toast } from "react-toastify"

interface NewPaymentDetailModalProps {
    invoiceId: string | null
    isOpen: boolean
    onClose: () => void
    onSave: (invoiceId: string, paymentData: Payment) => Promise<boolean>
}

interface FormData {
    transaction_no: string
    payment_method: string
    payment_channel: string
    amount: number
    payment_date: string
    receiving_account: string
    remark: string
    bank: string
}

const initFormData: FormData = {
    transaction_no: "",
    payment_method: "",
    payment_channel: "",
    amount: 0,
    payment_date: "",
    receiving_account: "",
    remark: "",
    bank: "",
}

const paymentOptions = {
    online: [
        { value: "credit_card", label: "Credit Card" },
        { value: "epp", label: "EPP" },
        { value: "bank_transfer", label: "Bank Transfer" },
        { value: "fpx", label: "FPX" },
        { value: "e_wallet", label: "E-Wallet" },
    ],
    offline: [
        { value: "cash", label: "Cash" },
    ],
}

const bankOptions = [
    { value: "", label: "Select a bank" },
    { value: "Affin Bank Berhad", label: "Affin Bank Berhad" },
    { value: "Affin Islamic Bank Berhad", label: "Affin Islamic Bank Berhad" },
    { value: "Alliance Bank Malaysia Berhad", label: "Alliance Bank Malaysia Berhad" },
    { value: "Alliance Islamic Bank Malaysia Berhad", label: "Alliance Islamic Bank Malaysia Berhad" },
    { value: "Al Rajhi Banking & Investment Corporation (Malaysia) Berhad", label: "Al Rajhi Banking & Investment Corporation (Malaysia) Berhad" },
    { value: "AmBank (M) Berhad", label: "AmBank (M) Berhad" },
    { value: "Bank Islam Malaysia Berhad", label: "Bank Islam Malaysia Berhad" },
    { value: "Bank Muamalat Malaysia Berhad", label: "Bank Muamalat Malaysia Berhad" },
    { value: "Bank of China (Malaysia) Berhad", label: "Bank of China (Malaysia) Berhad" },
    { value: "Bank SimpananNasional", label: "Bank SimpananNasional" },
    { value: "CIMB Bank Berhad", label: "CIMB Bank Berhad" },
    { value: "CIMB Islamic Bank Berhad", label: "CIMB Islamic Bank Berhad" },
    { value: "Citibank Berhad", label: "Citibank Berhad" },
    { value: "GX Bank Berhad", label: "GX Bank Berhad" },
    { value: "Hong Leong Bank Berhad", label: "Hong Leong Bank Berhad" },
    { value: "Hong Leong Islamic Bank Berhad", label: "Hong Leong Islamic Bank Berhad" },
    { value: "HSBC Amanah Malaysia Berhad", label: "HSBC Amanah Malaysia Berhad" },
    { value: "HSBC Bank Malaysia Berhad", label: "HSBC Bank Malaysia Berhad" },
    { value: "Kuwait Finance House", label: "Kuwait Finance House" },
    { value: "Malayan Banking (Maybank) Berhad", label: "Malayan Banking (Maybank) Berhad" },
    { value: "OCBC Bank (Malaysia) Berhad", label: "OCBC Bank (Malaysia) Berhad" },
    { value: "Public Bank Berhad", label: "Public Bank Berhad" },
    { value: "RHB Bank Berhad", label: "RHB Bank Berhad" },
    { value: "RHB Islamic Berhad", label: "RHB Islamic Berhad" },
    { value: "Ryt Bank (YTL Digital Bank Berhad)", label: "Ryt Bank (YTL Digital Bank Berhad)" },
    { value: "Standard Chartered Bank Malaysia Berhad", label: "Standard Chartered Bank Malaysia Berhad" },
    { value: "United Overseas Bank (Malaysia) Berhad", label: "United Overseas Bank (Malaysia) Berhad" },
    { value: "Touch 'n Go (TNG) eWallet", label: "Touch 'n Go (TNG) eWallet" },
    { value: "GrabPay", label: "GrabPay" },
]

const receivingAccOptions = [
    { value: "", label: "Select an account" },
    { value: "BeLive", label: "BeLive" },
    { value: "Smartlever", label: "Smartlever" },
    { value: "RenoXpert", label: "RenoXpert" },
]

export default function NewPaymentDetailModal({ invoiceId, isOpen, onClose, onSave }: NewPaymentDetailModalProps) {
    const [formData, setFormData] = useState<FormData>(initFormData)
    const [attachments, setAttachments] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        if (name === "payment_channel") {
            if (value === "online") {
                setFormData((prev) => ({ ...prev, payment_method: "credit_card" }))
            } else if (value === "offline") {
                setFormData((prev) => ({ ...prev, payment_method: "cash" }))
            }
        }

        setFormData((prev) => ({
            ...prev,
            [name]: name === "amount" ? Number.parseFloat(value) || 0 : value,
        }))
    }

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return
        const newFiles = Array.from(files)
        setAttachments((prev) => [...prev, ...newFiles])
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        handleFileSelect(e.dataTransfer.files)
    }

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index))
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
    }

    const isFormValid = () => {
        const requiredFields: (keyof FormData)[] = [
            "transaction_no",
            "payment_channel",
            "payment_method",
            "amount",
            "payment_date",
            "receiving_account",
            "bank",
        ]

        return requiredFields.every((field) => {
            const value = formData[field]
            if (typeof value === "string") return value.trim() !== ""
            if (typeof value === "number") return value > 0
            return false
        })
    }

    const handleSubmit = async () => {
        if (!isFormValid()) return

        setIsSaving(true)

        try {
            const success = await onSave(invoiceId, {
                invoice_id: invoiceId,
                ...formData,
                attachments,
            })
            if (success) {
                notify("success", "Payment saved successfully")
                onClose()
            } else {
                console.error("Failed to save payment")
            }
        } catch (error) {
            console.error("Failed to save payment:", error)
        } finally {
            setFormData(initFormData)
            setAttachments([])
            setIsSaving(false)
        }
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
                            <div className="p-2 bg-emerald-100 rounded-full">
                                <CreditCard className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">New Payment Detail</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
                        {/* Transaction Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Transaction No.</label>
                            <p className="text-xs text-gray-600 mb-3">The payment transaction number for this invoice</p>
                            <input
                                type="text"
                                name="transaction_no"
                                value={formData.transaction_no}
                                onChange={handleChange}
                                placeholder="ABC123"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                            />
                        </div>

                        {/* Payment Channel */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Payment Channel</label>
                            <p className="text-xs text-gray-600 mb-3">Select a payment channel for this invoice</p>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="payment_channel"
                                        value="online"
                                        checked={formData.payment_channel === "online"}
                                        onChange={handleChange}
                                        className="text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-gray-700">Online</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="payment_channel"
                                        value="offline"
                                        checked={formData.payment_channel === "offline"}
                                        onChange={handleChange}
                                        className="text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-gray-700">Offline</span>
                                </label>
                            </div>
                        </div>

                        {formData.payment_channel && (
                            <>
                                {/* Payment Method */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Payment Method</label>
                                    <p className="text-xs text-gray-600 mb-3">Select a payment method for this invoice</p>
                                    <select
                                        name="payment_method"
                                        value={formData.payment_method}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                                    >
                                        {(formData.payment_channel === "online" ? paymentOptions.online : paymentOptions.offline).map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Amount (RM)</label>
                                    <p className="text-xs text-gray-600 mb-3">The payment amount of this invoice</p>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={formData.amount || ""}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                                        />
                                    </div>
                                </div>

                                {/* Payment Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Payment Date</label>
                                    <p className="text-xs text-gray-600 mb-3">Select a date of when the payment was made</p>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="date"
                                            name="payment_date"
                                            value={formData.payment_date}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                                        />
                                    </div>
                                </div>

                                {/* Bank */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Bank</label>
                                    <p className="text-xs text-gray-600 mb-3">Select a bank for this invoice</p>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Building className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <select
                                            name="bank"
                                            value={formData.bank}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                                        >
                                            {bankOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Receiving Account */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Receiving Account</label>
                                    <p className="text-xs text-gray-600 mb-3">The receiving account for this invoice</p>
                                    <select
                                        name="receiving_account"
                                        value={formData.receiving_account}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200"
                                    >
                                        {receivingAccOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Remark */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Remark (Optional)</label>
                                    <p className="text-xs text-gray-600 mb-3">Remark for this invoice</p>
                                    <textarea
                                        name="remark"
                                        value={formData.remark}
                                        onChange={handleChange}
                                        placeholder="Enter remark..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200 resize-none"
                                    />
                                </div>

                                {/* Attachments */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-900 mb-2">Attachments</label>
                                    <p className="text-xs text-gray-600 mb-3">Upload files to attach to this invoice</p>

                                    {/* Show attachments list first if there are any */}
                                    {attachments.length > 0 && (
                                        <div className="mb-4 space-y-2">
                                            {attachments.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <FileText className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                            <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeAttachment(index)}
                                                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-200"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload input - always shown, but with different styling when there are attachments */}
                                    <div
                                        className={`border-2 border-dashed rounded-2xl text-center transition-colors duration-200 ${isDragging ? "border-emerald-400 bg-emerald-50" : "border-gray-300 hover:border-emerald-400"
                                            } ${attachments.length > 0 ? "mt-4 p-4" : "p-8"}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className={`flex items-center gap-3 ${attachments.length > 0 ? "justify-center" : "flex-col"}`}>
                                            <div className={`bg-emerald-100 rounded-full ${attachments.length > 0 ? "p-2" : "p-3"}`}>
                                                <Upload className={`text-emerald-600 ${attachments.length > 0 ? "h-4 w-4" : "h-6 w-6"}`} />
                                            </div>
                                            <div className={attachments.length > 0 ? "text-center" : ""}>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {attachments.length > 0 ? "Add more files" : "Click or drag & drop files here"}
                                                </p>
                                                <p className="text-xs text-gray-600">Max size: 50MB | Max files: 10</p>
                                            </div>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            onChange={(e) => handleFileSelect(e.target.files)}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 bg-white/95 backdrop-blur-sm border-t border-gray-200/50">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors duration-200 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!isFormValid() || isSaving}
                            className="px-6 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-4 w-4" />
                                    Save Payment and Mark as Paid
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
