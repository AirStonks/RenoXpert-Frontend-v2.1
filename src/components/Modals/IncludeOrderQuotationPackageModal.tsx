"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Package } from "../../types"
import { packageIndex } from "../../services/api"

interface IncludeOrderQuotationPackageModalProps {
    selectedPackages: Package[]
    setSelectedPackages: React.Dispatch<React.SetStateAction<Package[]>>
    isOpen: boolean
    onClose: () => void
}

type SortOrder = "asc" | "desc" | null

export default function IncludeOrderQuotationPackageModal({
    selectedPackages,
    setSelectedPackages,
    isOpen,
    onClose,
}: IncludeOrderQuotationPackageModalProps) {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    const [packages, setPackages] = useState<Package[]>([])

    const [filteredPackages, setFilteredPackages] = useState<Package[]>(packages)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [page, setPage] = useState<number>(1)
    const [size, setSize] = useState<number>(10)
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [sortField, setSortField] = useState<string>("")
    const [sortOrder, setSortOrder] = useState<SortOrder>(null)

    const totalItems = filteredPackages.length
    const totalPages = Math.ceil(totalItems / size)
    const startIndex = (page - 1) * size
    const endIndex = Math.min(startIndex + size, totalItems)
    const currentPackages = filteredPackages.slice(startIndex, endIndex)

    // Handle modal animations
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
            setTimeout(() => {
                if (modalRef.current) {
                    modalRef.current.classList.remove("scale-95", "opacity-0")
                    modalRef.current.classList.add("scale-100", "opacity-100")
                }
            }, 10)
        } else {
            document.body.style.overflow = "unset"
        }

        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose()
            }
        }

        document.addEventListener("keydown", handleEscape)
        return () => document.removeEventListener("keydown", handleEscape)
    }, [isOpen, onClose])

    // Filter and sort packages
    useEffect(() => {
        let filtered = [...packages]

        console.log(filtered);


        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (pkg) =>
                    (pkg.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false) ||
                    (pkg.description?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false) ||
                    (pkg.category?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false)
            );
        }

        // Apply sorting
        if (sortField && sortOrder) {
            filtered.sort((a, b) => {
                let aValue: any = a[sortField as keyof Package]
                let bValue: any = b[sortField as keyof Package]

                if (typeof aValue === "string") {
                    aValue = aValue.toLowerCase()
                    bValue = bValue.toLowerCase()
                }

                if (sortOrder === "asc") {
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
                } else {
                    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
                }
            })
        }

        setFilteredPackages(filtered)

        // Reset to first page when filtering/sorting changes
        if (page > Math.ceil(filtered.length / size)) {
            setPage(1)
        }
    }, [packages, searchTerm, sortField, sortOrder, size])

    // Reset page when size changes
    useEffect(() => {
        setPage(1)
    }, [size])

    useEffect(() => {
        initPackageTable(1, 10, '', null, '');
    }, []);

    const initPackageTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await packageIndex(size, page, searchTerm, order, field, false);
            const data = response?.data || [];

            setPackages(data);
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setIsLoading(false);
        }
    };



    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        setSearchTerm(value)
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
            return (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                </svg>
            )
        }
        switch (sortOrder) {
            case "asc":
                return (
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                )
            case "desc":
                return (
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )
            default:
                return (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                    </svg>
                )
        }
    }

    const handleSelectPackage = (pkg: Package) => {
        const isSelected = selectedPackages.some((selected) => selected.id === pkg.id)

        if (isSelected) {
            setSelectedPackages((prev) => prev.filter((selected) => selected.id !== pkg.id))
        } else {
            setSelectedPackages((prev) => [...prev, { ...pkg, quantity: 1 }])
        }
    }

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage)
        }
    }

    const handleSizeChange = (newSize: number) => {
        setSize(newSize)
        setPage(1)
    }

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = []
        const maxVisiblePages = 5

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total pages is less than or equal to max visible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Show pages with ellipsis
            if (page <= 3) {
                // Show first 3 pages + ellipsis + last page
                for (let i = 1; i <= 3; i++) {
                    pages.push(i)
                }
                if (totalPages > 4) {
                    pages.push("...")
                    pages.push(totalPages)
                }
            } else if (page >= totalPages - 2) {
                // Show first page + ellipsis + last 3 pages
                pages.push(1)
                if (totalPages > 4) {
                    pages.push("...")
                }
                for (let i = totalPages - 2; i <= totalPages; i++) {
                    pages.push(i)
                }
            } else {
                // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
                pages.push(1)
                pages.push("...")
                for (let i = page - 1; i <= page + 1; i++) {
                    pages.push(i)
                }
                pages.push("...")
                pages.push(totalPages)
            }
        }

        return pages
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur effect */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative w-full max-w-7xl h-[90vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 transform transition-all duration-300 ease-out scale-95 opacity-0 flex flex-col"
                style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                }}
            >
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200/50 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Add Package to Quotation</h2>
                        <p className="text-sm text-gray-500 mt-1">Select packages to include in your quotation</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100/80 transition-colors duration-200 group"
                    >
                        <svg
                            className="w-5 h-5 text-gray-500 group-hover:text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search - Fixed */}
                <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
                    <div className="relative">
                        <svg
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search packages..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200/50 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200"
                        />
                    </div>

                    {/* Note */}
                    <div className="mt-4 p-4 bg-amber-50/80 rounded-xl border border-amber-200/50">
                        <p className="text-xs text-amber-700">
                            <span className="font-medium">Note:</span> Removed packages will not show in the list. To remove packages
                            from quotation, close this modal and remove from the list.
                        </p>
                    </div>
                </div>

                {/* Table Container - Scrollable */}
                <div className="flex-1 overflow-hidden px-6">
                    <div className="h-full overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 z-10">
                                <tr>
                                    <th
                                        className="text-left py-4 pr-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50/50 transition-colors duration-200"
                                        onClick={() => handleSort("name")}
                                    >
                                        <div className="flex items-center gap-2">
                                            Package Name
                                            {getSortIcon("name")}
                                        </div>
                                    </th>
                                    <th className="text-left py-4 px-4 font-medium text-gray-700 min-w-[200px]">Internal Description</th>
                                    <th className="text-center py-4 px-4 font-medium text-gray-700">Add-On</th>
                                    <th
                                        className="text-right py-4 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50/50 transition-colors duration-200"
                                        onClick={() => handleSort("total_price")}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            Price
                                            {getSortIcon("total_price")}
                                        </div>
                                    </th>
                                    <th className="text-center py-4 pl-4 font-medium text-gray-700 min-w-[120px]">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentPackages.map((pkg, index) => {
                                    const isSelected = selectedPackages.some((selected) => selected.id === pkg.id)

                                    return (
                                        <tr
                                            key={pkg.id}
                                            className={`border-b border-gray-100/50 hover:bg-gray-50/30 transition-colors duration-200 ${index % 2 === 0 ? "bg-white/50" : "bg-gray-50/30"
                                                }`}
                                        >
                                            <td className="py-4 pr-4">
                                                <div className="space-y-2">
                                                    <div className="font-medium text-gray-900">{pkg.name}</div>
                                                    <div className="text-sm text-gray-500 line-clamp-2">{pkg.description}</div>
                                                    {/* <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {pkg.category}
                                                    </span> */}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="text-sm text-gray-600 max-w-xs">{pkg.description_internal}</div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className="flex justify-center">
                                                    <div
                                                        className={`w-3 h-3 rounded-full ${pkg.is_addon ? "bg-green-500" : "bg-gray-300"}`}
                                                        title={pkg.is_addon ? "Add-on Package" : "Standard Package"}
                                                    />
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="font-semibold text-gray-900 whitespace-nowrap">
                                                    RM{" "}
                                                    {pkg.total_price.toLocaleString("en-MY", {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </div>
                                            </td>
                                            <td className="py-4 pl-4 text-center">
                                                <button
                                                    onClick={() => handleSelectPackage(pkg)}
                                                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSelected
                                                        ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
                                                        : "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500"
                                                        }`}
                                                >
                                                    {isSelected ? "Remove" : "Select"}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {currentPackages.length === 0 && (
                            <div className="text-center py-12">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3"
                                    />
                                </svg>
                                <div className="text-gray-400 text-lg mb-2">No packages found</div>
                                <div className="text-gray-500 text-sm">Try adjusting your search criteria</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer with Pagination - Fixed */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-gray-200/50 bg-gray-50/30 rounded-b-3xl gap-4 flex-shrink-0">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>Show</span>
                        <select
                            value={size}
                            onChange={(e) => handleSizeChange(Number(e.target.value))}
                            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                        </select>
                        <span>per page</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <span className="text-sm text-gray-600">
                            {totalItems === 0 ? "0" : `${startIndex + 1}-${endIndex} of ${totalItems}`}
                        </span>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {getPageNumbers().map((pageNum, index) => (
                                    <div key={index}>
                                        {pageNum === "..." ? (
                                            <span className="px-3 py-2 text-gray-400">...</span>
                                        ) : (
                                            <button
                                                onClick={() => handlePageChange(pageNum as number)}
                                                className={`px-3 py-2 rounded-lg min-w-[40px] text-sm font-medium transition-colors duration-200 ${page === pageNum ? "bg-blue-500 text-white" : "hover:bg-white/50 text-gray-700"
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
