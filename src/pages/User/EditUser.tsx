"use client"

import type React from "react"

import { useNavigate, useParams } from "react-router-dom"
import { Slide, toast } from "react-toastify"
import { useEffect, useState } from "react"
import type { User } from "../../types"
// import { updateUser } from "../../services/api"
import useFetchUser from "../../hook/useFetchUser"
import Loading from "../../components/Loading"
import {
    ArrowLeft,
    Save,
    UserIcon,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    ChevronDown,
    Building,
    Wrench,
    Home,
    Lock,
    Edit3,
} from "lucide-react"
import { updateUser } from "../../services/api"

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
    postcode?: string[]
    "address.city"?: string[]
    "address.state"?: string[]
    [key: string]: string[] | undefined
}

const roles = [
    {
        value: "owner",
        label: "Owner",
        description: "Property owner with full access",
        icon: Home,
        color: "text-blue-600",
        bg: "bg-blue-100",
        border: "border-blue-200",
    },
    {
        value: "vendor",
        label: "Vendor",
        description: "Service provider account",
        icon: Building,
        color: "text-green-600",
        bg: "bg-green-100",
        border: "border-green-200",
    },
    {
        value: "technician",
        label: "Technician",
        description: "Maintenance staff account",
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

function EditUser() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const userId = id ? Number.parseInt(id, 10) : null

    const { userDetail, loading: fetchLoading, error: fetchError } = useFetchUser(userId)

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

    const [originalData, setOriginalData] = useState(formData)
    const [isLoading, setIsLoading] = useState(false)
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
    const [success, setSuccess] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

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
        navigate(LOCAL_PATH_PREFIX + "users/" + userId)
    }

    useEffect(() => {
        document.title = "Edit User | RenoXpert"
    }, [])

    // Populate form data when user details are loaded
    useEffect(() => {
        if (userDetail) {
            const newFormData = {
                email: userDetail.email || "",
                type: userDetail.type || "",
                country_code: userDetail.country_code || "60",
                phone: userDetail.phone_no || "",
                name_first: userDetail.name_first || "",
                name_last: userDetail.name_last || "",
                name_preferred: userDetail.name_preferred || "",
                salutations: userDetail.salutations || "mr",
                ic: userDetail.ic || "",
                address: {
                    address_1: userDetail.address?.address_1 || "",
                    address_2: userDetail.address?.address_2 || "",
                    city: userDetail.address?.city || "",
                    state: userDetail.address?.state || "",
                    postcode: userDetail.address?.postcode || "",
                },
            }
            setFormData(newFormData)
            setOriginalData(newFormData)
        }
    }, [userDetail])

    // Check for changes
    useEffect(() => {
        const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(originalData)
        setHasChanges(hasFormChanges)
    }, [formData, originalData])

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
        setFormData(originalData)
        setValidationErrors({})
        setHasChanges(false)
    }

    const handleSubmit = async () => {
        console.log(formData);

        if (!formData.name_first || !formData.name_last || !formData.email || !formData.phone) {
            notify("error", "Please fill in all required fields.")
            return
        }

        setIsLoading(true)
        setValidationErrors({})
        try {
            let userData: Partial<User>

            if (formData.type === "owner") {
                userData = {
                    name_first: formData.name_first,
                    name_last: formData.name_last,
                    name_preferred: formData.name_preferred,
                    salutations: formData.salutations,
                    ic: formData.ic,
                    email: formData.email,
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
                    phone_no: formData.phone,
                }
            }

            const response = await updateUser(userId, userData)

            if (response?.success) {
                notify("success", "User updated successfully!")
                setSuccess(true)
                setOriginalData(formData)
                setHasChanges(false)

                // Navigate back to user detail after a short delay
                setTimeout(() => {
                    navigate(LOCAL_PATH_PREFIX + "users/" + userId)
                }, 2000)
            } else {
                console.log(response.data)
                setValidationErrors(response.data)
            }
        } catch (error: any) {
            setValidationErrors(error.response?.data?.data || {})
            notify("error", "Failed to update user. Please try again.")
        }

        setIsLoading(false)
    }

    // Determine if field should be editable
    const isFieldEditable = (fieldName: string) => {
        // Owner type users have all fields editable
        if (formData.type === "owner") {
            return true
        }

        // For non-owner types, restrict certain fields
        const restrictedFields = ["type", "ic", "salutations", "name_preferred"]
        if (restrictedFields.includes(fieldName)) {
            return false
        }

        // Address fields are only editable for owners
        if (fieldName.startsWith("address")) {
            return false
        }

        return true
    }

    const renderSuccessView = () => (
        <div className="px-4 py-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">User Updated Successfully</h2>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3 text-green-700">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">
                            User information has been updated successfully. Redirecting to user details...
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )

    if (fetchLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                <Loading />
            </div>
        )
    }

    if (fetchError || !userDetail) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">User Not Found</h2>
                    <p className="text-gray-600 mb-6">The user you're trying to edit could not be found.</p>
                    <button
                        onClick={() => navigate(LOCAL_PATH_PREFIX + "users")}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 mx-auto"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Users
                    </button>
                </div>
            </div>
        )
    }

    const renderForm = () => (
        <div className="px-4 py-6 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Edit3 className="w-6 h-6" />
                        Edit User Details
                    </h2>
                    {hasChanges && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Unsaved changes
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    {/* User Type Display */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">Current User Type</div>
                                <div className="text-sm text-gray-600 capitalize">{formData.type}</div>
                            </div>
                            <div className="ml-auto">
                                <Lock className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    </div>

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
                                    disabled={!isFieldEditable("name_first")}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("name_first") ? "bg-white/70" : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                        }`}
                                />
                                {validationErrors.name_first && (
                                    <span className="text-red-500 text-sm mt-1 block">{validationErrors.name_first.join(", ")}</span>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    name="name_last"
                                    value={formData.name_last}
                                    onChange={handleChange}
                                    disabled={!isFieldEditable("name_last")}
                                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("name_last") ? "bg-white/70" : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                        }`}
                                />
                                {validationErrors.name_last && (
                                    <span className="text-red-500 text-sm mt-1 block">{validationErrors.name_last.join(", ")}</span>
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
                                            disabled={!isFieldEditable("salutations")}
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("salutations") ? "bg-white/70" : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                                }`}
                                        >
                                            <option value="">Please Select</option>
                                            {salutationOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {validationErrors.salutations && (
                                            <span className="text-red-500 text-sm mt-1 block">{validationErrors.salutations.join(", ")}</span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Name</label>
                                        <input
                                            type="text"
                                            name="name_preferred"
                                            value={formData.name_preferred}
                                            onChange={handleChange}
                                            disabled={!isFieldEditable("name_preferred")}
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("name_preferred")
                                                ? "bg-white/70"
                                                : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                                }`}
                                        />
                                        {validationErrors.name_preferred && (
                                            <span className="text-red-500 text-sm mt-1 block">
                                                {validationErrors.name_preferred.join(", ")}
                                            </span>
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
                                    disabled={!isFieldEditable("email")}
                                    className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("email") ? "bg-white/70" : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                        }`}
                                />
                            </div>
                            {validationErrors.email && (
                                <span className="text-red-500 text-sm mt-1 block">{validationErrors.email.join(", ")}</span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <select
                                        value={formData.country_code}
                                        onChange={(e) => handleChangeCountryCode(e.target.value)}
                                        disabled={!isFieldEditable("phone")}
                                        className={`appearance-none px-4 py-3 pr-8 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("phone") ? "bg-white/70" : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                            }`}
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
                                        disabled={!isFieldEditable("phone")}
                                        className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("phone") ? "bg-white/70" : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                            }`}
                                    />
                                </div>
                            </div>
                            {validationErrors.phone && (
                                <span className="text-red-500 text-sm mt-1 block">{validationErrors.phone.join(", ")}</span>
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
                                        disabled={!isFieldEditable("ic")}
                                        className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("ic") ? "bg-white/70" : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                            }`}
                                    />
                                </div>
                                {validationErrors.ic && (
                                    <span className="text-red-500 text-sm mt-1 block">{validationErrors.ic.join(", ")}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Address Information for Owners */}
                    {formData.type === "owner" && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Current Residence Address
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        name="address.address_1"
                                        value={formData.address.address_1}
                                        onChange={handleChange}
                                        disabled={!isFieldEditable("address.address_1")}
                                        placeholder="Address Line 1"
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("address.address_1")
                                            ? "bg-white/70"
                                            : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                            }`}
                                    />
                                    <span className="text-xs text-gray-500 mt-1 block">Address Line 1</span>
                                    {validationErrors.address_1 && (
                                        <span className="text-red-500 text-xs mt-1 block">{validationErrors.address_1}</span>
                                    )}
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        name="address.address_2"
                                        value={formData.address.address_2}
                                        onChange={handleChange}
                                        disabled={!isFieldEditable("address.address_2")}
                                        placeholder="Address Line 2 (optional)"
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("address.address_2")
                                            ? "bg-white/70"
                                            : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                            }`}
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
                                            disabled={!isFieldEditable("address.city")}
                                            placeholder="City"
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("address.city") ? "bg-white/70" : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                                }`}
                                        />
                                        <span className="text-xs text-gray-500 mt-1 block">City</span>
                                        {validationErrors["address.city"] && (
                                            <span className="text-red-500 text-xs mt-1 block">{validationErrors["address.city"]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            name="address.state"
                                            value={formData.address.state}
                                            onChange={handleChange}
                                            disabled={!isFieldEditable("address.state")}
                                            placeholder="State / Province"
                                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("address.state")
                                                ? "bg-white/70"
                                                : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                                }`}
                                        />
                                        <span className="text-xs text-gray-500 mt-1 block">State / Province</span>
                                        {validationErrors["address.state"] && (
                                            <span className="text-red-500 text-xs mt-1 block">{validationErrors["address.state"]}</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        name="address.postcode"
                                        value={formData.address.postcode}
                                        onChange={handleChange}
                                        disabled={!isFieldEditable("address.postcode")}
                                        placeholder="Postal / Zip Code"
                                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${isFieldEditable("address.postcode")
                                            ? "bg-white/70"
                                            : "bg-gray-100 text-gray-500 cursor-not-allowed"
                                            }`}
                                    />
                                    <span className="text-xs text-gray-500 mt-1 block">Postal / Zip Code</span>
                                    {validationErrors.postcode && (
                                        <span className="text-red-500 text-xs mt-1 block">{validationErrors.postcode}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Restricted Fields Notice */}
                    {formData.type !== "owner" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-center gap-3 text-amber-700">
                                <Lock className="w-5 h-5" />
                                <div>
                                    <div className="font-medium">Limited Edit Access</div>
                                    <div className="text-sm">
                                        Some fields are restricted for this user type. Contact an administrator for additional changes.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6">
                        <button
                            onClick={handleReset}
                            disabled={!hasChanges}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset Changes
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !hasChanges}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {isLoading ? "Updating..." : "Update User"}
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
                            <h1 className="text-xl font-bold text-gray-900">Edit User</h1>
                            <p className="text-sm text-gray-600">Modify user information for {userDetail?.name || "Unknown User"}</p>
                        </div>
                    </div>
                </div>
            </div>

            {success ? renderSuccessView() : renderForm()}
        </div>
    )
}

export default EditUser
