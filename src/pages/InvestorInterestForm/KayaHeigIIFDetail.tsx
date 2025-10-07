"use client"

import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Phone, Mail, User, ArrowLeft, Users, CheckCircle } from "lucide-react"
import type { KayanaHeightsInterest } from "../../types"
import { fetchKayaHeigInterest } from "../../services/api"

const LOCAL_PATH_PREFIX = window.location.hostname === "localhost" ? "/staff/" : "/"

const statusConfig = {
    new: { label: "New", color: "bg-[#F9A533]", textColor: "text-white" },
    reviewed: { label: "Reviewed", color: "bg-blue-500", textColor: "text-white" },
    contacted: { label: "Contacted", color: "bg-green-500", textColor: "text-white" },
    closed: { label: "Closed", color: "bg-gray-500", textColor: "text-white" },
}

const rentalPlanLabels: { [key: string]: string } = {
    "room-rental": "Room rental / Co-living",
    "whole-unit": "Whole unit rental",
    "airbnb": "Airbnb / short-term",
    "not-sure": "Not sure yet",
    "own-stay": "Might be for own stay",
}

const concernLabels: { [key: string]: string } = {
    "stable-rental": "I want stable rental",
    "no-self-manage": "I don't want to self-manage",
    "not-sure-what-to-do": "I'm not sure what to do with the property",
    "maximize-appreciation": "I want to maximise long-term capital appreciation",
    "just-exploring": "I'm just exploring now",
}

const supportLabels: { [key: string]: string } = {
    "belive-services": "I want to know more about BeLive's services",
    "renovation-quotation": "I want a renovation quotation",
    "feasibility-check": "I want a rental feasibility check on my unit",
    "rental-strategy": "I want to know more rental strategy available for Kayana Heights",
    "property-consultant": "I want to speak to a property consultant",
}

export default function KayaHeigIIFDetail() {
    const navigate = useNavigate()
    // const { state } = useLocation()
    const { id } = useParams<{ id: string }>()
    const formId = id ? Number.parseInt(id, 10) : null

    const [detail, setDetail] = useState<KayanaHeightsInterest | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    const handleBack = () => {
        navigate(LOCAL_PATH_PREFIX + "kayana-heights-interest-forms")
    }

    useEffect(() => {
        const controller = new AbortController()
        const loadDetail = async () => {
            if (!formId) return
            try {
                setLoading(true)
                const response = await fetchKayaHeigInterest(formId, controller.signal)
                setDetail(response?.data || null)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        loadDetail()
        return () => controller.abort()
    }, [formId])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    if (loading) return <div className="p-6">Loading...</div>
    if (!detail) return <div className="p-6">Not found</div>

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
                <div className="px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                            onClick={handleBack}
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Kayana Heights Interest Detail</h1>
                            <p className="text-sm text-gray-600"></p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#D71E42] to-[#F05A22] px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{detail.full_name}</h2>
                                <p className="text-white/80">Submitted: {detail.created_at ? formatDate(detail.created_at) : '-'}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[detail.status || 'new'].color} ${statusConfig[detail.status || 'new'].textColor}`}
                                >
                                    {statusConfig[detail.status || 'new'].label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="w-5 h-5 text-[#D71E42] mr-2" />
                                Contact Information
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                                    <Phone className="w-5 h-5 text-[#F05A22] mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-600">Mobile Number</p>
                                        <p className="font-medium">{detail.mobile_number}</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                                    <Mail className="w-5 h-5 text-[#F05A22] mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{detail.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="w-5 h-5 text-[#D71E42] mr-2" />
                                Kayana Unit Information
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">Tower</p>
                                    <p className="font-medium">{detail.tower}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">Floor</p>
                                    <p className="font-medium">{detail.floor}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">Unit Type</p>
                                    <p className="font-medium">{detail.unit_type}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">Units Owned</p>
                                    <p className="font-medium">{detail.units_owned}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Users className="w-5 h-5 text-[#D71E42] mr-2" />
                                Preferences
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">Preferred Contact</p>
                                    <p className="font-medium capitalize">{detail.preferred_contact}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">Preferred Time</p>
                                    <p className="font-medium">{detail.preferred_time?.replace("-", " ") || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <CheckCircle className="w-5 h-5 text-[#D71E42] mr-2" />
                                Selected Options
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Rental Plan</p>
                                    <div className="space-y-2">
                                        {(detail.rental_plan || []).map((item) => (
                                            <div key={item} className="flex items-center p-3 bg-orange-50 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-[#F05A22] mr-2" />
                                                <span className="text-gray-800">{rentalPlanLabels[item] || item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Concerns / Priorities</p>
                                    <div className="space-y-2">
                                        {(detail.concerns || []).map((item) => (
                                            <div key={item} className="flex items-center p-3 bg-red-50 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-[#D71E42] mr-2" />
                                                <span className="text-gray-800">{concernLabels[item] || item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Support Needed</p>
                                    <div className="space-y-2">
                                        {(detail.support_needed || []).map((item) => (
                                            <div key={item} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                                                <CheckCircle className="w-4 h-4 text-[#F9A533] mr-2" />
                                                <span className="text-gray-800">{supportLabels[item] || item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {detail.additional_info && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Info</h3>
                                <div className="p-4 bg-gray-50 rounded-xl text-gray-700 whitespace-pre-wrap">
                                    {detail.additional_info}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
