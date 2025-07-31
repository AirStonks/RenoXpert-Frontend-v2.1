"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { toast, Slide } from "react-toastify"
import { useNavigate, useParams } from "react-router-dom"
import IncludeProductModal from "../../components/Modals/IncludeProductModal"
import type { Package, Product } from "../../types"
import { updatePackage } from "../../services/api"
import useFetchPackage from "../../hook/useFetchPackage"
import Loading from "../../components/Loading"
import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableProductRow } from "./components/SortableProductRow"
import { ArrowLeft, Calculator, Calendar, DollarSign, Clock, Plus, TrendingUp, Save } from "lucide-react"

const LOCAL_PATH_PREFIX = window.location.hostname === "localhost" ? "/staff/" : "/"

function EditPackage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const packageId = id ? Number.parseInt(id, 10) : null
    const { packageDetail, loading, error } = useFetchPackage(packageId)

    const [formData, setFormData] = useState({
        packageName: "",
        originalAmount: 0,
        markupAmount: 0,
        markupPercentage: 0,
        tenure: 0,
        monthlyAmount: 0,
        description: "",
        description_internal: "",
        category: "",
        is_addon: false,
        products: [],
    })

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
    const [totalPrice, setTotalPrice] = useState<number>(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [showProductModal, setShowProductModal] = useState(false)

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
        navigate(LOCAL_PATH_PREFIX + "packages/" + packageId)
    }

    // Initialize form data when package detail is loaded
    useEffect(() => {
        document.title = "Edit Package | RenoXpert"

        if (packageDetail) {
            const calculatedTotalPrice = packageDetail.products.reduce(
                (total, product) =>
                    total +
                    (product.provisioning.install.retail_price + product.provisioning.supply.retail_price) *
                    product.pivot.quantity,
                0,
            )

            setFormData({
                packageName: packageDetail.name || "",
                originalAmount: packageDetail.total_price || calculatedTotalPrice,
                markupAmount: packageDetail.markup_amount || 0,
                markupPercentage: packageDetail.markup_percentage ? packageDetail.markup_percentage * 100 : 0,
                tenure: packageDetail.tenure || 12,
                monthlyAmount: packageDetail.monthly_amount || 0,
                description: packageDetail.description || "",
                description_internal: packageDetail.description_internal || "",
                category: packageDetail.category || "",
                is_addon: packageDetail.is_addon || false,
                products: packageDetail.products || [],
            })

            setSelectedProducts(packageDetail.products || [])
            setTotalPrice(calculatedTotalPrice)
        }
    }, [packageDetail])

    // Update original amount when total price changes
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            originalAmount: totalPrice,
        }))
    }, [totalPrice])

    const openAddProductModal = () => {
        setShowProductModal(true)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        const numericValue = Number.parseFloat(value) || 0

        setFormData((prevData) => {
            const newData = {
                ...prevData,
                [name]: ["originalAmount", "markupAmount", "markupPercentage", "tenure", "monthlyAmount"].includes(name)
                    ? numericValue
                    : value,
            }

            // Handle markup calculations
            if (name === "markupAmount" && numericValue > 0) {
                newData.markupPercentage = 0
                // Calculate monthly payment when markup amount changes
                if (newData.tenure > 0) {
                    newData.monthlyAmount = numericValue / newData.tenure
                }
            } else if (name === "markupPercentage") {
                if (numericValue > 0) {
                    newData.markupAmount = newData.originalAmount + newData.originalAmount * (numericValue / 100)
                    // Calculate monthly payment when markup percentage changes
                    if (newData.tenure > 0) {
                        newData.monthlyAmount = newData.markupAmount / newData.tenure
                    }
                } else {
                    newData.markupAmount = newData.originalAmount
                    // Calculate monthly payment when markup percentage is 0
                    if (newData.tenure > 0) {
                        newData.monthlyAmount = newData.markupAmount / newData.tenure
                    }
                }
            } else if (name === "tenure" && numericValue > 0) {
                // Calculate monthly payment when tenure changes
                // newData.monthlyAmount = newData.markupAmount / numericValue
            }

            return newData
        })

        // Clear validation error for the field being edited
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({
                ...prev,
                [name]: "",
            }))
        }
    }

    const handleVisibilityToggle = (id: number) => {
        setSelectedProducts((prevProducts) =>
            prevProducts.map((product) =>
                product.id === id
                    ? {
                        ...product,
                        pivot: {
                            ...product.pivot,
                            visibility: !product.pivot.visibility,
                        },
                    }
                    : product,
            ),
        )
    }

    const handleSubmit = async () => {
        if (selectedProducts.length === 0) {
            notify("error", "Please select at least one product.")
            return
        }
        if (!formData.packageName) {
            notify("error", "Please enter a package name.")
            return
        }
        if (!formData.category) {
            notify("error", "Please select a category.")
            return
        }

        setIsSubmitting(true)

        try {
            const totalPackageAmount =
                formData.markupAmount > 0
                    ? formData.originalAmount + formData.markupAmount
                    : formData.markupPercentage > 0
                        ? formData.originalAmount * (1 + formData.markupPercentage / 100)
                        : formData.originalAmount

            const packageData: Package = {
                id: packageId,
                name: formData.packageName,
                total_price: totalPackageAmount,
                markup_amount: formData.markupAmount,
                markup_percentage: formData.markupPercentage > 0 ? formData.markupPercentage / 100 : 0,
                tenure: formData.tenure,
                monthly_amount: formData.monthlyAmount,
                description: formData.description,
                products: selectedProducts,
                description_internal: formData.description_internal,
                category: formData.category,
                is_addon: formData.is_addon,
            }

            const response = await updatePackage(packageData)
            if (response?.success) {
                notify("success", "Package Updated Successfully!")
                navigate(LOCAL_PATH_PREFIX + "packages/" + packageId)
            }
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.data || {}
                const formattedErrors = Object.keys(errors).reduce(
                    (acc, key) => {
                        acc[key] = errors[key].join(" ")
                        return acc
                    },
                    {} as Record<string, string>,
                )
                setValidationErrors(formattedErrors)
                notify("error", "Package update unsuccessful. Check the errors below.")
            } else {
                console.error("Package update failed:", error)
                notify("error", "An unexpected error occurred during package update.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const updateSelectedProducts = (products: Product[]) => {
        setSelectedProducts(products)
        const newTotalPrice = products.reduce(
            (acc, product) =>
                acc +
                ((product.pivot.includeSupply ? product.provisioning.supply.retail_price : 0) +
                    (product.pivot.includeInstall ? product.provisioning.install.retail_price : 0)) *
                product.pivot.quantity,
            0,
        )

        setTotalPrice(newTotalPrice)
        setFormData((prev) => ({
            ...prev,
            originalAmount: newTotalPrice,
            markupAmount: newTotalPrice * (1 + formData.markupPercentage / 100),
        }))
    }

    const updateTotalPrice = (price: number, operator: string) => {
        setTotalPrice((prevTotal) =>
            operator === "+" ? prevTotal + price : operator === "-" ? prevTotal - price : prevTotal,
        )
    }

    const recalculateFinancials = (products: Product[]) => {
        const newTotalPrice = products.reduce(
            (acc, product) =>
                acc +
                ((product.pivot.includeSupply ? product.provisioning.supply.retail_price : 0) +
                    (product.pivot.includeInstall ? product.provisioning.install.retail_price : 0)) *
                product.pivot.quantity,
            0,
        )

        const newMarkupAmount =
            formData.markupPercentage > 0 ? newTotalPrice + newTotalPrice * (formData.markupPercentage / 100) : newTotalPrice

        setTotalPrice(newTotalPrice)
        setFormData((prev) => ({
            ...prev,
            originalAmount: newTotalPrice,
            markupAmount: newMarkupAmount,
            // // Recalculate monthly amount when financials change
            // monthlyAmount: prev.tenure > 0 ? newMarkupAmount / prev.tenure : 0,
        }))
    }

    const adjustQuantity = (id: number, action: "increase" | "decrease") => {
        const updatedProducts = selectedProducts.map((product) => {
            if (product.id === id) {
                const newQty = action === "increase" ? product.pivot.quantity + 1 : Math.max(1, product.pivot.quantity - 1)
                return {
                    ...product,
                    pivot: {
                        ...product.pivot,
                        quantity: newQty,
                    },
                }
            }
            return product
        })
        setSelectedProducts(updatedProducts)
        recalculateFinancials(updatedProducts)
    }

    const handleRemoveProduct = (id: number) => {
        const updatedProducts = selectedProducts.filter((product) => product.id !== id)
        setSelectedProducts(updatedProducts)
        recalculateFinancials(updatedProducts)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setSelectedProducts((prev) => {
                const oldIndex = prev.findIndex((p) => `product-${p.id}` === active.id)
                const newIndex = prev.findIndex((p) => `product-${p.id}` === over.id)
                return arrayMove(prev, oldIndex, newIndex)
            })
        }
    }

    const toggleIsAddon = () => {
        setFormData((prev) => ({ ...prev, is_addon: !prev.is_addon }))
    }

    if (loading) return <Loading />
    if (error) return <div className="text-red-600">Something went wrong: {error}</div>
    if (!packageDetail) return <div>Package not found</div>

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
                            <h1 className="text-xl font-bold text-gray-900">Edit Package</h1>
                            <p className="text-sm text-gray-600">Modify package details and configuration</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-9 gap-8 mb-8 py-6">
                {/* Left Column - Package Details */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Financial Overview */}
                    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                                <Calculator className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Financial Overview</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-6">
                            <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">Original Amount</span>
                                </div>
                                <span className="text-2xl font-bold text-blue-900">
                                    RM {formData.originalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-orange-50/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm font-medium text-orange-900">Monthly Payment</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                        RM
                                    </span>
                                    <input
                                        type="number"
                                        name="monthlyAmount"
                                        value={formData.monthlyAmount}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="w-full pl-12 pr-4 py-3 bg-white/70 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                        per mth
                                    </span>
                                </div>
                                {/* <p className="text-xs text-gray-600 mt-2">
                                    Auto-calculated when tenure changes, but can be manually overridden
                                </p> */}
                            </div>
                        </div>
                    </div>

                    {/* Markup Configuration */}
                    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Markup Configuration</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Markup Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                        RM
                                    </span>
                                    <input
                                        type="number"
                                        name="markupAmount"
                                        value={formData.markupAmount}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="w-full pl-12 pr-4 py-3 bg-white/70 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Markup Percentage</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="markupPercentage"
                                        value={formData.markupPercentage}
                                        onChange={handleChange}
                                        step="0.01"
                                        className="w-full pr-12 pl-4 py-3 bg-white/70 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                        %
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tenure Configuration */}
                    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Payment Terms</h2>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tenure (in months)</label>
                            <input
                                type="number"
                                name="tenure"
                                value={formData.tenure}
                                onChange={handleChange}
                                min="1"
                                className="w-full px-4 py-3 bg-white/70 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="12"
                            />
                            {/* <p className="text-xs text-gray-600 mt-2">
                                Monthly payment will be automatically calculated based on markup amount and tenure
                            </p> */}
                        </div>
                    </div>

                    {/* Package Details */}
                    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Package Details</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Package Name</label>
                                <input
                                    type="text"
                                    name="packageName"
                                    value={formData.packageName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter package name"
                                />
                                {validationErrors.name && <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                    placeholder="Package description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Internal Description</label>
                                <textarea
                                    name="description_internal"
                                    value={formData.description_internal}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                    placeholder="Internal notes (not visible to customers)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-white/70 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                >
                                    <option value="">-- Select Category --</option>
                                    <option value="renovation">Renovation</option>
                                    <option value="partition">Partition</option>
                                    <option value="smart_iot">Smart IoT</option>
                                    <option value="project_management">Project Management</option>
                                    <option value="electrical_appliances">Electrical Appliances</option>
                                    <option value="air_conditioning">Air Conditioning</option>
                                    <option value="others">Others</option>
                                </select>
                                {validationErrors.category && <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>}
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl">
                                <input
                                    type="checkbox"
                                    name="is_addon"
                                    checked={formData.is_addon}
                                    onChange={toggleIsAddon}
                                    className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <label className="text-sm font-medium text-blue-900">Add-On Package</label>
                                    <p className="text-xs text-blue-700">Enable this package as an add-on option</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Products */}
                <div className="xl:col-span-7 space-y-6">
                    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Products</h2>
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                                data-modal-toggle="#include_product_modal"
                                onClick={openAddProductModal}
                            >
                                <Plus className="w-4 h-4" />
                                Add Products
                            </button>
                        </div>

                        <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl overflow-hidden">
                            <DndContext onDragEnd={handleDragEnd}>
                                <div className="overflow-x-auto">
                                    <table className="table w-full text-sm">
                                        <thead className="bg-gray-50/80 backdrop-blur-sm">
                                            <tr>
                                                <th className="w-[30px] px-2 sm:px-3 md:px-4 py-3 whitespace-nowrap"></th>
                                                <th className="w-[50px] px-2 sm:px-3 md:px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                                                    #
                                                </th>
                                                <th className="w-[250px] px-2 sm:px-3 md:px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                                                    Product
                                                </th>
                                                <th className="w-[200px] px-2 sm:px-3 md:px-4 py-3 text-center font-medium text-gray-700 whitespace-nowrap">
                                                    Supplier
                                                </th>
                                                <th className="w-[150px] px-2 sm:px-3 md:px-4 py-3 text-center font-medium text-gray-700 whitespace-nowrap">
                                                    Quantity
                                                </th>
                                                <th className="w-[100px] px-2 sm:px-3 md:px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                                                    Supply RRP
                                                </th>
                                                <th className="w-[100px] px-2 sm:px-3 md:px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                                                    Install RRP
                                                </th>
                                                <th className="w-[100px] px-2 sm:px-3 md:px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                                                    Total RRP
                                                </th>
                                                <th className="w-[100px] px-2 sm:px-3 md:px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                                                    Supply COGS
                                                </th>
                                                <th className="w-[100px] px-2 sm:px-3 md:px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                                                    Install COGS
                                                </th>
                                                <th className="w-[100px] px-2 sm:px-3 md:px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                                                    Total COGS
                                                </th>
                                                <th className="w-[80px] px-2 sm:px-3 md:px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                                                    Margin %
                                                </th>
                                                <th className="w-[100px] px-2 sm:px-3 md:px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                                                    Margin Amount
                                                </th>
                                                <th className="w-[100px] px-2 sm:px-3 md:px-4 py-3 text-center font-medium text-gray-700 whitespace-nowrap">
                                                    Visibility
                                                </th>
                                                <th className="w-[60px] px-2 sm:px-3 md:px-4 py-3 text-center font-medium text-gray-700 whitespace-nowrap">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <SortableContext
                                                items={selectedProducts.map((p) => `product-${p.id}`)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {selectedProducts.map((product, index) => (
                                                    <SortableProductRow
                                                        key={product.id}
                                                        index={index}
                                                        product={product}
                                                        adjustQuantity={adjustQuantity}
                                                        handleVisibilityToggle={handleVisibilityToggle}
                                                        handleRemoveProduct={handleRemoveProduct}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </tbody>
                                        <tfoot className="bg-gray-100/80 backdrop-blur-sm">
                                            <tr>
                                                <td colSpan={4} className="px-4 py-3"></td>
                                                <td className="px-4 py-3 text-center font-bold text-gray-900">
                                                    <span className="font-bold text-lg">Total</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                    {(() => {
                                                        const totalSupplyRRP = selectedProducts.reduce(
                                                            (acc, product) => acc + product.provisioning.supply.retail_price * product.pivot.quantity,
                                                            0,
                                                        )
                                                        return totalSupplyRRP > 0
                                                            ? `RM ${totalSupplyRRP.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`
                                                            : ""
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                    {(() => {
                                                        const totalInstallRRP = selectedProducts.reduce(
                                                            (acc, product) =>
                                                                acc + product.provisioning.install.retail_price * product.pivot.quantity,
                                                            0,
                                                        )
                                                        return totalInstallRRP > 0
                                                            ? `RM ${totalInstallRRP.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`
                                                            : ""
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-green-600 font-bold whitespace-nowrap">
                                                    {(() => {
                                                        const totalRRP = selectedProducts.reduce(
                                                            (acc, product) =>
                                                                acc +
                                                                (product.provisioning.supply.retail_price + product.provisioning.install.retail_price) *
                                                                product.pivot.quantity,
                                                            0,
                                                        )
                                                        return totalRRP > 0
                                                            ? `RM ${totalRRP.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`
                                                            : ""
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                    {(() => {
                                                        const totalSupplyCOGS = selectedProducts.reduce(
                                                            (acc, product) => acc + product.provisioning.supply.cogs * product.pivot.quantity,
                                                            0,
                                                        )
                                                        return totalSupplyCOGS > 0
                                                            ? `RM ${totalSupplyCOGS.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`
                                                            : ""
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                    {(() => {
                                                        const totalInstallCOGS = selectedProducts.reduce(
                                                            (acc, product) => acc + product.provisioning.install.cogs * product.pivot.quantity,
                                                            0,
                                                        )
                                                        return totalInstallCOGS > 0
                                                            ? `RM ${totalInstallCOGS.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`
                                                            : ""
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-red-600 font-bold whitespace-nowrap">
                                                    {(() => {
                                                        const totalCOGS = selectedProducts.reduce(
                                                            (acc, product) =>
                                                                acc +
                                                                (product.provisioning.supply.cogs + product.provisioning.install.cogs) *
                                                                product.pivot.quantity,
                                                            0,
                                                        )
                                                        return totalCOGS > 0
                                                            ? `RM ${totalCOGS.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`
                                                            : ""
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 font-bold whitespace-nowrap">
                                                    {(() => {
                                                        const totalRRP = selectedProducts.reduce(
                                                            (acc, product) =>
                                                                acc +
                                                                (product.provisioning.supply.retail_price + product.provisioning.install.retail_price) *
                                                                product.pivot.quantity,
                                                            0,
                                                        )
                                                        const totalCOGS = selectedProducts.reduce(
                                                            (acc, product) =>
                                                                acc +
                                                                (product.provisioning.supply.cogs + product.provisioning.install.cogs) *
                                                                product.pivot.quantity,
                                                            0,
                                                        )
                                                        return totalRRP !== 0
                                                            ? `${(((totalRRP - totalCOGS) / totalRRP) * 100).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}%`
                                                            : totalCOGS > 0
                                                                ? "-100.00%"
                                                                : "0.00%"
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 font-bold whitespace-nowrap">
                                                    {(() => {
                                                        const totalRRP = selectedProducts.reduce(
                                                            (acc, product) =>
                                                                acc +
                                                                (product.provisioning.supply.retail_price + product.provisioning.install.retail_price) *
                                                                product.pivot.quantity,
                                                            0,
                                                        )
                                                        const totalCOGS = selectedProducts.reduce(
                                                            (acc, product) =>
                                                                acc +
                                                                (product.provisioning.supply.cogs + product.provisioning.install.cogs) *
                                                                product.pivot.quantity,
                                                            0,
                                                        )
                                                        const marginAmount = totalRRP - totalCOGS
                                                        return `RM ${marginAmount.toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}`
                                                    })()}
                                                </td>
                                                <td colSpan={2} className="px-4 py-3"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </DndContext>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4">
                        <button
                            className="px-6 py-3 bg-gray-100/80 backdrop-blur-sm text-gray-700 rounded-2xl hover:bg-gray-200/80 transition-all duration-200 font-medium"
                            onClick={handleBackClick}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Update Package
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <IncludeProductModal
                isOpen={showProductModal}
                onClose={() => {
                    setShowProductModal(false)
                }}
                selectedProducts={selectedProducts}
                onSelectProduct={updateSelectedProducts}
                onRemoveProduct={handleRemoveProduct}
            />
        </div>
    )
}

export default EditPackage
