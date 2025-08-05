"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Plus } from "lucide-react"
import { packageIndex } from "../../../services/api"
import { Package } from "../../../types"

interface PackageSelectorProps {
    isOpen: boolean
    onClose: () => void
    selectedPackages: Package[]
    onSelectPackage: (pkg: Package) => void
    onRemovePackage?: (pkgId: number) => void
}

export function PackageSelector({ isOpen, onClose, selectedPackages, onSelectPackage, onRemovePackage }: PackageSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [packages, setPackages] = useState<Package[]>([])
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null);

    const categories = [
        { value: "all", label: "All Categories" },
        { value: "renovation", label: "Renovation" },
        { value: "smart_iot", label: "Smart IoT" },
        { value: "air_conditioning", label: "Air Conditioning" },
        { value: "electrical_appliances", label: "Electrical" },
    ]

    useEffect(() => {
        if (!isOpen) return;

        // Create a new AbortController for the request
        abortControllerRef.current = new AbortController();

        initPackageTable(page, size, '', null, '');

        // Cleanup: Abort the request when the component unmounts or dependencies change
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [isOpen, page, size]);

    const initPackageTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            // Pass the AbortSignal to the packageIndex function
            const response = await packageIndex(
                size,
                page,
                searchTerm,
                order,
                field,
                false,
                abortControllerRef.current?.signal // Pass the signal
            );
            const data = response?.data || [];
            setPackages(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error: any) {
            // Check if the error is due to abort
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
                return;
            }
            console.error('Error fetching packages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (term: string) => {
        setPage(1);
        setSearchTerm(term);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current)
        }
        debounceTimeout.current = setTimeout(async () => {
            await initPackageTable(1, size, term, null, '');
        }, 500)
    }

    const handleCloseModal = () => {
        // Abort any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        onClose();
        setSearchTerm('');
    };

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    onClick={handleCloseModal}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl max-h-[80vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200/50 shrink-0">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900">Select Packages</h2>
                            <p className="text-gray-600 mt-1">Choose packages to add to your quotation</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100/80 transition-colors duration-200">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="p-6 border-b border-gray-200/50 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search packages..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Package List */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm animate-pulse space-y-4">
                                        <div className="h-6 bg-gray-200 rounded w-2/3" />
                                        <div className="h-4 bg-gray-200 rounded w-full" />
                                        <div className="h-4 bg-gray-200 rounded w-5/6" />
                                        <div className="h-6 bg-gray-200 rounded w-1/3 mt-4" />
                                        <div className="h-10 bg-gray-300 rounded-xl mt-6" />
                                    </div>
                                ))}
                            </div>
                        ) : packages.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <Search className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
                                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {packages.map((pkg, index) => (
                                    <motion.div
                                        key={pkg.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex flex-col justify-between p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                                                    {pkg.is_addon && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                                                            Add-on
                                                        </span>
                                                    )}
                                                </div>
                                                <ul className="text-gray-600 text-sm mb-2">
                                                    {pkg?.description?.split("\n").map((item, index) => (
                                                        <li key={index} className="flex items-start">
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                                {pkg.description_internal && (
                                                    <div className="flex flex-col">
                                                        <p className="text-gray-800 text-sm">Internal Description:</p>
                                                        <div className="text-gray-600 text-sm bg-gray-100 rounded-xl p-3">
                                                            <ul className="text-xs text-gray-500">
                                                                {pkg?.description?.split("\n").map((item, index) => (
                                                                    <li key={index} className="flex items-start">
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-4">
                                            <div className="text-xl font-bold text-gray-900">RM {pkg.total_price.toLocaleString()}</div>
                                            {selectedPackages.some((selected) => selected.id === pkg.id) ? (
                                                <button
                                                    onClick={() => onRemovePackage(pkg.id)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium shadow-lg shadow-red-500/25 transition-all duration-200"
                                                >
                                                    <X className="h-4 w-4" />
                                                    Remove Package
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onSelectPackage(pkg)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-200"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add Package
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col md:flex-row items-center justify-between mt-6 bg-white p-4 rounded-3xl shadow-md">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <span>Show</span>
                            <select
                                value={size}
                                onChange={(e) => {
                                    setPage(1);
                                    setSize(parseInt(e.target.value))
                                }}
                                className="border rounded-lg px-3 py-1"
                            >
                                {[5, 10, 20, 30, 50].map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
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
                                    onClick={() => setPage(page - 1)}
                                    className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.min(5, Math.ceil(totalItems / size)) }, (_, index) => {
                                    const totalPages = Math.ceil(totalItems / size);
                                    const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
                                    const currentPage = startPage + index;
                                    return (
                                        <button
                                            key={currentPage}
                                            onClick={() => setPage(currentPage)}
                                            className={`px-3 py-1 border rounded-lg ${page === currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                                        >
                                            {currentPage}
                                        </button>
                                    );
                                })}
                                <button
                                    disabled={page === Math.ceil(totalItems / size)}
                                    onClick={() => setPage(page + 1)}
                                    className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}