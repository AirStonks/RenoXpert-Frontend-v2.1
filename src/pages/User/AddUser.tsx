"use client"

import type React from "react"

import { useNavigate } from "react-router-dom"
import { Slide, toast } from "react-toastify"
import { useEffect, useState } from "react"
import ClipboardJS from "clipboard"
import type { User } from "../../types"
import { addUser } from "../../services/api"
import {
    ArrowLeft,
    Save,
    UserIcon,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    UserPlus,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    ChevronDown,
    Building,
    Wrench,
    Home,
} from "lucide-react"

const LOCAL_PATH_PREFIX = window.location.hostname === "localhost" ? "/staff/" : "/"

const MEDIA_URL = import.meta.env.VITE_APP_ENV === "local" ? "/public/media/" : "/media/"

interface ValidationErrors {
    name_first?: string[]
    name_last?: string[]
    email?: string[]
    phone?: string[]
    salutations?: string[]
    name_preferred?: string[]
    ic?: string[]
    address_1?: string[]
    address_2?: string[]
    city?: string[]
    state?: string[]
    "address.postcode"?: string[]
    "address.city"?: string[]
    "address.state"?: string[]
    [key: string]: string[] | undefined
}

const roles = [
    {
        value: "owner",
        label: "Owner",
        description: "Create an owner account with full property access",
        icon: Home,
        color: "text-blue-600",
        bg: "bg-blue-100",
        border: "border-blue-200",
    },
    {
        value: "vendor",
        label: "Vendor",
        description: "Create a vendor account for service providers",
        icon: Building,
        color: "text-green-600",
        bg: "bg-green-100",
        border: "border-green-200",
    },
    {
        value: "technician",
        label: "Technician",
        description: "Create a technician account for maintenance staff",
        icon: Wrench,
        color: "text-orange-600",
        bg: "bg-orange-100",
        border: "border-orange-200",
    },
]

const salutationOptions = [
    { value: "mr", label: "Mr" },
    { value: "ms", label: "Ms" },
    { value: "mrs", label: "Mrs" },
    { value: "doctor", label: "Doctor" },
    { value: "datuk", label: "Datuk" },
    { value: "dato", label: "Dato" },
    { value: "datin", label: "Datin" },
    { value: "datuk_seri", label: "Datuk Seri" },
    { value: "dato_seri", label: "Dato Seri" },
    { value: "datin_seri", label: "Datin Seri" },
]

const countryOptions = [
    { code: "60", name: "Malaysia", flag: MEDIA_URL + "flags/malaysia.svg" },
    { code: "65", name: "Singapore", flag: MEDIA_URL + "flags/singapore.svg" },
]

function AddUser() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        email: "",
        type: "",
        country_code: "60",
        phone: "",
        name_first: "",
        name_last: "",
        name_preferred: "",
        salutations: "mr",
        ic: "",
        address: {
            address_1: "",
            address_2: "",
            city: "",
            state: "",
            postcode: "",
        },
    })
    const [isLoading, setIsLoading] = useState(false)
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
    const [success, setSuccess] = useState(false)

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

    const handleBackClick = () => {
        navigate(LOCAL_PATH_PREFIX + "users")
    }

    useEffect(() => {
        document.title = "Add User | RenoXpert"

        const clipboard = new ClipboardJS(".copy-link")

        clipboard.on("success", (e) => {
            notify("success", "Copied to clipboard!")
            e.clearSelection()
        })

        return () => {
            clipboard.destroy()
        }
    }, [])

    const formatICNumber = (value: string): string => {
        const digits = value.replace(/\D/g, "")
        const truncated = digits.slice(0, 12)

        let formatted = ""
        if (truncated.length > 0) {
            formatted += truncated.slice(0, 6)

            if (truncated.length > 6) {
                formatted += "-" + truncated.slice(6, 8)

                if (truncated.length > 8) {
                    formatted += "-" + truncated.slice(8)
                }
            }
        }

        return formatted
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        if (name.startsWith("address.")) {
            const key = name.split(".")[1]

            setFormData((prevData) => ({
                ...prevData,
                address: {
                    ...prevData.address,
                    [key]: value,
                },
            }))
        } else if (name === "ic") {
            const formattedIC = formatICNumber(value)
            setFormData((prevData) => ({
                ...prevData,
                ic: formattedIC,
            }))

            setValidationErrors((prevErrors) => ({
                ...prevErrors,
                ic: undefined,
            }))

            return
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }))
        }
    }

    const handleChangeCountryCode = (countryCode: string) => {
        setFormData((prevData) => ({
            ...prevData,
            country_code: countryCode,
        }))
    }

    const handleReset = () => {
        setFormData({
            email: "",
            type: "",
            country_code: "60",
            phone: "",
            name_first: "",
            name_last: "",
            name_preferred: "",
            salutations: "mr",
            ic: "",
            address: {
                address_1: "",
                address_2: "",
                city: "",
                state: "",
                postcode: "",
            },
        })
        setValidationErrors({})
    }

    const handleSubmit = async () => {
        if (!formData.name_first || !formData.name_last || !formData.email || !formData.phone) {
            notify("error", "Please fill in all fields.")
            return
        }

        setIsLoading(true)
        setValidationErrors({})
        try {
            let userData: User

            if (formData.type === "owner") {
                userData = {
                    name_first: formData.name_first,
                    name_last: formData.name_last,
                    name_preferred: formData.name_preferred,
                    salutations: formData.salutations,
                    ic: formData.ic,
                    email: formData.email,
                    type: formData.type,
                    country_code: formData.country_code,
                    phone_no: formData.phone,
                    address: {
                        address_1: formData.address.address_1,
                        address_2: formData.address.address_2,
                        city: formData.address.city,
                        state: formData.address.state,
                        postcode: formData.address.postcode,
                    },
                }
            } else {
                userData = {
                    name_first: formData.name_first,
                    name_last: formData.name_last,
                    email: formData.email,
                    country_code: formData.country_code,
                    type: formData.type,
                    phone_no: formData.phone,
                }
            }

            const response = await addUser(userData)

            if (response?.success) {
                notify("success", "User Created Successfully!")

                if (formData.type === "owner") {
                    setIsLoading(false)
                    navigate(LOCAL_PATH_PREFIX + "users/" + response.data.id)
                    return
                } else {
                    setFormData({
                        ...formData,
                        email: response.data[0].email,
                    })

                    notify("success", "User Created Successfully!")
                    setSuccess(true)
                }
            } else {
                notify("error", response.data.message)
                setValidationErrors(response?.data?.data)
            }
        } catch (error: any) {
            console.log(error.response?.data?.data);
            setValidationErrors(error.response?.data?.data)
            notify("error", error.response?.data?.message)
        } finally {
            setIsLoading(false)
            console.log(validationErrors);

        }
    }

    const renderSuccessView = () => (
        <div className="px-4 py-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Created Successfully</h2>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3 text-green-700">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">
                            An email has been sent to the associated email address. Please ask the user to check their email.
                        </span>
                    </div>
                </div>

                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleBackClick}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Users
                    </button>
                    <button
                        onClick={() => {
                            setSuccess(false)
                            handleReset()
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Another User
                    </button>
                </div>
            </div>
        </div>
    )

    const renderForm = () => (
        <div className="px-4 py-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-2">
                    <UserIcon className="w-6 h-6" />
                    User Details
                </h2>

                <div className="space-y-8">
                    {/* Basic Information */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Basic Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                <input
                                    type="text"
                                    name="name_first"
                                    value={formData.name_first}
                                    onChange={handleChange}
                                    placeholder="John"
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                {validationErrors.name_first && (
                                    validationErrors.name_first.map((error, index) => (
                                        <span key={index} className="text-red-500 text-xs mt-1 block">{error}</span>
                                    ))
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    name="name_last"
                                    value={formData.name_last}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                {validationErrors.name_last && (
                                    validationErrors.name_last.map((error, index) => (
                                        <span key={index} className="text-red-500 text-xs mt-1 block">{error}</span>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Owner-specific fields */}
                        {formData.type === "owner" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Salutations</label>
                                        <select
                                            name="salutations"
                                            value={formData.salutations}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        >
                                            <option value="">Please Select</option>
                                            {salutationOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {validationErrors.salutations && (
                                            validationErrors.salutations.map((error, index) => (
                                                <span key={index} className="text-red-500 text-xs mt-1 block">{error}</span>
                                            ))
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Name</label>
                                        <input
                                            type="text"
                                            name="name_preferred"
                                            value={formData.name_preferred}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        />
                                        {validationErrors.name_preferred && (
                                            validationErrors.name_preferred.map((error, index) => (
                                                <span key={index} className="text-red-500 text-xs mt-1 block">{error}</span>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Contact Information */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="user@example.com"
                                    className="w-full pl-10 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            {validationErrors.email && (
                                validationErrors.email.map((error, index) => (
                                    <span key={index} className="text-red-500 text-xs mt-1 block">{error}</span>
                                ))
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <select
                                        value={formData.country_code}
                                        onChange={(e) => handleChangeCountryCode(e.target.value)}
                                        className="appearance-none px-4 py-3 pr-8 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    >
                                        {countryOptions.map((country) => (
                                            <option key={country.code} value={country.code}>
                                                +{country.code}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                <div className="relative flex-1">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="123456789"
                                        className="w-full pl-10 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                            </div>
                            {validationErrors.phone && (
                                validationErrors.phone.map((error, index) => (
                                    <span key={index} className="text-red-500 text-xs mt-1 block">{error}</span>
                                ))
                            )}
                        </div>

                        {/* Owner IC Number */}
                        {formData.type === "owner" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">IC Number</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="ic"
                                        value={formData.ic}
                                        onChange={handleChange}
                                        placeholder="xxxxxx-xx-xxxx"
                                        className="w-full pl-10 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                                {validationErrors.ic && (
                                    validationErrors.ic.map((error, index) => (
                                        <span key={index} className="text-red-500 text-xs mt-1 block">{error}</span>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Address Information for Owners */}
                    {formData.type === "owner" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Owner Current Residence Address
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        name="address.address_1"
                                        value={formData.address.address_1}
                                        onChange={handleChange}
                                        placeholder="Address Line 1"
                                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                    <span className="text-xs text-gray-500 mt-1 block">Address Line 1</span>
                                    {validationErrors['address.address_1'] && (
                                        validationErrors['address.address_1'].map((error, index) => (
                                            <span key={index} className="text-red-500 text-xs mt-1 block">{error}</span>
                                        ))
                                    )}
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        name="address.address_2"
                                        value={formData.address.address_2}
                                        onChange={handleChange}
                                        placeholder="Address Line 2 (optional)"
                                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                    <span className="text-xs text-gray-500 mt-1 block">Address Line 2 (optional)</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <input
                                            type="text"
                                            name="address.city"
                                            value={formData.address.city}
                                            onChange={handleChange}
                                            placeholder="City"
                                            className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        />
                                        <span className="text-xs text-gray-500 mt-1 block">City</span>
                                        {validationErrors['address.city'] && (
                                            validationErrors['address.city'].map((error, index) => (
                                                <span key={index} className="text-red-500 text-xs mt-1 block">{error}</span>
                                            ))
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            name="address.state"
                                            value={formData.address.state}
                                            onChange={handleChange}
                                            placeholder="State / Province"
                                            className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        />
                                        <span className="text-xs text-gray-500 mt-1 block">State / Province</span>
                                        {validationErrors['address.state'] && (
                                            validationErrors['address.state'].map((error, index) => (
                                                <span key={index} className="text-red-500 text-xs mt-1 block">{error}</span>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        name="address.postcode"
                                        value={formData.address.postcode}
                                        onChange={handleChange}
                                        placeholder="Postal / Zip Code"
                                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                    <span className="text-xs text-gray-500 mt-1 block">Postal / Zip Code</span>
                                    {validationErrors['address.postcode'] && (
                                        validationErrors['address.postcode'].map((error, index) => (
                                            <span key={index} className="text-red-500 text-xs mt-1 block">{error}</span>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User Role Selection */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">User Type/Role</h3>
                        <div className="space-y-3">
                            {roles.map((role) => {
                                const IconComponent = role.icon
                                return (
                                    <label
                                        key={role.value}
                                        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.type === role.value
                                            ? `${role.border} ${role.bg}`
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={role.value}
                                            checked={formData.type === role.value}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <div className={`w-10 h-10 ${role.bg} rounded-xl flex items-center justify-center`}>
                                            <IconComponent className={`w-5 h-5 ${role.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{role.label}</div>
                                            <div className="text-sm text-gray-500">{role.description}</div>
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {isLoading ? "Creating..." : "Create User"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
                <div className="px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                            onClick={handleBackClick}
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Add User</h1>
                            <p className="text-sm text-gray-600">Create a new user account</p>
                        </div>
                    </div>
                </div>
            </div>

            {success ? renderSuccessView() : renderForm()}
        </div>
    )
}

export default AddUser
