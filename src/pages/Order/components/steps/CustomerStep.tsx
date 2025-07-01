import { useEffect, useRef, useState } from "react";
import { fetchUsers } from "../../../../services/api";
import { Search, UserIcon } from "lucide-react";
import { motion } from 'framer-motion';
import { User } from "../../../../types";

interface FormData {
    unitType: string;
    block: string;
    floor: string;
    unitNo: string;
    queenBedrooms: number;
    singleBedrooms: number;
    studios: number;
    bathrooms: number;
    includePartition: boolean;
    completionDays: number;
    isProgressivePayment: boolean;
    isDraftMode: boolean;
    finalAmount: number;
    bonusDescription: string;
    bonusValue: number;
    internalRemark: string;
}

interface CustomerStepProps {
    isDraftMode: boolean
    selectedCustomer: User | null
    setSelectedCustomer: (customer: User | null) => void
    formData: FormData
    setFormData: (data: FormData) => void
    stepErrors?: { [key: string]: string }
}

export default function CustomerStep({ isDraftMode, selectedCustomer, setSelectedCustomer, formData, setFormData, stepErrors }: CustomerStepProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [showDropdown, setShowDropdown] = useState(false)
    const inputUserRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [owners, setOwners] = useState<User[]>([])
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

    const handleOpenOwnerDropdown = async () => {
        setSearchTerm("")
        if (inputUserRef.current) inputUserRef.current.value = ""
        inputUserRef.current?.focus()
        try {
            const data = await fetchUsers("", "owner")
            setOwners(data.data)
        } catch (error) {
            console.error("Failed to fetch owners:", error)
        }
    }

    const handleSearchOwner = (event: React.ChangeEvent<HTMLInputElement>) => {
        const term = event.target.value
        setSearchTerm(term)

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current)
        }

        debounceTimeout.current = setTimeout(async () => {
            try {
                const data = await fetchUsers(term, "owner")
                setOwners(data.data)
            } catch (error) {
                console.error("Error fetching owners:", error)
            }
        }, 500)
    }

    return (
        <div className="p-8 backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-3xl">
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Owner Information</h2>
                    <p className="text-gray-600">Select a customer or enable draft mode to proceed</p>
                </div>

                {!isDraftMode && (
                    <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-700">Select Owner</label>
                        <div className="relative" ref={dropdownRef}>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    ref={inputUserRef}
                                    placeholder="Search owners..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        handleSearchOwner(e);
                                        setShowDropdown(true);
                                    }}
                                    onFocus={() => {
                                        handleOpenOwnerDropdown();
                                        setShowDropdown(true);
                                    }}
                                    className={`w-full pl-12 pr-4 py-3 h-12 rounded-xl border bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 ${stepErrors.customer ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200'}`}
                                />
                            </div>

                            {stepErrors.customer && (
                                <p className="text-sm text-red-600 mt-1">{stepErrors.customer}</p>
                            )}

                            {showDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-xl z-10 max-h-60 overflow-y-auto overflow-x-hidden"
                                >
                                    {owners.map((customer) => (
                                        <motion.button
                                            key={customer.id}
                                            className="w-full p-4 text-left hover:bg-gray-50/80 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                            onClick={() => {
                                                setSelectedCustomer(customer)
                                                setShowDropdown(false)
                                                setSearchTerm("")
                                            }}
                                            whileHover={{ x: 4 }}
                                        >
                                            <div className="font-medium text-gray-900">{customer.name}</div>
                                            <div className="text-sm text-gray-500">{customer.email}</div>
                                            <div className="text-sm text-gray-500">+{customer.country_code} {customer.phone_no}</div>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {selectedCustomer && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <UserIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
                                        <div className="text-sm text-gray-500">{selectedCustomer.email}</div>
                                        <div className="text-sm text-gray-500">+{selectedCustomer.country_code} {selectedCustomer.phone_no}</div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700">Internal Remarks</label>
                    <textarea
                        placeholder="Add any internal notes or remarks..."
                        value={formData.internalRemark}
                        onChange={(e) => setFormData({ ...formData, internalRemark: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 resize-none"
                    />
                </div>
            </div>
        </div>
    )
}