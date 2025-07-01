"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Package, Plus } from "lucide-react"
import { productIndex } from "../../../services/api"
import { Product } from "../../../types"

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedProducts: Product[];
    onSelectProduct: (product: Product) => void;
    onRemoveProduct: (productId: number) => void;
}


export function ProductModal({ isOpen, onClose, selectedProducts, onSelectProduct, onRemoveProduct }: ProductModalProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [products, setProducts] = useState<Product[]>([]); // Initialize as an empty array
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null);
    const isSelected = (id: number) => selectedProducts.some(p => p.id === id);

    useEffect(() => {
        if (!isOpen) return;

        // Create a new AbortController for the request
        abortControllerRef.current = new AbortController();

        initProductTable(page, size, '', null, '');

        // Cleanup: Abort the request when the component unmounts or dependencies change
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [isOpen, page, size]);


    const initProductTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await productIndex(
                size,
                page,
                searchTerm,
                order,
                field,
                abortControllerRef.current?.signal // Pass the signal
            );
            const data = response?.data || [];
            setProducts(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching products:', error);
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
            await initProductTable(1, size, term, null, '');
        }, 500)
    }

    if (!isOpen) return null;

    const handleCloseModal = () => {
        // Abort any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        onClose();
        setSearchTerm('');
    };


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
                    className="relative w-full max-w-4xl max-h-[80vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900">Add Products</h2>
                            <p className="text-gray-600 mt-1">Select products to add to your package</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100/80 transition-colors duration-200">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-6 border-b border-gray-200/50">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="animate-pulse flex space-x-4">
                                        <div className="rounded-lg bg-gray-200 h-16 w-16" />
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <Search className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {products.map((product, index) => {
                                    const selected = isSelected(product.id);

                                    return (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex flex-col justify-between p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Optional Product Image */}
                                                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm font-medium">
                                                    {product.attachments?.thumbnail ? (
                                                        <img src={AWS_S3_URL + product.attachments.thumbnail.file_url} alt={product.name} className="h-full w-full object-cover rounded-lg" />
                                                    ) : (
                                                        <span>No Image</span>
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>

                                                    {/* 💡 Additional Details */}
                                                    <div className="mt-1 text-xs text-gray-500 space-y-1">
                                                        <div><span className="font-medium">Supplier:</span> {product.supplier_name || '-'}</div>
                                                        <div><span className="font-medium">Category:</span> {product.pm_category || '-'}</div>
                                                        <div><span className="font-medium">Product Type:</span> {product.type || '-'}</div>
                                                    </div>

                                                    {/* 💰 Pricing */}
                                                    <div className="text-base font-bold text-gray-900 mt-2">
                                                        RM {(product.provisioning.install.retail_price + product.provisioning.supply.retail_price).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 🔁 Add/Remove Button */}
                                            <div className="mt-4">
                                                {selected ? (
                                                    <button
                                                        onClick={() => onRemoveProduct(product.id)}
                                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium shadow-lg shadow-red-500/25 transition-all duration-200"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Remove Product
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => onSelectProduct(product)}
                                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-200"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        Add Product
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
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
            </div >
        </AnimatePresence >
    )

}
