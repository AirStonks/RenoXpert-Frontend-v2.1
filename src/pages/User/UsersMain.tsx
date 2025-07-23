"use client"

import type React from "react"

import { Link, useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import type { User } from "../../types"
import { deactivateUser, userIndex } from "../../services/api"
import Loading from "../../components/Loading"
import { useUser } from "../../context/UserContext"
import { Slide, toast } from "react-toastify"
import { KTModal } from "../../metronic/core"
import { ArrowPathIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/solid"
import { PlusIcon, XCircle, ListFilterIcon, UserPlusIcon } from "lucide-react"

const LOCAL_PATH_PREFIX = window.location.hostname === "localhost" ? "/staff/" : "/"

type SortOrder = "asc" | "desc" | null

function UsersMain() {
    const navigate = useNavigate()
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const { currentUser, loading, error } = useUser()

    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [page, setPage] = useState<number>(1)
    const [size, setSize] = useState<number>(10)
    const [totalItems, setTotalItems] = useState<number>(0)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [sortField, setSortField] = useState<string>("")
    const [sortOrder, setSortOrder] = useState<SortOrder>(null)
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deactivated">("all")

    const [selectedUser, setSelectedUser] = useState<User | null>(null)

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
        document.title = "Users | RenoXpert"
        initUserTable(page, size, searchTerm, sortOrder, sortField)
    }, [])

    const initUserTable = async (page: number, size: number, searchTerm?: string, order?: string, field?: string) => {
        try {
            setIsLoading(true)
            const response = await userIndex(size, page, searchTerm, order, field)
            const data = response?.data || []
            setUsers(data)
            setTotalItems(response?.totalCount || 0)
        } catch (error) {
            console.error("Error fetching users:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRefreshTable = async () => {
        setPage(1)
        await initUserTable(1, size, searchTerm, sortOrder, sortField)
        notify("success", "Users refreshed")
    }

    const handleFilterStatus = (status: "all" | "active" | "deactivated") => {
        setStatusFilter(status === statusFilter ? "all" : status)
        setPage(1)
        // You would implement the actual filtering logic here
        initUserTable(1, size, searchTerm, sortOrder, sortField)
    }

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        setSearchTerm(value)

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);
            await initUserTable(1, size, value, sortOrder, sortField);
        }, 500);
    }

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return
        setPage(newPage)
        initUserTable(newPage, size, searchTerm, sortOrder, sortField)
    }

    const handleSizeChange = (newSize: number) => {
        setSize(newSize)
        setPage(1)
        initUserTable(1, newSize, searchTerm, sortOrder, sortField)
    }

    const handleSort = (field: string) => {
        if (sortField === field) {
            if (sortOrder === null) {
                setSortOrder("asc")
            } else if (sortOrder === "asc") {
                setSortOrder("desc")
            } else {
                setSortOrder(null)
                setSortField("")
            }
        } else {
            setSortField(field)
            setSortOrder("asc")
        }
    }

    const getSortIcon = (field: string) => {
        if (sortField !== field) {
            return <span className="text-gray-400">↕</span>
        }
        switch (sortOrder) {
            case "asc":
                return <ChevronUpIcon className="h-4 w-4 text-blue-500" />
            case "desc":
                return <ChevronDownIcon className="h-4 w-4 text-blue-500" />
            default:
                return <span className="text-gray-400">↕</span>
        }
    }

    const totalPages = Math.ceil(totalItems / size)

    const handleDeactivateUser = async (userId: number) => {
        try {
            const response = await deactivateUser(userId)

            if (response?.success) {
                initUserTable(page, size, searchTerm)
                notify("success", "User deactivated successfully!")

                const deactiveModalEL = document.getElementById("deactive_user_modal") as HTMLElement
                const deactiveModal = KTModal.getInstance(deactiveModalEL)
                deactiveModal.hide()
            }
        } catch (error) {
            console.error("Error deactivating user:", error)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800"
            case "deactivated":
                return "bg-red-100 text-red-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getUserTypeBadge = (type: string) => {
        switch (type?.toLowerCase()) {
            case "super-admin":
                return "bg-purple-100 text-purple-800"
            case "admin":
                return "bg-blue-100 text-blue-800"
            case "staff":
                return "bg-orange-100 text-orange-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            {/* Sticky Header */}
            <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-6 z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    {/* Filter Buttons */}
                    <div className="flex gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">User Overview</h1>
                        <div className="flex items-center gap-2">
                            <ListFilterIcon className="w-5 h-5 text-gray-600" />
                            <div className="flex gap-2">
                                {[
                                    { key: "active", label: "Active", color: "bg-green-100 text-green-800 hover:bg-green-200" },
                                    { key: "deactivated", label: "Deactivated", color: "bg-red-100 text-red-800 hover:bg-red-200" },
                                ].map((filter) => (
                                    <button
                                        key={filter.key}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${statusFilter === filter.key
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        onClick={() => handleFilterStatus(filter.key as "active" | "deactivated")}
                                    >
                                        {filter.label}
                                        {statusFilter === filter.key && <XCircle className="h-3 w-3 ml-1 inline" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-none">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-10 pr-4 py-2 w-full lg:w-64 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleRefreshTable}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <Link
                            to={LOCAL_PATH_PREFIX + "users/add"}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add User
                        </Link>
                        <Link
                            to={LOCAL_PATH_PREFIX + "users/internal/add"}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                        >
                            <UserPlusIcon className="h-5 w-5" />
                            Add Internal User
                        </Link>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 text-gray-800 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 w-16"></th>
                            <th className="px-4 py-3 w-48 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                                <div className="flex items-center gap-2">User {getSortIcon("name")}</div>
                            </th>
                            <th className="px-4 py-3 w-40 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("phone_no")}>
                                <div className="flex items-center gap-2">Phone No. {getSortIcon("phone_no")}</div>
                            </th>
                            <th className="px-4 py-3 w-48 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("email")}>
                                <div className="flex items-center gap-2">Email {getSortIcon("email")}</div>
                            </th>
                            <th
                                className="px-4 py-3 w-32 text-center cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort("type")}
                            >
                                <div className="flex items-center justify-center gap-2">User Type {getSortIcon("type")}</div>
                            </th>
                            <th
                                className="px-4 py-3 w-24 text-center cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort("status")}
                            >
                                <div className="flex items-center justify-center gap-2">Status {getSortIcon("status")}</div>
                            </th>
                            <th className="px-4 py-3 w-32 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            // Skeleton Loader
                            Array.from({ length: 8 }).map((_, index) => (
                                <tr key={index} className="border-b animate-pulse">
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-4"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-36"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-6 bg-gray-200 rounded-full w-16 mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-6 bg-gray-200 rounded-full w-16 mx-auto"></div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="h-8 bg-gray-200 rounded w-20 mx-auto"></div>
                                    </td>
                                </tr>
                            ))
                        ) : users.length > 0 ? (
                            users.map((user, userIndex) => (
                                <tr key={userIndex} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3"></td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{user.name}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-gray-600">
                                            +{user.country_code} {user.phone_no}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-gray-600">{user.email}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeBadge(user.type)}`}>
                                            {user.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <Link
                                                to={LOCAL_PATH_PREFIX + "users/" + user.id}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition text-sm font-medium"
                                            >
                                                View
                                            </Link>

                                            {/* {((currentUser?.type === "super-admin" && user.type !== "super-admin") ||
                                                (currentUser?.type === "admin" && user.type === "staff")) &&
                                                user.status !== "deactivated" && (
                                                    <button
                                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition text-sm font-medium"
                                                        data-modal-toggle="#deactive_user_modal"
                                                        onClick={() => setSelectedUser(user)}
                                                    >
                                                        Deactivate
                                                    </button>
                                                )} */}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    No users available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!isLoading && users.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between mt-6 bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <span>Show</span>
                        <select
                            value={size}
                            onChange={(e) => handleSizeChange(Number.parseInt(e.target.value))}
                            className="border rounded-lg px-3 py-1"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="30">30</option>
                            <option value="50">50</option>
                        </select>
                        <span>per page</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>
                            {(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => handlePageChange(page - 1)}
                                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                                const startPage = Math.max(1, Math.min(page - 2, totalPages - 4))
                                const currentPage = startPage + index
                                return (
                                    <button
                                        key={currentPage}
                                        onClick={() => handlePageChange(currentPage)}
                                        className={`px-3 py-1 border rounded-lg ${page === currentPage ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                                            }`}
                                    >
                                        {currentPage}
                                    </button>
                                )
                            })}
                            <button
                                disabled={page === totalPages}
                                onClick={() => handlePageChange(page + 1)}
                                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deactivate User Modal */}
            <div className="modal" data-modal="true" id="deactive_user_modal">
                <div className="modal-content max-w-[600px] top-[20%]">
                    <div className="modal-header">
                        <h3 className="modal-title">Deactivate User</h3>
                        <button className="btn btn-xs btn-icon btn-light" data-modal-dismiss="true">
                            <i className="ki-outline ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body mb-4">
                        <h3 className="text-lg font-medium text-gray-900 text-center my-6">
                            <i className="ki-solid ki-information-3 text-7xl text-warning"></i>
                        </h3>

                        <div className="text-2sm text-center text-gray-700 mb-2">Are you sure to deactivate this user?</div>

                        <div className="text-2sm text-center font-bold text-gray-700 mb-6">
                            <div className="flex flex-col">
                                <span>
                                    {selectedUser?.name_first} {selectedUser?.name_last}
                                </span>
                                <span className="font-semibold text-gray-500">{selectedUser?.email}</span>
                                <span className="font-semibold text-gray-700">
                                    +{selectedUser?.country_code} {selectedUser?.phone_no}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-center items-center gap-4">
                            <button className="btn btn-light" data-modal-dismiss="true">
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={() => handleDeactivateUser(Number(selectedUser?.id))}>
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UsersMain
