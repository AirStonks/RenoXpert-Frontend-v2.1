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
} from "lucide-react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import useFetchInvestorInterest from "../../hook/useFetchInvestorInterest";
import { InvestorInterest } from "../../types";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

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
    quotation: "Renovation quotation",
    feasibility: "CoLiving feasibility check",
    consultant: "Speak to consultant",
    webinar: "Join webinar",
    info: "More information",
}

export default function IIFDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const formId = id ? parseInt(id, 10) : null;
    const { investorInterestDetail, loading, error, abort } = useFetchInvestorInterest(formId);

    const [investorInterest, setInvestorInterest] = useState<InvestorInterest | null>(null);

    const handleBack = () => {
        navigate(LOCAL_PATH_PREFIX + 'investor-interest-forms');
    }

    useEffect(() => {
        if (investorInterestDetail) {
            setInvestorInterest(investorInterestDetail);
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

    // const updateSubmissionStatus = (id: number, newStatus: Submission["status"]) => {
    //     // Update the selected submission if it matches
    //     if (investorInterest && investorInterest.id === id) {
    //         setSelectedSubmission({ ...investorInterest, status: newStatus })
    //     }
    //     console.log(`Updating submission ${id} to status: ${newStatus}`)
    //     // In a real app, this would make an API call and update the submissions list
    // }

    if (!investorInterest) {
        return <div>Loading...</div>
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header */}
            {/* <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#D71E42] rounded-xl flex items-center justify-center mr-3">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-[#D71E42] to-[#F05A22] bg-clip-text text-transparent">
                                    RenoXpert Staff Portal
                                </h1>
                                <p className="text-sm text-gray-600">Submission Details</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedSubmission(null)}
                            className="flex items-center px-4 py-2 text-gray-600 hover:text-[#D71E42] transition-colors"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div> */}

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
                                {/* <p className="text-white/80">Submission ID: {investorInterest.id}</p> */}
                                <p className="text-white/80">Submitted: {formatDate(investorInterest.created_at)}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[investorInterest.status].color
                                        } ${statusConfig[investorInterest.status].textColor}`}
                                >
                                    {statusConfig[investorInterest.status].label}
                                </span>
                                {/* <select
                                    value={investorInterest.status}
                                    // onChange={(e) =>
                                    //     updateSubmissionStatus(investorInterest.id, e.target.value as Submission["status"])
                                    // }
                                    className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1 text-sm"
                                >
                                    <option className="text-gray-800" value="new">New</option>
                                    <option className="text-gray-800" value="reviewed">Reviewed</option>
                                    <option className="text-gray-800" value="contacted">Contacted</option>
                                    <option className="text-gray-800" value="closed">Closed</option>
                                </select> */}
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
                                    <p className="font-medium">
                                        {investorInterest.preferred_time?.replace("-", " ") || "Not specified"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {/* <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                            <button className="bg-gradient-to-r from-[#D71E42] to-[#F05A22] text-white px-6 py-3 rounded-xl hover:from-[#B91C3C] hover:to-[#DC2626] transition-all duration-300 transform hover:scale-105 shadow-lg">
                                Contact Client
                            </button>
                            <button className="bg-white border-2 border-[#D71E42] text-[#D71E42] px-6 py-3 rounded-xl hover:bg-red-50 transition-all duration-300">
                                Add Notes
                            </button>
                            <button className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300">
                                Export Details
                            </button>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    )
}
