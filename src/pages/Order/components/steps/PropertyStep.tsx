import { motion } from 'framer-motion';
import { Property } from '../../../../types';
import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { fetchProperties } from '../../../../services/api';
import { Building, ChevronDown, Search } from 'lucide-react';
import type { OrderFormData } from '../../orderForm.types';

interface PropertyStepProps {
    selectedProperty: Property | null;
    setSelectedProperty: (property: Property | null) => void;
    formData: OrderFormData;
    setFormData: Dispatch<SetStateAction<OrderFormData>>;
}

export default function PropertyStep({ selectedProperty, setSelectedProperty, formData, setFormData }: PropertyStepProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [showDropdown, setShowDropdown] = useState(false)
    const inputPropertyRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [properties, setProperties] = useState<Property[]>([])
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleOpenPropertyDropdown = async () => {
        setSearchTerm("")
        if (inputPropertyRef.current) inputPropertyRef.current.value = ""
        inputPropertyRef.current?.focus()
        try {
            const data = await fetchProperties("", 6)
            setProperties(data.data)
        } catch (error) {
            console.error("Failed to fetch properties:", error)
        }
    }

    const handleSearchProperty = (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value
        setSearchTerm(term)

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current)
        }

        debounceTimeout.current = setTimeout(async () => {
            try {
                const data = await fetchProperties(term, 6)
                setProperties(data.data)
            } catch (error) {
                console.error("Error fetching properties:", error)
            }
        }, 500)
    }

    return (
        <div className="p-8 backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-3xl">
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Property Details</h2>
                    <p className="text-gray-600">Select a property and configure unit details</p>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Select Property</label>
                    <div className="relative" ref={dropdownRef}>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                ref={inputPropertyRef}
                                placeholder="Search properties..."
                                value={searchTerm}
                                onChange={(e) => {
                                    handleSearchProperty(e)
                                    setShowDropdown(true)
                                }}
                                onFocus={() => {
                                    handleOpenPropertyDropdown()
                                    setShowDropdown(true)
                                }}
                                className="w-full pl-12 pr-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                            />
                        </div>

                        {showDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-xl z-10 max-h-60 overflow-y-auto overflow-x-hidden"
                            >
                                {properties.map((property: Property) => (
                                    <motion.button
                                        key={property.id}
                                        className="w-full p-4 text-left hover:bg-gray-50/80 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                        onClick={() => {
                                            setSelectedProperty(property)
                                            setShowDropdown(false)
                                            setSearchTerm("")
                                        }}
                                        whileHover={{ x: 4 }}
                                    >
                                        <div className="font-medium text-gray-900">{property.name}</div>
                                        <div className="text-sm text-gray-500">{property.address}</div>
                                        <div className="text-sm text-gray-500">
                                            {property.city}, {property.state}
                                        </div>
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {selectedProperty && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-green-50/50 rounded-xl border border-green-200/50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Building className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-900">{selectedProperty.name}</div>
                                    <div className="text-sm text-gray-500">{selectedProperty.address}</div>
                                    <div className="text-sm text-gray-500">
                                        {selectedProperty.city}, {selectedProperty.state}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {selectedProperty && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Unit Type</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Condominium"
                                    value={formData.unitType}
                                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                                    className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Block</label>
                                <input
                                    type="text"
                                    placeholder="Block A"
                                    value={formData.block}
                                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                                    className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Floor</label>
                                <input
                                    type="text"
                                    placeholder="12"
                                    value={formData.floor}
                                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                    className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Unit No</label>
                                <input
                                    type="text"
                                    placeholder="01"
                                    value={formData.unitNo}
                                    onChange={(e) => setFormData({ ...formData, unitNo: e.target.value })}
                                    className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {([
                                { key: "queenBedrooms", label: "Queen Bedrooms", max: 6 },
                                { key: "singleBedrooms", label: "Single Bedrooms", max: 6 },
                                { key: "studios", label: "Studios", max: 3 },
                                { key: "bathrooms", label: "Bathrooms", max: 5 },
                            ] as const).map(({ key, label, max }) => (
                                <div key={key}>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>
                                    <div className="relative">
                                        <select
                                            value={formData[key]}
                                            onChange={(e) =>
                                                setFormData({ ...formData, [key]: Number.parseInt(e.target.value) })
                                            }
                                            className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 appearance-none"
                                        >
                                            {Array.from({ length: max + 1 }, (_, i) => (
                                                <option key={i} value={i}>
                                                    {i}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            ))}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Include Partition</label>
                                <div className="flex items-center h-12 px-4 rounded-xl border border-gray-200 bg-white">
                                    <button
                                        onClick={() => setFormData({ ...formData, includePartition: !formData.includePartition })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.includePartition ? "bg-blue-500" : "bg-gray-200"}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${formData.includePartition ? "translate-x-6" : "translate-x-1"}`}
                                        />
                                    </button>
                                    <span className="ml-3 text-sm text-gray-600">{formData.includePartition ? "Yes" : "No"}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}