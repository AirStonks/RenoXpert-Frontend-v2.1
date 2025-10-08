"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
    CheckCircle,
    User,
    Phone,
    Mail,
    Target,
    Users,
    Calendar,
    Shield,
    AlertCircle,
} from "lucide-react"
import { submitKayaHeigForm } from "../services/publicApi"
import { Slide, toast } from "react-toastify"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

interface FormData {
    // Owner & Unit Details
    fullName: string
    mobileNumber: string
    email: string
    tower: string
    floor: string
    unitType: string
    unitsOwned: string

    // Rental Goals & Investment Intent
    rentalPlan: string[]
    concerns: string[]

    // Support Needed
    supportNeeded: string[]

    // Contact Preferences
    preferredContact: string
    preferredTime: string
    additionalInfo: string
}

interface FormErrors {
    [key: string]: string
}

function KayaHeigForm() {
    const [formData, setFormData] = useState<FormData>({
        fullName: "",
        mobileNumber: "",
        email: "",
        tower: "",
        floor: "",
        unitType: "",
        unitsOwned: "",
        rentalPlan: [],
        concerns: [],
        supportNeeded: [],
        preferredContact: "",
        preferredTime: "",
        additionalInfo: "",
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
        })
    }

    const towerOptions = [
        { value: "A1", label: "A1" },
        { value: "A2", label: "A2" },
    ]

    const unitTypeOptions = [
        { value: "Type B", label: "Type B" },
        { value: "Type C", label: "Type C" },
        { value: "Others", label: "Others / Not sure" },
    ]

    const unitsOwnedOptions = [
        { value: "1", label: "1" },
        { value: "2", label: "2" },
        { value: "3-or-more", label: "3 or more" },
    ]

    const rentalPlanOptions = [
        { id: "room-rental", label: "Room rental / Co-living" },
        { id: "whole-unit", label: "Whole unit rental" },
        { id: "airbnb", label: "Airbnb / short-term" },
        { id: "not-sure", label: "Not sure yet" },
        { id: "own-stay", label: "Might be for own stay" },
    ]

    const concernOptions = [
        { id: "stable-rental", label: "I want stable rental" },
        { id: "no-self-manage", label: "I don't want to self-manage" },
        { id: "not-sure-what-to-do", label: "I'm not sure what to do with the property" },
        { id: "maximize-appreciation", label: "I want to maximise long-term capital appreciation" },
        { id: "just-exploring", label: "I'm just exploring now" },
    ]

    const supportOptions = [
        { id: "belive-services", label: "I want to know more about BeLive's services" },
        { id: "renovation-quotation", label: "I want a renovation quotation" },
        { id: "feasibility-check", label: "I want a rental feasibility check on my unit" },
        { id: "rental-strategy", label: "I want to know more rental strategy available for Kayana Heights" },
        { id: "property-consultant", label: "I want to speak to a property consultant" },
    ]

    const contactMethods = [
        { value: "whatsapp", label: "WhatsApp" },
        { value: "call", label: "Phone Call" },
        { value: "email", label: "Email" },
    ]

    const timePreferences = [
        { value: "weekday-morning", label: "Weekday Morning" },
        { value: "weekday-afternoon", label: "Weekday Afternoon" },
        { value: "weekday-evening", label: "Weekday Evening" },
        { value: "weekend", label: "Weekend" },
    ]

    useEffect(() => {
        document.title = "Kayana Heights Owner Interest Form"
    }, [])

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        // Required fields
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required"
        
        // Malaysian mobile number validation
        if (!formData.mobileNumber.trim()) {
            newErrors.mobileNumber = "Mobile number is required"
        } else {
            // Remove all spaces and hyphens for validation
            const cleanMobile = formData.mobileNumber.replace(/[\s-]/g, "")
            // Malaysian mobile format: +601X-XXXX XXXX or 01X-XXXX XXXX
            // Supports: +601, +60, 601, 01 prefixes
            // Valid prefixes: 010, 011, 012, 013, 014, 015, 016, 017, 018, 019
            const malaysianMobileRegex = /^(\+?6?0?1)[0-46-9]\d{7,8}$/
            if (!malaysianMobileRegex.test(cleanMobile)) {
                newErrors.mobileNumber = "Please enter a valid Malaysian mobile number (e.g., 01X-XXXX XXXX or +601X-XXXX XXXX)"
            }
        }
        
        // Global email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required"
        } else {
            // Comprehensive email validation following RFC 5322 standard
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
            if (!emailRegex.test(formData.email.trim())) {
                newErrors.email = "Please enter a valid email address"
            }
        }
        if (!formData.tower) newErrors.tower = "Please select a tower"
        if (!formData.floor.trim()) newErrors.floor = "Floor is required"
        if (!formData.unitType) newErrors.unitType = "Please select unit type"
        if (!formData.unitsOwned) newErrors.unitsOwned = "Please select number of units owned"
        if (formData.rentalPlan.length === 0) newErrors.rentalPlan = "Please select at least one rental plan"
        if (formData.concerns.length === 0) newErrors.concerns = "Please select at least one concern"
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

    const handleMultiSelectChange = (
        field: "rentalPlan" | "concerns" | "supportNeeded",
        optionId: string,
    ) => {
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

                const response = await submitKayaHeigForm(formData)

                if (response?.success) {
                    setIsSubmitted(true)
                }
            } catch (error) {
                console.log(error)
                notify("error", "Failed to submit form. Please try again.")
            }
        } else {
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
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Thanks for your interest! 👋</h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Our consultant will reach out shortly to help you make the most of your Kayana Heights investment.
                    </p>
                    <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-red-50 border border-[#F9A533] rounded-xl">
                        <p className="text-sm text-gray-700 font-medium mb-2">Want to explore more about us?</p>
                        <a 
                            href="https://renoxpert.my" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#D71E42] font-semibold hover:underline"
                        >
                            👉 renoxpert.my
                        </a>
                    </div>
                    <button
                        onClick={() => {
                            setIsSubmitted(false)
                            setFormData({
                                fullName: "",
                                mobileNumber: "",
                                email: "",
                                tower: "",
                                floor: "",
                                unitType: "",
                                unitsOwned: "",
                                rentalPlan: [],
                                concerns: [],
                                supportNeeded: [],
                                preferredContact: "",
                                preferredTime: "",
                                additionalInfo: "",
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
                    <div className="flex items-center justify-center mb-6">
                        <img className="default-logo min-h-[22px] h-[110px] max-w-none" src="/app/BeLive_logo-01.svg"></img>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                        🏠 Kayana Heights Owner Interest Form
                    </h2>
                    <h3 className="text-2xl font-semibold bg-gradient-to-r from-[#D71E42] to-[#F9A533] bg-clip-text text-transparent mb-2">
                        Let's Explore Your Best Rental Strategy
                    </h3>
                    <p className="text-lg text-gray-600 mb-4">(Powered by BeLive Co-Living)</p>
                    <div className="max-w-3xl mx-auto text-gray-700 space-y-4 text-lg leading-relaxed">
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
                                        onChange={(e) => {
                                            // Auto-format Malaysian mobile number as user types
                                            let value = e.target.value.replace(/\D/g, '') // Remove non-digits
                                            
                                            // Format as 01X-XXXX XXXX
                                            if (value.length > 3 && value.length <= 7) {
                                                value = value.slice(0, 3) + '-' + value.slice(3)
                                            } else if (value.length > 7) {
                                                value = value.slice(0, 3) + '-' + value.slice(3, 7) + ' ' + value.slice(7, 11)
                                            }
                                            
                                            handleInputChange("mobileNumber", value)
                                        }}
                                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#D71E42] focus:border-[#D71E42] transition-all duration-200 ${errors.mobileNumber ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-[#F9A533]"
                                            }`}
                                        placeholder="01X-XXXX XXXX"
                                        maxLength={13}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Format: 01X-XXXX XXXX (e.g., 012-345 6789)
                                </p>
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
                                <p className="mt-1 text-xs text-gray-500">
                                    Enter a valid email address (e.g., john.doe@example.com)
                                </p>
                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">Which tower and floor is your unit? *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Tower:</label>
                                        <select
                                            value={formData.tower}
                                            onChange={(e) => handleInputChange("tower", e.target.value)}
                                            className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-[#D71E42] focus:border-[#D71E42] transition-all duration-200 ${errors.tower ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-[#F9A533]"
                                                }`}
                                        >
                                            <option value="">Select Tower</option>
                                            {towerOptions.map((tower) => (
                                                <option key={tower.value} value={tower.value}>
                                                    {tower.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Floor:</label>
                                        <input
                                            type="text"
                                            value={formData.floor}
                                            onChange={(e) => handleInputChange("floor", e.target.value)}
                                            className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-[#D71E42] focus:border-[#D71E42] transition-all duration-200 ${errors.floor ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-[#F9A533]"
                                                }`}
                                            placeholder="e.g., 15"
                                        />
                                    </div>
                                </div>
                                {(errors.tower || errors.floor) && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.tower || errors.floor}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">What's your unit type? *</label>
                                <div className="space-y-2">
                                    {unitTypeOptions.map((type) => (
                                        <label
                                            key={type.value}
                                            className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${formData.unitType === type.value
                                                ? "border-[#D71E42] bg-red-50 shadow-md"
                                                : "border-gray-200 hover:border-[#F9A533]"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="unitType"
                                                value={type.value}
                                                checked={formData.unitType === type.value}
                                                onChange={(e) => handleInputChange("unitType", e.target.value)}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center transition-colors ${formData.unitType === type.value ? "border-[#D71E42] bg-[#D71E42]" : "border-gray-300"
                                                    }`}
                                            >
                                                {formData.unitType === type.value && (
                                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.unitType && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.unitType}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-2">How many Kayana units do you own? *</label>
                                <div className="space-y-2">
                                    {unitsOwnedOptions.map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${formData.unitsOwned === option.value
                                                ? "border-[#D71E42] bg-red-50 shadow-md"
                                                : "border-gray-200 hover:border-[#F9A533]"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="unitsOwned"
                                                value={option.value}
                                                checked={formData.unitsOwned === option.value}
                                                onChange={(e) => handleInputChange("unitsOwned", e.target.value)}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center transition-colors ${formData.unitsOwned === option.value ? "border-[#D71E42] bg-[#D71E42]" : "border-gray-300"
                                                    }`}
                                            >
                                                {formData.unitsOwned === option.value && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.unitsOwned && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.unitsOwned}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Rental Goals & Investment Intent */}
                    <div className="bg-gradient-to-r from-[#F05A22] to-[#F9A533] px-8 py-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Step 2: Rental Goals & Investment Intent</h3>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-4">
                                What's your rental plan for this unit? *
                            </label>
                            <div className="space-y-3">
                                {rentalPlanOptions.map((plan) => (
                                    <label
                                        key={plan.id}
                                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${formData.rentalPlan.includes(plan.id)
                                            ? "border-[#D71E42] bg-red-50 shadow-md"
                                            : "border-gray-200 hover:border-[#F9A533]"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.rentalPlan.includes(plan.id)}
                                            onChange={() => handleMultiSelectChange("rentalPlan", plan.id)}
                                            className="sr-only"
                                        />
                                        <div
                                            className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors ${formData.rentalPlan.includes(plan.id) ? "border-[#D71E42] bg-[#D71E42]" : "border-gray-300"
                                                }`}
                                        >
                                            {formData.rentalPlan.includes(plan.id) && <CheckCircle className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium text-gray-900">{plan.label}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.rentalPlan && (
                                <p className="mt-3 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.rentalPlan}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-4">
                                What's your biggest concern or priority? (Select all that apply) *
                            </label>
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
                    </div>

                    {/* Step 3: How Can We Help You Today? */}
                    <div className="bg-gradient-to-r from-[#F9A533] to-[#D71E42] px-8 py-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Step 3: How Can We Help You Today?</h3>
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

                    {/* Step 4: Contact Preferences */}
                    <div className="bg-gradient-to-r from-[#D71E42] to-[#F05A22] px-8 py-6">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Step 4: Contact Preferences</h3>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-4">Preferred way to reach you: *</label>
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
                                Preferred time to contact you:
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

                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                (Optional) Anything else you'd like to share with us?
                            </label>
                            <textarea
                                value={formData.additionalInfo}
                                onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D71E42] focus:border-[#D71E42] transition-all duration-200 hover:border-[#F9A533]"
                                placeholder="Share any additional information or questions you have..."
                                rows={4}
                            />
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
                                        your property's best potential with BeLive Co-Living.
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

export default KayaHeigForm
