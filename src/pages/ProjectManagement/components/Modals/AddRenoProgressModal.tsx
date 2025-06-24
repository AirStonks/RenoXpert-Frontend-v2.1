import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Building2, TrendingUp, DollarSign, User, MapPin, Plus, Search, ChevronDown, X, Newspaper, AlertCircle, ReceiptText } from "lucide-react"
import { Slide, toast } from "react-toastify"
import { fetchProperties, generateRenoProgress, getSalesWithoutReno } from "../../../../services/api"
import { Property, Sale } from "../../../../types"

// Custom Button Component
interface ButtonProps {
    children: React.ReactNode
    onClick?: () => void
    className?: string
    disabled?: boolean
}

const Button: React.FC<ButtonProps> = ({ children, onClick, className = "", disabled = false }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {children}
        </button>
    )
}

// Custom Dropdown Component
interface DropdownProps {
    selectedProperty: Property | null
    onPropertySelect: (property: Property) => void
    properties: Property[]
}

const PropertyDropdown: React.FC<DropdownProps> = ({ selectedProperty, onPropertySelect, properties }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const dropdownRef = useRef<HTMLDivElement>(null)

    const filteredProperties = properties.filter((property) =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSearchTerm("")
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handlePropertySelect = (property: Property) => {
        onPropertySelect(property)
        setIsOpen(false)
        setSearchTerm("")
    }

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation()
        onPropertySelect(null as any)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
          w-full px-4 py-3 bg-white/70 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between
          ${isOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200 hover:border-blue-300"}
        `}
            >
                <span className={selectedProperty ? "text-gray-900 font-medium" : "text-gray-500"}>
                    {selectedProperty ? selectedProperty.name : "Select a property..."}
                </span>
                <div className="flex items-center gap-2">
                    {selectedProperty && (
                        <button
                            onClick={clearSelection}
                            className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                            <X className="w-3 h-3 text-gray-600" />
                        </button>
                    )}
                    <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search properties..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {filteredProperties.length > 0 ? (
                            filteredProperties.map((property) => (
                                <div
                                    key={property.id}
                                    onClick={() => handlePropertySelect(property)}
                                    className={`
                    px-4 py-3 cursor-pointer transition-all duration-200 border-l-4
                    ${selectedProperty?.id === property.id
                                            ? "bg-blue-50 border-l-blue-500 text-blue-900"
                                            : "border-l-transparent hover:bg-gray-50 hover:border-l-gray-300"
                                        }
                  `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-gray-900">{property.name}</div>
                                            <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {property.address}
                                            </div>
                                        </div>
                                        {/* <div className="text-right">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {new Intl.NumberFormat("en-MY", {
                                                    style: "currency",
                                                    currency: "MYR",
                                                    minimumFractionDigits: 0,
                                                }).format(property.totalValue)}
                                            </div>
                                            <div className="text-xs text-gray-500">{property.completionPercentage}% complete</div>
                                        </div> */}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-center text-gray-500">
                                <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <div>No properties found</div>
                                <div className="text-sm">Try adjusting your search</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// Custom Modal Components
interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-[90%] max-h-[90vh] mx-4">{children}</div>
        </div>
    )
}

interface PropertySalesModalProps {
    isOpen: boolean
    onClose: () => void
    refetch?: () => void
}

export default function AddRenoProgressModal({ isOpen, onClose, refetch }: PropertySalesModalProps) {
    const [properties, setProperties] = useState<Property[]>([])
    const [sales, setSales] = useState<Sale[]>([])
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

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

    useEffect(() => {

        const getProperties = async () => {
            try {
                const response = await fetchProperties();

                setProperties(response.data);
            } catch (error) {
                notify("error", "Failed to fetch properties")
            }
        }

        getProperties()

    }, [])

    const handlePropertySelect = async (property: Property) => {
        setSelectedProperty(property)
        setSelectedSale(null)

        try {
            const response = await getSalesWithoutReno(Number(property?.id) || 0);

            setSales(response.data);


        } catch (error) {
            notify("error", "Failed to fetch sales data")
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-MY", {
            style: "currency",
            currency: "MYR",
        }).format(amount)
    }

    // Update the sales filtering logic to match by unit
    const allPropertySales = selectedProperty ? (sales.filter((sale) => sale.order.property_id === selectedProperty.id)) || [] : []

    // Filter add-on sales by same unit (block-floor-unit_no combination)
    const addonSales = selectedSale
        ? allPropertySales.filter((sale) => {
            if (sale.id === selectedSale.id) return false // Exclude the selected sale

            // Match by same unit (block-floor-unit_no)
            return (
                sale.order?.block === selectedSale.order?.block &&
                sale.order?.floor === selectedSale.order?.floor &&
                sale.order?.unit_no === selectedSale.order?.unit_no
            )
        })
        : []

    // Update the sales summary in the right panel header
    const availableSales = selectedProperty ? (sales.filter((sale) => sale.order.property_id === selectedProperty.id)) || [] : []
    const totalSalesValue = availableSales.reduce((sum, sale) => sum + sale.total_amount, 0)



    const handleCreateRenoProgress = async () => {

        const body = {
            'main_sale_id': selectedSale?.id || null,
            'addon_sale_ids': addonSales.map(sale => sale.id),
        };

        try {
            const response = await generateRenoProgress(body);

            if (response?.success) {
                notify("success", "Project Tracker created successfully");
                refetch();
                onClose();
            } else {
                notify("error", "Failed to create Project Tracker");
            }

        } catch (error) {
            notify("error", "Failed to create Project Tracker");
        }

    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Generate Project Tracker</h2>
                                <p className="text-sm text-gray-600">Select a sale and generate a Project Tracker</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                        >
                            <X className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                </div>

                {/* <div className="flex pt-4 px-6">
                    <div className="bg-yellow-100 backdrop-blur-md rounded-3xl shadow-md p-4 h-full w-full">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <h3 className="text-lg font-semibold text-red-700 ml-2">This is a demo feature, the "+ Create Project Tracker" button is safe to click. So you can play around without hesitation.</h3>
                        </div>
                    </div>
                </div> */}

                <div className="flex gap-6 p-6 h-[calc(90vh-120px)]">
                    {/* Left Panel - Property Selection */}
                    <div className="w-1/3 flex flex-col">
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 h-full">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Select Property
                            </h3>

                            <PropertyDropdown
                                selectedProperty={selectedProperty}
                                onPropertySelect={handlePropertySelect}
                                properties={properties}
                            />

                            {/* Available Quotations/Sales */}
                            {selectedProperty && (
                                <div className="mt-8 flex flex-col">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Newspaper className="w-5 h-5" />
                                        Available Quotations/Sales
                                    </h3>

                                    <div className="space-y-3 h-[calc(90vh-400px)] overflow-y-auto px-3 py-1">
                                        {sales.filter((sale) => sale.order.property_id === selectedProperty.id).map((sale) => (
                                            <div
                                                key={sale.id}
                                                onClick={() => setSelectedSale(sale)}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-[1.02]
                                                    ${selectedSale?.id === sale.id
                                                        ? "border-blue-500 bg-blue-50/80 shadow-lg"
                                                        : "border-gray-200 bg-white/70 hover:border-blue-300 hover:bg-blue-50/50"
                                                    }`}
                                            >
                                                <div className="space-y-3">
                                                    {/* Owner Name and Unit */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                                <User className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <h5 className="font-semibold text-gray-900">{sale.order?.user?.name}</h5>
                                                                <p className="text-sm text-gray-600">
                                                                    Unit: {sale.order?.block}-{sale.order?.floor}-{sale.order?.unit_no}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-bold text-gray-900">{formatCurrency(sale.total_amount)}</div>
                                                            <div className="text-sm text-gray-600">{(sale.paid_percentage * 100).toFixed(2)}% Paid</div>
                                                        </div>
                                                    </div>

                                                    {/* Sale and Order Numbers */}
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div className="bg-blue-50 rounded-lg p-2">
                                                            <span className="text-gray-600">Sale No:</span>
                                                            <div className="font-medium text-gray-900">{sale.sales_no}</div>
                                                        </div>
                                                        <div className="bg-purple-50 rounded-lg p-2">
                                                            <span className="text-gray-600">Order No:</span>
                                                            <div className="font-medium text-gray-900">{sale.order?.order_no}</div>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar for Paid Percentage */}
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600">Payment Progress</span>
                                                            <span className="font-medium text-gray-900">{(sale.paid_percentage * 100).toFixed(2)}%</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                                                style={{ width: `${sale.paid_percentage * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {(sales.filter((sale) => sale.order.property_id === selectedProperty.id)).length === 0 && (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <TrendingUp className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h4 className="font-medium text-gray-900 mb-1">No Sales Found</h4>
                                                <p className="text-sm text-gray-600">No sales data available for this property</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Sales Data */}
                    <div className="flex-1 flex flex-col">
                        {selectedProperty ? (
                            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 h-full flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5" />
                                            {selectedSale ? `Sales for ${selectedProperty.name}` : `Sales for ${selectedProperty.name}`}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {selectedSale
                                                ? `Selected: ${selectedSale.order?.user?.name} • Total: ${allPropertySales.length} sales • Value: ${formatCurrency(totalSalesValue)}`
                                                : `Total: ${availableSales.length} sales • Value: ${formatCurrency(totalSalesValue)}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Sales Lists */}
                                <div className="flex-1 overflow-y-auto space-y-6 mb-6">
                                    {/* Main Sales */}
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            {selectedSale ? "Main Quotation/Sale (1)" : "Main Sales (0)"}
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedSale ? (
                                                <div className="bg-white/70 rounded-2xl p-4 border border-gray-200">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                                    <ReceiptText className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-lg font-bold text-gray-900">{selectedSale.sales_no}</h5>
                                                                    <p className="text-sm font-medium text-gray-700">{selectedSale.order?.order_no}</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="text-sm text-gray-600">Owner Name</p>
                                                                        <p className="font-semibold text-gray-900">{selectedSale.order?.user?.name}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm text-gray-600">Unit</p>
                                                                        <p className="font-semibold text-gray-900">
                                                                            {selectedSale.order?.block}-{selectedSale.order?.floor}-
                                                                            {selectedSale.order?.unit_no}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="text-sm text-gray-600">Total Amount</p>
                                                                        <p className="text-xl font-bold text-gray-900">
                                                                            {formatCurrency(selectedSale.total_amount || 0)}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm text-gray-600">Paid Percentage</p>
                                                                        <p className="text-lg font-bold text-emerald-600">
                                                                            {(selectedSale.paid_percentage * 100).toFixed(2)}%
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Progress Bar for Paid Percentage */}
                                                                <div className="space-y-1">
                                                                    <div className="flex justify-between text-sm">
                                                                        <span className="text-gray-600">Payment Progress</span>
                                                                    </div>
                                                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                                                            style={{ width: `${selectedSale.paid_percentage * 100}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <TrendingUp className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <h4 className="font-medium text-gray-900 mb-1">No Sale Selected</h4>
                                                    <p className="text-sm text-gray-600">
                                                        Select a sale from the Available Quotations/Sales to view details
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add-on Sales */}
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Plus className="w-4 h-4" />
                                            Add-on Quotations/Sales ({addonSales.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {addonSales.map((sale) => (
                                                <div key={sale.id} className="bg-white/70 rounded-2xl p-4 border border-gray-200">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                                                    <ReceiptText className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-lg font-bold text-gray-900">{sale.sales_no}</h5>
                                                                    <p className="text-sm font-medium text-gray-700">{sale.order?.order_no}</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="text-sm text-gray-600">Owner Name</p>
                                                                        <p className="font-semibold text-gray-900">{sale.order?.user?.name}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm text-gray-600">Unit</p>
                                                                        <p className="font-semibold text-gray-900">
                                                                            {sale.order?.block}-{sale.order?.floor}-{sale.order?.unit_no}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="text-sm text-gray-600">Total Amount</p>
                                                                        <p className="text-xl font-bold text-gray-900">
                                                                            {formatCurrency(sale.total_amount || 0)}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm text-gray-600">Paid Percentage</p>
                                                                        <p className="text-lg font-bold text-emerald-600">{(sale.paid_percentage * 100).toFixed(2)}%</p>
                                                                    </div>
                                                                </div>

                                                                {/* Progress Bar for Paid Percentage */}
                                                                <div className="space-y-1">
                                                                    <div className="flex justify-between text-sm">
                                                                        <span className="text-gray-600">Payment Progress</span>
                                                                    </div>
                                                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                                                            style={{ width: `${sale.paid_percentage * 100}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Create Project Tracker Button */}
                                <div className="flex justify-end">
                                    {selectedSale && (
                                        <Button
                                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                                            onClick={() => handleCreateRenoProgress()}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Project Tracker
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Building2 className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Property</h3>
                                    <p className="text-gray-600">Choose a property from the dropdown to view its associated sales data</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal >
    )
}
