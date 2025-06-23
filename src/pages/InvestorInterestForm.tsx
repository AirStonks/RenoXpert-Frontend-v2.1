"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
    Building2,
    MessageSquare,
    CheckCircle,
    User,
    Phone,
    Mail,
    Home,
    Key,
    Target,
    Users,
    Calendar,
    Shield,
    AlertCircle,
} from "lucide-react"
import { submitInvestorInterestForm } from "../services/publicApi";
import { Slide, toast, ToastContainer } from "react-toastify";

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/app/'
        : '/app/';

interface FormData {
    // Owner & Unit Details
    fullName: string
    mobileNumber: string
    email: string
    propertyName: string
    unitType: string
    keysCollected: string

    // What's On Your Mind
    concerns: string[]

    // Rental Strategy
    rentalStrategy: string[]

    // Support Needed
    supportNeeded: string[]

    // Contact Preferences
    preferredContact: string
    preferredTime: string
}

interface FormErrors {
    [key: string]: string
}

function InvestorInterestForm() {
    const [formData, setFormData] = useState<FormData>({
        fullName: "",
        mobileNumber: "",
        email: "",
        propertyName: "",
        unitType: "",
        keysCollected: "",
        concerns: [],
        rentalStrategy: [],
        supportNeeded: [],
        preferredContact: "",
        preferredTime: "",
    })

    const [errors, setErrors] = useState<FormErrors>({})
    const [isSubmitted, setIsSubmitted] = useState(false)

    const notify = (type: "success" | "error", message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem("theme"),
            transition: Slide,
        });
    };

    const unitTypes = ["Studio", "2 Rooms", "3 Rooms", "4+ Rooms", "Dual Key", "Other"]

    const keysOptions = [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "soon", label: "Not Yet, But Soon" },
    ]

    const concernOptions = [
        { id: "keys-collected", label: "I just collected keys and not sure what's next" },
        { id: "renovation-guidance", label: "I want to renovate for rental but don't know how" },
        {
            id: "compare-strategies",
            label: "I want to compare different rental strategies (Airbnb / whole unit / CoLiving)",
        },
        { id: "income-no-manage", label: "I'm interested in rental income but don't want to self-manage" },
        { id: "maximize-roi", label: "I want to maximise rental ROI with minimal involvement" },
        { id: "explore-coliving", label: "I already renovated but want to explore CoLiving" },
    ]

    const strategyOptions = [
        { id: "whole-unit", label: "Whole unit rental (long-term tenant)" },
        { id: "airbnb", label: "Airbnb / short-term stay" },
        { id: "waiting", label: "Waiting to decide" },
        { id: "not-sure", label: "Not sure — want to learn what's best" },
        { id: "curious-coliving", label: "Never heard of CoLiving — curious to understand more" },
        { id: "interested-coliving", label: "CoLiving sounds interesting — tell me more" },
    ]

    const supportOptions = [
        { id: "be_powererd", label: "I'm interested about BePowered 2.0 Program" },
        { id: "quotation", label: "I want a renovation quotation" },
        { id: "feasibility", label: "I want a CoLiving feasibility check on my unit" },
        { id: "consultant", label: "I want to speak to a property consultant" },
        { id: "webinar", label: "I want to join the next live webinar about rental strategies" },
        { id: "info", label: "Just want more info for now" },
    ]

    const contactMethods = [
        { value: "whatsapp", label: "WhatsApp" },
        { value: "call", label: "Call" },
        { value: "email", label: "Email" },
    ]

    const timePreferences = [
        { value: "weekday-morning", label: "Weekday Morning" },
        { value: "weekday-afternoon", label: "Weekday Afternoon" },
        { value: "evening", label: "Evening" },
        { value: "weekend", label: "Weekend" },
    ]

    useEffect(() => {
        document.title = 'Investor Interest Form';
    }, [])

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        // Required fields
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required"
        if (!formData.mobileNumber.trim()) {
            newErrors.mobileNumber = "Mobile number is required"
        } else if (!/^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/.test(formData.mobileNumber.replace(/\s/g, ""))) {
            newErrors.mobileNumber = "Please enter a valid Malaysian mobile number"
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address"
        }
        if (!formData.propertyName.trim()) newErrors.propertyName = "Property name is required"
        if (!formData.unitType) newErrors.unitType = "Unit type is required"
        if (!formData.keysCollected) newErrors.keysCollected = "Please select keys collection status"
        if (formData.concerns.length === 0) newErrors.concerns = "Please select at least one concern"
        if (formData.rentalStrategy.length === 0)
            newErrors.rentalStrategy = "Please select at least one rental strategy option"
        if (formData.supportNeeded.length === 0) newErrors.supportNeeded = "Please select at least one support option"
        if (!formData.preferredContact) newErrors.preferredContact = "Please select preferred contact method"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }))
        }
    }

    const handleMultiSelectChange = (field: "concerns" | "rentalStrategy" | "supportNeeded", optionId: string) => {
        const currentValues = formData[field]
        const newValues = currentValues.includes(optionId)
            ? currentValues.filter((id) => id !== optionId)
            : [...currentValues, optionId]

        setFormData((prev) => ({ ...prev, [field]: newValues }))
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (validateForm()) {
            try {
                const response = await submitInvestorInterestForm(formData);

                if (response?.success) {
                    setIsSubmitted(true)
                }

            } catch (error) {
                console.log(error);
            }
        } else {
            console.log('yes');

            notify("error", "Please fix the errors in the form before submitting.")
        }
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-red-100 p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#F9A533] to-[#D71E42] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Your interest form has been submitted successfully. Our RenoXpert property consultant will reach out to you
                        soon to discuss your rental strategy options.
                    </p>
                    <button
                        onClick={() => {
                            setIsSubmitted(false)
                            setFormData({
                                fullName: "",
                                mobileNumber: "",
                                email: "",
                                propertyName: "",
                                unitType: "",
                                keysCollected: "",
                                concerns: [],
                                rentalStrategy: [],
                                supportNeeded: [],
                                preferredContact: "",
                                preferredTime: "",
                            })
                        }}
                        className="bg-gradient-to-r from-[#D71E42] to-[#F05A22] text-white px-8 py-3 rounded-full hover:from-[#B91C3C] hover:to-[#DC2626] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                    >
                        Submit Another Form
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-max w-full bg-slate-50 py-12 px-4">
            <div className="max-w-4xl mx-auto mb-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center mb-8">
                        <div className="w-16 h-16 bg-[#D71E42] rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                            <img
                                src={`${MEDIA_URL}red-bg-ico.jpg`}
                                alt=""
                                className="object-cover w-16 h-16 rounded-2xl shadow-lg"
                            />
                        </div>
                        <div className="text-left">
                            <h1 className="text-4xl font-bold bg-[#D71E42] bg-clip-text text-transparent">
                                RenoXpert
                            </h1>
                            <p className="text-lg text-gray-500 font-medium text-right">Reno for ROI</p>
                        </div>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                        Not Sure What To Do After Vacant Possession?
                    </h2>
                    <h3 className="text-2xl font-semibold bg-gradient-to-r from-[#D71E42] to-[#F9A533] bg-clip-text text-transparent mb-8">
                        Let's Explore Your Best Rental Strategy.
                    </h3>
                    <div className="max-w-3xl mx-auto text-gray-700 space-y-4 text-lg leading-relaxed">
                        <p className="font-semibold text-gray-900">Just got your keys? You're not alone.</p>
                        <p>Many property owners delay action simply because they're unsure of the next step.</p>
                        <p>
                            Whether you're thinking about whole unit rental, Airbnb, or exploring high-yield CoLiving options, this
                            form will help us guide you toward the right decision — backed by real ROI data, not guesswork.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden"
                >
                    {/* Step 1: Owner & Unit Details */}
                    <div className="bg-gradient-to-r from-[#D71E42] to-[#F05A22] px-8 py-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Step 1: Owner & Unit Details</h3>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#D71E42] focus:border-[#D71E42] transition-all duration-200 ${errors.fullName ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-[#F9A533]"
                                        }`}
                                    placeholder="Enter your full name"
                                />
                                {errors.fullName && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.fullName}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    Mobile Number (WhatsApp Enabled) *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="tel"
                                        value={formData.mobileNumber}
                                        onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#D71E42] focus:border-[#D71E42] transition-all duration-200 ${errors.mobileNumber ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-[#F9A533]"
                                            }`}
                                        placeholder="01X-XXX XXXX"
                                    />
                                </div>
                                {errors.mobileNumber && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.mobileNumber}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#D71E42] focus:border-[#D71E42] transition-all duration-200 ${errors.email ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-[#F9A533]"
                                            }`}
                                        placeholder="your@email.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">Property Name / Condo *</label>
                                <div className="relative">
                                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={formData.propertyName}
                                        onChange={(e) => handleInputChange("propertyName", e.target.value)}
                                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#D71E42] focus:border-[#D71E42] transition-all duration-200 ${errors.propertyName ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-[#F9A533]"
                                            }`}
                                        placeholder="e.g., The Peak Residences"
                                    />
                                </div>
                                {errors.propertyName && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.propertyName}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">Unit Type *</label>
                                <select
                                    value={formData.unitType}
                                    onChange={(e) => handleInputChange("unitType", e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#D71E42] focus:border-[#D71E42] transition-all duration-200 ${errors.unitType ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-[#F9A533]"
                                        }`}
                                >
                                    <option value="">Select unit type</option>
                                    {unitTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {errors.unitType && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.unitType}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">Keys Collected? *</label>
                                <div className="flex flex-wrap gap-3">
                                    {keysOptions.map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${formData.keysCollected === option.value
                                                ? "border-[#D71E42] bg-red-50 shadow-md"
                                                : "border-gray-200 hover:border-[#F9A533]"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="keysCollected"
                                                value={option.value}
                                                checked={formData.keysCollected === option.value}
                                                onChange={(e) => handleInputChange("keysCollected", e.target.value)}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center transition-colors ${formData.keysCollected === option.value ? "border-[#D71E42] bg-[#D71E42]" : "border-gray-300"
                                                    }`}
                                            >
                                                {formData.keysCollected === option.value && (
                                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                                )}
                                            </div>
                                            <Key className="w-4 h-4 text-gray-600 mr-2" />
                                            <span className="text-sm font-medium text-gray-900">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.keysCollected && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.keysCollected}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 2: What's On Your Mind */}
                    <div className="bg-gradient-to-r from-[#F05A22] to-[#F9A533] px-8 py-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                                <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Step 2: What's On Your Mind?</h3>
                        </div>
                    </div>

                    <div className="p-8">
                        <p className="text-gray-700 mb-6 font-medium">Select all that apply:</p>
                        <div className="space-y-3">
                            {concernOptions.map((concern) => (
                                <label
                                    key={concern.id}
                                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${formData.concerns.includes(concern.id)
                                        ? "border-[#D71E42] bg-red-50 shadow-md"
                                        : "border-gray-200 hover:border-[#F9A533]"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.concerns.includes(concern.id)}
                                        onChange={() => handleMultiSelectChange("concerns", concern.id)}
                                        className="sr-only"
                                    />
                                    <div
                                        className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors ${formData.concerns.includes(concern.id) ? "border-[#D71E42] bg-[#D71E42]" : "border-gray-300"
                                            }`}
                                    >
                                        {formData.concerns.includes(concern.id) && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-gray-900">{concern.label}</span>
                                </label>
                            ))}
                        </div>
                        {errors.concerns && (
                            <p className="mt-3 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.concerns}
                            </p>
                        )}
                    </div>

                    {/* Step 3: Rental Strategy */}
                    <div className="bg-gradient-to-r from-[#F9A533] to-[#D71E42] px-8 py-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Step 3: Your Current Thoughts on Rental Strategy</h3>
                        </div>
                    </div>

                    <div className="p-8">
                        <p className="text-gray-700 mb-6 font-medium">
                            What are you currently considering? (Select all that apply)
                        </p>
                        <div className="space-y-3">
                            {strategyOptions.map((strategy) => (
                                <label
                                    key={strategy.id}
                                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${formData.rentalStrategy.includes(strategy.id)
                                        ? "border-[#D71E42] bg-red-50 shadow-md"
                                        : "border-gray-200 hover:border-[#F9A533]"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.rentalStrategy.includes(strategy.id)}
                                        onChange={() => handleMultiSelectChange("rentalStrategy", strategy.id)}
                                        className="sr-only"
                                    />
                                    <div
                                        className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors ${formData.rentalStrategy.includes(strategy.id)
                                            ? "border-[#D71E42] bg-[#D71E42]"
                                            : "border-gray-300"
                                            }`}
                                    >
                                        {formData.rentalStrategy.includes(strategy.id) && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-gray-900">{strategy.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-red-50 border-l-4 border-[#F9A533] rounded-r-xl">
                            <div className="flex items-start">
                                <div className="text-[#F05A22] mr-3 text-xl">💡</div>
                                <div>
                                    <p className="text-sm text-red-800 font-medium">
                                        <strong>Not sure?</strong> Many investors find that CoLiving can double their monthly rental yield
                                        compared to whole unit rental — especially when managed end-to-end with no stress.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {errors.rentalStrategy && (
                            <p className="mt-3 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.rentalStrategy}
                            </p>
                        )}
                    </div>

                    {/* Step 4: Support Needed */}
                    <div className="bg-gradient-to-r from-[#D71E42] to-[#F05A22] px-8 py-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Step 4: What Support Do You Need Now?</h3>
                        </div>
                    </div>

                    <div className="p-8">
                        <p className="text-gray-700 mb-6 font-medium">How can we help you today? (Select all that apply)</p>
                        <div className="space-y-3">
                            {supportOptions.map((support) => (
                                <label
                                    key={support.id}
                                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${formData.supportNeeded.includes(support.id)
                                        ? "border-[#D71E42] bg-red-50 shadow-md"
                                        : "border-gray-200 hover:border-[#F9A533]"
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.supportNeeded.includes(support.id)}
                                        onChange={() => handleMultiSelectChange("supportNeeded", support.id)}
                                        className="sr-only"
                                    />
                                    <div
                                        className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors ${formData.supportNeeded.includes(support.id) ? "border-[#D71E42] bg-[#D71E42]" : "border-gray-300"
                                            }`}
                                    >
                                        {formData.supportNeeded.includes(support.id) && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-gray-900">{support.label}</span>
                                </label>
                            ))}
                        </div>
                        {errors.supportNeeded && (
                            <p className="mt-3 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.supportNeeded}
                            </p>
                        )}
                    </div>

                    {/* Step 5: Contact Preferences */}
                    <div className="bg-gradient-to-r from-[#F05A22] to-[#F9A533] px-8 py-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Step 5: Contact Preferences</h3>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-4">Preferred Contact Method *</label>
                            <div className="flex flex-wrap gap-3">
                                {contactMethods.map((method) => (
                                    <label
                                        key={method.value}
                                        className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${formData.preferredContact === method.value
                                            ? "border-[#D71E42] bg-red-50 shadow-md"
                                            : "border-gray-200 hover:border-[#F9A533]"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="preferredContact"
                                            value={method.value}
                                            checked={formData.preferredContact === method.value}
                                            onChange={(e) => handleInputChange("preferredContact", e.target.value)}
                                            className="sr-only"
                                        />
                                        <div
                                            className={`w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center transition-colors ${formData.preferredContact === method.value ? "border-[#D71E42] bg-[#D71E42]" : "border-gray-300"
                                                }`}
                                        >
                                            {formData.preferredContact === method.value && (
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{method.label}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.preferredContact && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.preferredContact}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-4">
                                Preferred Time to Contact You (Optional)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {timePreferences.map((time) => (
                                    <label
                                        key={time.value}
                                        className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${formData.preferredTime === time.value
                                            ? "border-[#D71E42] bg-red-50 shadow-md"
                                            : "border-gray-200 hover:border-[#F9A533]"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="preferredTime"
                                            value={time.value}
                                            checked={formData.preferredTime === time.value}
                                            onChange={(e) => handleInputChange("preferredTime", e.target.value)}
                                            className="sr-only"
                                        />
                                        <div
                                            className={`w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center transition-colors ${formData.preferredTime === time.value ? "border-[#D71E42] bg-[#D71E42]" : "border-gray-300"
                                                }`}
                                        >
                                            {formData.preferredTime === time.value && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{time.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#D71E42] to-[#F05A22] text-white font-bold py-4 px-8 rounded-2xl hover:from-[#B91C3C] hover:to-[#DC2626] transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-lg"
                            >
                                Submit Interest Form
                            </button>

                            <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-red-50 border border-[#F9A533] rounded-2xl">
                                <div className="flex items-start">
                                    <Shield className="w-6 h-6 text-[#D71E42] mr-3 mt-0.5" />
                                    <p className="text-sm text-gray-700 font-medium">
                                        🔒 Your info is safe with us. This isn't a sales trap — it's a discovery journey to help you unlock
                                        your property's best potential with RenoXpert.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>


            <ToastContainer />
        </div>
    )
}

export default InvestorInterestForm
