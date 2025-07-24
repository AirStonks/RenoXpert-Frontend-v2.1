"use client"
import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import useFetchUser from "../../hook/useFetchUser"
import Loading from "../../components/Loading"
import { Link } from "react-router-dom"
import ClipboardJS from "clipboard"
import { resetUserPassword } from "../../services/api"
import { Slide, toast } from "react-toastify"
import {
    ArrowLeft,
    User,
    Shield,
    Key,
    Edit3,
    Copy,
    Phone,
    Mail,
    UserCheck,
    Settings,
    Eye,
    Lock,
    RefreshCw,
    CreditCard,
    MapPin,
} from "lucide-react"

const LOCAL_PATH_PREFIX = window.location.hostname === "localhost" ? "/staff/" : "/"

function UserDetail() {
    const navigate = useNavigate()
    const { state } = useLocation()
    const { id } = useParams<{ id: string }>()
    const userId = id ? Number.parseInt(id, 10) : null

    const { userDetail, loading, error } = useFetchUser(userId)

    const [newPassword, setNewPassword] = useState("")
    const [isResetting, setIsResetting] = useState(false)

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl)
        } else {
            navigate(LOCAL_PATH_PREFIX + "users")
        }
    }

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

    useEffect(() => {
        document.title = "User Detail | RenoXpert"
    }, [])

    const handleResetPassword = async () => {
        setIsResetting(true)
        try {
            const response = await resetUserPassword(userId)

            if (response?.success) {
                setNewPassword(response.data.new_password)
                notify("success", "Password reset successfully!")

                const clipboard = new ClipboardJS(".copy-link")

                clipboard.on("success", (e) => {
                    notify("success", "Copied to clipboard!")
                    e.clearSelection()
                })

                return () => {
                    clipboard.destroy()
                }
            }
        } catch (error) {
            console.error(error)
            notify("error", "Failed to reset password")
        } finally {
            setIsResetting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "bg-emerald-100 text-emerald-700 border-emerald-200"
            case "deactivated":
                return "bg-red-100 text-red-700 border-red-200"
            case "pending":
                return "bg-amber-100 text-amber-700 border-amber-200"
            default:
                return "bg-gray-100 text-gray-700 border-gray-200"
        }
    }

    const getUserTypeBadge = (type: string) => {
        switch (type?.toLowerCase()) {
            case "super-admin":
                return "bg-purple-100 text-purple-700 border-purple-200"
            case "admin":
                return "bg-blue-100 text-blue-700 border-blue-200"
            case "staff":
                return "bg-orange-100 text-orange-200 border-orange-200"
            default:
                return "bg-gray-100 text-gray-700 border-gray-200"
        }
    }

    const isFieldVisible = (fieldName: string, userType: string) => {
        // Owner type users can see all fields
        if (userType === "owner") {
            return true
        }

        // For vendor and technician types, hide owner-specific fields
        const ownerOnlyFields = ["salutations", "name_preferred", "ic", "address"]
        if (ownerOnlyFields.some((field) => fieldName.includes(field))) {
            return false
        }

        return true
    }

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-gray-600">Loading...</div>
            </div>
        )

    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg text-red-600">Error: {error}</div>
            </div>
        )

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Loading Overlay */}
            {loading && <Loading />}

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
                            <h1 className="text-xl font-bold text-gray-900">User Detail</h1>
                            <p className="text-sm text-gray-600">View and manage user information</p>
                        </div>
                    </div>

                    {userDetail && userDetail.status !== "deactivated" && (
                        <div className="flex gap-3">
                            <Link
                                to={`${LOCAL_PATH_PREFIX}users/edit/${userId}`}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                            >
                                <Edit3 className="w-4 h-4" />
                                Update Information
                            </Link>
                            <button
                                data-modal-toggle="#reset_password_modal"
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                            >
                                <Key className="w-4 h-4" />
                                Reset Password
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {userDetail && (
                <div className="px-4 py-6 max-w-7xl mx-auto">
                    <div className="flex gap-6 flex-wrap lg:flex-nowrap">
                        {/* Left Section - User Information */}
                        <div className="flex-[2] space-y-6">
                            {/* User Avatar & Basic Info */}
                            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                                        <User className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{userDetail.name}</h2>
                                        <div className="flex items-center gap-3 mb-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(userDetail.status)}`}
                                            >
                                                {userDetail.status.charAt(0).toUpperCase() + userDetail.status.slice(1)}
                                            </span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium border ${getUserTypeBadge(userDetail.type)}`}
                                            >
                                                {userDetail.type.charAt(0).toUpperCase() + userDetail.type.slice(1)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                {userDetail.email}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" />+{userDetail.country_code} {userDetail.phone_no}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* General Information */}
                            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <UserCheck className="w-5 h-5" />
                                    General Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                            <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                {userDetail.name}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                            <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                {userDetail.name_first}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                            <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                {userDetail.name_last}
                                            </div>
                                        </div>
                                        {isFieldVisible("name_preferred", userDetail.type) && userDetail.name_preferred && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Name</label>
                                                <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                    {userDetail.name_preferred}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                            <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                {userDetail.email}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                            <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                +{userDetail.country_code} {userDetail.phone_no}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                                            <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(userDetail.status)}`}
                                                >
                                                    {userDetail.status.charAt(0).toUpperCase() + userDetail.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        {isFieldVisible("salutations", userDetail.type) && userDetail.salutations && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Salutations</label>
                                                <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900 capitalize">
                                                    {userDetail.salutations.replace("_", " ")}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Owner-Specific Information */}
                            {isFieldVisible("ic", userDetail.type) && (
                                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Owner Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {userDetail.ic && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">IC Number</label>
                                                <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                    {userDetail.ic}
                                                </div>
                                            </div>
                                        )}
                                        {/* <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Property Access</label>
                                            <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl">
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                                    Full Access
                                                </span>
                                            </div>
                                        </div> */}
                                    </div>
                                </div>
                            )}

                            {/* Address Information for Owners */}
                            {isFieldVisible("address", userDetail.type) && userDetail.address && (
                                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Residence Address
                                    </h3>
                                    <div className="space-y-4">
                                        {userDetail.address.address_1 && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1</label>
                                                <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                    {userDetail.address.address_1}
                                                </div>
                                            </div>
                                        )}
                                        {userDetail.address.address_2 && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                                                <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                    {userDetail.address.address_2}
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {userDetail.address.city && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                                    <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                        {userDetail.address.city}
                                                    </div>
                                                </div>
                                            )}
                                            {userDetail.address.state && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                                    <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                        {userDetail.address.state}
                                                    </div>
                                                </div>
                                            )}
                                            {userDetail.address.postcode && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
                                                    <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-900">
                                                        {userDetail.address.postcode}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Additional Information */}
                            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Additional Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                                        <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl">
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium border ${getUserTypeBadge(userDetail.type)}`}
                                            >
                                                {userDetail.type.charAt(0).toUpperCase() + userDetail.type.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                                        <div className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl text-gray-500">
                                            Not assigned
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Section - User Abilities & Actions */}
                        <div className="flex-1 space-y-6">
                            {/* User Ability Overview */}
                            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    User Ability Overview
                                </h3>

                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Eye className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <h4 className="font-medium text-gray-900">View Permissions</h4>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {userDetail.type === "owner"
                                                ? "Full access to property information and management features"
                                                : userDetail.type === "vendor"
                                                    ? "Access to assigned projects and service-related information"
                                                    : "Access to maintenance tasks and technical documentation"}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <Edit3 className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <h4 className="font-medium text-gray-900">Edit Permissions</h4>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {userDetail.type === "owner"
                                                ? "Can modify property details, manage users, and update settings"
                                                : userDetail.type === "vendor"
                                                    ? "Can update service status, submit reports, and manage assigned tasks"
                                                    : "Can update maintenance records and technical reports"}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                                <Lock className="w-4 h-4 text-amber-600" />
                                            </div>
                                            <h4 className="font-medium text-gray-900">Security Access</h4>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {userDetail.type === "owner"
                                                ? "Full administrative access with property ownership rights"
                                                : userDetail.type === "vendor"
                                                    ? "Limited access to vendor portal and assigned project areas"
                                                    : "Restricted access to technical systems and maintenance areas"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Quick Actions
                                </h3>

                                <div className="space-y-3">
                                    <Link
                                        to={`${LOCAL_PATH_PREFIX}users/edit/${userId}`}
                                        className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors duration-200"
                                    >
                                        <Edit3 className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <div className="font-medium text-gray-900">Edit Profile</div>
                                            <div className="text-sm text-gray-600">Update user information</div>
                                        </div>
                                    </Link>

                                    <button
                                        data-modal-toggle="#reset_password_modal"
                                        className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors duration-200 w-full text-left"
                                    >
                                        <Key className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <div className="font-medium text-gray-900">Reset Password</div>
                                            <div className="text-sm text-gray-600">Generate new password</div>
                                        </div>
                                    </button>

                                    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                        <Shield className="w-5 h-5 text-gray-600" />
                                        <div>
                                            <div className="font-medium text-gray-900">Security Settings</div>
                                            <div className="text-sm text-gray-600">Manage account security</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Role-Specific Information Notice */}
                            {userDetail.type !== "owner" && (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <Shield className="w-5 h-5" />
                                        <div>
                                            <div className="font-medium">
                                                {userDetail.type === "vendor" ? "Vendor Account" : "Technician Account"}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {userDetail.type === "vendor"
                                                    ? "This account has access to vendor-specific features and assigned projects."
                                                    : "This account has access to technical maintenance features and assigned tasks."}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            <div className="modal" data-modal="true" id="reset_password_modal">
                <div className="modal-content max-w-[600px] top-[20%]">
                    <div className="modal-header">
                        <h3 className="modal-title flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            Reset Password
                        </h3>
                        <button className="btn btn-xs btn-icon btn-light" data-modal-dismiss="true">
                            <i className="ki-outline ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="flex flex-col justify-center items-center p-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <RefreshCw className="w-8 h-8 text-blue-600" />
                            </div>

                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Reset User Password</h4>
                            <p className="text-gray-600 text-center mb-6">
                                This will generate a new temporary password for the user. The user will need to change it on their next
                                login.
                            </p>

                            <button
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                                onClick={handleResetPassword}
                                disabled={isResetting}
                            >
                                <Key className="w-4 h-4" />
                                {isResetting ? "Resetting..." : "Confirm Reset Password"}
                            </button>

                            {newPassword && (
                                <div className="w-full max-w-md">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm">
                                            {newPassword}
                                        </div>
                                        <button
                                            className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors duration-200 copy-link"
                                            data-clipboard-text={newPassword}
                                            title="Copy to clipboard"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Password has been copied to clipboard. Share this securely with the user.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserDetail
