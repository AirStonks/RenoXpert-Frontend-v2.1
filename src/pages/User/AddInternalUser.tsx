"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { User } from "../../types"
import { addUser } from "../../services/api"
import { Slide, toast } from "react-toastify"
import ClipboardJS from "clipboard"
import { useUser } from "../../context/UserContext"
import { ArrowLeft, Save, UserIcon, Mail, Phone, Shield, UserPlus, Copy, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

const LOCAL_PATH_PREFIX = window.location.hostname === "localhost" ? "/staff/" : "/"

// Define type for validation errors
interface ValidationErrors {
    name_first?: string[]
    name_last?: string[]
    email?: string[]
    phone?: string[]
    [key: string]: string[] | undefined
}

function AddInternalUser() {
    const navigate = useNavigate()
    const { currentUser, loading, error } = useUser()

    const [formData, setFormData] = useState({
        name_first: "",
        name_last: "",
        email: "",
        type: "staff",
        phone: "",
    })

    const [newPassword, setNewPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

    const notify = (type: "success" | "error", message: string) => {
        ; (toast[type] as (message: string, options?: object) => void)(message, {
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
        document.title = "Add Internal User | RenoXpert"

        const clipboard = new ClipboardJS(".copy-link")

        clipboard.on("success", (e) => {
            notify("success", "Copied to clipboard!")
            e.clearSelection()
        })

        return () => {
            clipboard.destroy()
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }))
    }

    const handleReset = () => {
        setFormData({
            name_first: "",
            name_last: "",
            email: "",
            type: "staff",
            phone: "",
        })
        setNewPassword("")
        setValidationErrors({})
    }

    const handleSubmit = async () => {
        if (!formData.name_first || !formData.name_last || !formData.email || !formData.phone) {
            notify("error", "Please fill in all fields.")
            return
        }

        setIsLoading(true)
        setValidationErrors({}) // Reset previous errors
        try {
            const userData: User = {
                name_first: formData.name_first,
                name_last: formData.name_last,
                email: formData.email.trim() + "@belive.asia",
                type: formData.type,
                phone_no: formData.phone,
                country_code: "60",
            }

            const response = await addUser(userData)

            if (response?.success) {
                setNewPassword(response.data.new_password)
                setFormData({
                    ...formData,
                    email: response.data[0].email,
                })
                notify("success", "User Created Successfully!")
            } else {
                console.log(response.data)
                setValidationErrors(response.data)
            }
        } catch (error: any) {
            setValidationErrors(error.response?.data?.data || {})
        } finally {
            setIsLoading(false)
        }
    }

    const getRoleInfo = (role: string) => {
        switch (role) {
            case "staff":
                return { icon: UserIcon, color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-200" }
            case "admin":
                return { icon: Shield, color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200" }
            case "super-admin":
                return { icon: Shield, color: "text-purple-600", bg: "bg-purple-100", border: "border-purple-200" }
            default:
                return { icon: UserIcon, color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" }
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
                            setNewPassword("")
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

                <div className="space-y-6">
                    {/* Name Fields */}
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
                                placeholder="Doe"
                                className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                            {validationErrors.name_last && (
                                <span className="text-red-500 text-sm mt-1 block">{validationErrors.name_last.join(", ")}</span>
                            )}
                        </div>
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="username"
                                    className="w-full pl-10 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>
                            <div className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl font-medium">@belive.asia</div>
                        </div>
                        {validationErrors.email && (
                            <span className="text-red-500 text-sm mt-1 block">{validationErrors.email.join(", ")}</span>
                        )}
                    </div>

                    {/* Phone Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <div className="flex items-center gap-2">
                            <div className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">+60</div>
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
                            <span className="text-red-500 text-sm mt-1 block">{validationErrors.phone.join(", ")}</span>
                        )}
                    </div>

                    {/* User Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">User Type/Role</label>
                        <div className="space-y-3">
                            {["staff", "admin", "super-admin"].map((role) => {
                                const roleInfo = getRoleInfo(role)
                                const IconComponent = roleInfo.icon
                                const isDisabled =
                                    (currentUser?.type === "super-admin" && role === "super-admin") ||
                                    (currentUser?.type === "admin" && (role === "super-admin" || role === "admin")) ||
                                    currentUser?.type === "staff"

                                return (
                                    <label
                                        key={role}
                                        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.type === role
                                                ? `${roleInfo.border} ${roleInfo.bg}`
                                                : "border-gray-200 hover:border-gray-300"
                                            } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={role}
                                            checked={formData.type === role}
                                            onChange={handleChange}
                                            disabled={isDisabled}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <div className={`w-10 h-10 ${roleInfo.bg} rounded-xl flex items-center justify-center`}>
                                            <IconComponent className={`w-5 h-5 ${roleInfo.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {role.charAt(0).toUpperCase() + role.slice(1).replace("-", " ")}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {role === "staff" && "Basic access to system features"}
                                                {role === "admin" && "Advanced access with management capabilities"}
                                                {role === "super-admin" && "Full system access and control"}
                                            </div>
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
                            <h1 className="text-xl font-bold text-gray-900">Add Internal User</h1>
                            <p className="text-sm text-gray-600">Create a new internal staff account</p>
                        </div>
                    </div>
                </div>
            </div>

            {newPassword ? renderSuccessView() : renderForm()}
        </div>
    )
}

export default AddInternalUser
