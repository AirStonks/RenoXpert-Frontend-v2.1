"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Campaign, Booking } from "../types"
import { createBooking } from "../services/api"
import { Slide, toast } from "react-toastify"
import Loading from "./Loading"
import {
    X,
    CreditCard,
    DollarSign,
    Calendar,
    FileText,
    Plus,
} from "lucide-react"

interface GenerateBookingModalProps {
    campaign: Campaign | null
    isOpen: boolean
    onClose: () => void
    onGenerate: (campaignId: string, newBooking: Booking) => void
}

function GenerateBookingModal({ campaign, isOpen, onClose, onGenerate }: GenerateBookingModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    const [formData, setFormData] = useState({
        campaignId: null,
        amount: 0,
        internal_remark: '',
        expired_at: ''
    })

    // Handle animation state
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    // Prevent body scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

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
        })
    }

    useEffect(() => {
        if (campaign) {
            setFormData((prev) => ({
                ...prev,
                campaignId: campaign.id,
                amount: campaign.base_amount,
            }))
        }
    }, [campaign])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!campaign) return

        setIsLoading(true)

        const bookingData = {
            campaign_id: campaign.id,
            amount: formData.amount,
            internal_remark: formData.internal_remark,
            expired_at: formData.expired_at || null,
        }

        try {
            const response = await createBooking(bookingData)

            if (response?.success) {
                onGenerate(campaign.id, response.data as Booking)

                setFormData({
                    campaignId: null,
                    amount: 0,
                    internal_remark: '',
                    expired_at: ''
                })

                onClose()
                notify('success', "Booking Generated Successfully!")
            } else {
                notify('error', response.message || 'Failed to generate booking')
                setIsLoading(false)
            }
        } catch (error: any) {
            console.log(error.message)
            notify('error', 'Error occurred during booking generation.')
        } finally {
            setIsLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-MY", {
            style: "currency",
            currency: "MYR",
            minimumFractionDigits: 2,
        }).format(amount)
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    if (!isVisible || !campaign) return null

    return (
        <>
            {isLoading && <Loading />}

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }

                @keyframes slideIn {
                    from {
                        transform: scale(0.95) translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOut {
                    from {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: scale(0.95) translateY(20px);
                        opacity: 0;
                    }
                }

                .modal-backdrop {
                    animation: ${isOpen ? "fadeIn" : "fadeOut"} 300ms ease-in-out forwards;
                }

                .modal-content {
                    animation: ${isOpen ? "slideIn" : "slideOut"} 300ms ease-in-out forwards;
                }
            `}</style>

            <div
                className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={handleBackdropClick}
            >
                <div className="modal-content relative w-full max-w-7xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white/95 backdrop-blur-sm border-b border-gray-200/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-full">
                                <CreditCard className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Generate Booking</h2>
                                <p className="text-sm text-gray-600">{campaign.title}</p>
                            </div>
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
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Left Column - Campaign Information */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Campaign Information Card */}
                                <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-2xl p-6 border border-green-100/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <FileText className="h-5 w-5 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Campaign Information</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Campaign ID</span>
                                            <span className="text-sm font-bold text-gray-900">#{campaign.id}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Title</span>
                                            <span className="text-sm font-medium text-gray-900 text-right max-w-32 truncate">{campaign.title}</span>
                                        </div>

                                        {campaign.base_amount && (
                                            <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                                <span className="text-sm font-medium text-gray-600">Base Amount</span>
                                                <span className="text-sm font-medium text-gray-900">{formatCurrency(campaign.base_amount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Total Slots</span>
                                            <span className="text-sm font-medium text-gray-900">{campaign.slot_total}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Remaining Slots</span>
                                            <span className="text-sm font-medium text-gray-900">{campaign.slot_remaining}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">Status</span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                                                campaign.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                                    campaign.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Booking Form */}
                            <div className="lg:col-span-3 space-y-6">
                                <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl p-6 border border-blue-100/50">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <Plus className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Amount Field */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Amount (RM) *
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={formData.amount}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all duration-200"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        {/* Expiry Date Field */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Expiry Date
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input
                                                    type="datetime-local"
                                                    name="expired_at"
                                                    value={formData.expired_at}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all duration-200"
                                                />
                                            </div>
                                        </div>

                                        {/* Internal Remark Field */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Internal Remark
                                            </label>
                                            <textarea
                                                name="internal_remark"
                                                value={formData.internal_remark}
                                                onChange={handleInputChange}
                                                rows={4}
                                                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all duration-200 resize-none"
                                                placeholder="Optional internal notes about this booking..."
                                            />
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 bg-white/95 backdrop-blur-sm border-t border-gray-200/50">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors duration-200 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!formData.amount || isLoading}
                            className="px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-2xl transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-4 w-4" />
                                    Generate Booking
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default GenerateBookingModal
