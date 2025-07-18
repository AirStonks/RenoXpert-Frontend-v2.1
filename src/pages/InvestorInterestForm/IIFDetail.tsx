"use client"

import { useState, useEffect } from "react"
import {
    Phone,
    Mail,
    Calendar,
    User,
    Home,
    MessageSquare,
    Target,
    Users,
    CheckCircle,
    ArrowLeft,
    DollarSign,
} from "lucide-react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import useFetchInvestorInterest from "../../hook/useFetchInvestorInterest"
import type { InvestorInterest } from "../../types"

const LOCAL_PATH_PREFIX = window.location.hostname === "localhost" ? "/staff/" : "/"

interface Submission {
    id: number
    submittedAt: string
    status: "new" | "reviewed" | "contacted" | "closed"
    fullName: string
    email: string
    mobileNumber: string
    propertyName: string
    unitType: string
    keysCollected: string
    concerns: string[]
    rentalStrategy: string[]
    supportNeeded: string[]
    preferredContact: string
    preferredTime: string
}

const statusConfig = {
    new: { label: "New", color: "bg-[#F9A533]", textColor: "text-white" },
    reviewed: { label: "Reviewed", color: "bg-blue-500", textColor: "text-white" },
    contacted: { label: "Contacted", color: "bg-green-500", textColor: "text-white" },
    closed: { label: "Closed", color: "bg-gray-500", textColor: "text-white" },
}

const concernLabels: { [key: string]: string } = {
    "keys-collected": "Just collected keys",
    "renovation-guidance": "Want renovation guidance",
    "compare-strategies": "Compare rental strategies",
    "income-no-manage": "Income without self-management",
    "maximize-roi": "Maximize rental ROI",
    "explore-coliving": "Explore CoLiving",
}

const strategyLabels: { [key: string]: string } = {
    "whole-unit": "Whole unit rental",
    airbnb: "Airbnb/short-term",
    waiting: "Waiting to decide",
    "not-sure": "Not sure",
    "curious-coliving": "Curious about CoLiving",
    "interested-coliving": "Interested in CoLiving",
}

const supportLabels: { [key: string]: string } = {
    be_powererd: "I'm interested about BePowered 2.0 Program",
    quotation: "Renovation quotation",
    feasibility: "CoLiving feasibility check",
    consultant: "Speak to consultant",
    webinar: "Join webinar",
    info: "More information",
}

// New labels for the additional fields
const expectedReturnLabels: { [key: string]: string } = {
    "below-2000": "Below RM 2,000",
    "2000-3500": "RM 2,000 - RM 3,500",
    "3500-5000": "RM 3,500 - RM 5,000",
    "others": "Others",
    "na": "N/A",
}

const investmentGoalLabels: { [key: string]: string } = {
    "high-monthly-return": "High monthly rental return",
    "hassle-free-management": "Hassle-free management",
    "fast-tenant-placement": "Fast tenant placement",
    "long-term-appreciation": "Long-term property capital appreciation",
    "na": "N/A",
}

export default function IIFDetail() {
    const navigate = useNavigate()
    const { state } = useLocation()
    const { id } = useParams<{ id: string }>()
    const formId = id ? Number.parseInt(id, 10) : null
    const { investorInterestDetail, loading, error, abort } = useFetchInvestorInterest(formId)

    const [investorInterest, setInvestorInterest] = useState<InvestorInterest | null>(null)

    const handleBack = () => {
        navigate(LOCAL_PATH_PREFIX + "investor-interest-forms")
    }

    useEffect(() => {
        if (investorInterestDetail) {
            setInvestorInterest(investorInterestDetail)
        }
    }, [investorInterestDetail])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    if (!investorInterest) {
        return <div>Loading...</div>
    }

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
                            <h1 className="text-xl font-bold text-gray-900">Investor Interest Form Detail</h1>
                            <p className="text-sm text-gray-600"></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Submission Details */}
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#D71E42] to-[#F05A22] px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{investorInterest.full_name}</h2>
                                <p className="text-white/80">Submitted: {formatDate(investorInterest.created_at)}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[investorInterest.status].color
                                        } ${statusConfig[investorInterest.status].textColor}`}
                                >
                                    {statusConfig[investorInterest.status].label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Contact Information */}
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
                                        <p className="font-medium">{investorInterest.mobile_number}</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                                    <Mail className="w-5 h-5 text-[#F05A22] mr-3" />
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{investorInterest.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Property Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Home className="w-5 h-5 text-[#D71E42] mr-2" />
                                Property Information
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">Property Name</p>
                                    <p className="font-medium">{investorInterest.property_name}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">Unit Type</p>
                                    <p className="font-medium">{investorInterest.unit_type}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">Keys Collected</p>
                                    <p className="font-medium capitalize">{investorInterest.keys_collected}</p>
                                </div>
                                {/* New field: Units Owned */}
                                {investorInterest.units_owned && (
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="text-sm text-gray-600">Units Owned</p>
                                        <p className="font-medium">
                                            {investorInterest.units_owned === "4-or-more"
                                                ? "4 or more"
                                                : investorInterest.units_owned === "na"
                                                    ? "N/A"
                                                    : investorInterest.units_owned
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Concerns */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <MessageSquare className="w-5 h-5 text-[#D71E42] mr-2" />
                                What's On Their Mind
                            </h3>
                            <div className="space-y-2">
                                {investorInterest.concerns.map((concern) => (
                                    <div key={concern} className="flex items-center p-3 bg-red-50 rounded-lg">
                                        <CheckCircle className="w-4 h-4 text-[#D71E42] mr-2" />
                                        <span className="text-gray-800">{concernLabels[concern]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rental Strategy */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Target className="w-5 h-5 text-[#D71E42] mr-2" />
                                Rental Strategy Thoughts
                            </h3>
                            <div className="space-y-2">
                                {investorInterest.rental_strategy.map((strategy) => (
                                    <div key={strategy} className="flex items-center p-3 bg-orange-50 rounded-lg">
                                        <CheckCircle className="w-4 h-4 text-[#F05A22] mr-2" />
                                        <span className="text-gray-800">{strategyLabels[strategy]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Investment Goals & Expected Return - New Section */}
                        {(investorInterest.expected_rental_return ||
                            (investorInterest.investment_goals && investorInterest.investment_goals.length > 0)) && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <DollarSign className="w-5 h-5 text-[#D71E42] mr-2" />
                                        Investment Goals & Expected Return
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Expected Rental Return */}
                                        {investorInterest.expected_rental_return && (
                                            <div className="p-4 bg-green-50 rounded-xl">
                                                <p className="text-sm text-gray-600">Expected Rental Return</p>
                                                <p className="font-medium text-green-800">
                                                    {expectedReturnLabels[investorInterest.expected_rental_return] ||
                                                        investorInterest.expected_rental_return}
                                                </p>
                                            </div>
                                        )}

                                        {/* Investment Goals */}
                                        {investorInterest.investment_goals && investorInterest.investment_goals.length > 0 && (
                                            <div>
                                                <p className="text-sm text-gray-600 mb-2">Investment Goals</p>
                                                <div className="space-y-2">
                                                    {investorInterest.investment_goals.map((goal) => (
                                                        <div key={goal} className="flex items-center p-3 bg-blue-50 rounded-lg">
                                                            <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                                                            <span className="text-gray-800">{investmentGoalLabels[goal] || goal}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Support Needed */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Users className="w-5 h-5 text-[#D71E42] mr-2" />
                                Support Needed
                            </h3>
                            <div className="space-y-2">
                                {investorInterest.support_needed.map((support) => (
                                    <div key={support} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                                        <CheckCircle className="w-4 h-4 text-[#F9A533] mr-2" />
                                        <span className="text-gray-800">{supportLabels[support]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Preferences */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Calendar className="w-5 h-5 text-[#D71E42] mr-2" />
                                Contact Preferences
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">Preferred Method</p>
                                    <p className="font-medium capitalize">{investorInterest.preferred_contact}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">Preferred Time</p>
                                    <p className="font-medium">{investorInterest.preferred_time?.replace("-", " ") || "Not specified"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
