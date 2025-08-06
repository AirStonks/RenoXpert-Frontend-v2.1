"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import Loading from "../../components/Loading"
import useFetchOrder from "../../hook/useFetchOrder"
import { KTAccordion, KTModal, KTTooltip } from "../../metronic/core"
import type { Order, OrderQuotation, Package } from "../../types"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import ClipboardJS from "clipboard"
import { Slide, toast } from "react-toastify"
import { releaseOrder, reReleaseOrder, toggleBePowered, updateOrderInternalRemark, voidOrder } from "../../services/api"
import ConfirmOrderModal from "./components/ConfirmOrderModal"
import ReReleaseOrderModal from "./components/ReReleaseOrderModal"
import VoidQuotationModal from "./components/VoidQuotationModal"
import OrderPreviewModal from "./components/OrderPreviewModal"

const LOCAL_PATH_PREFIX = window.location.hostname === "localhost" ? "/staff/" : "/"

const CLIENT_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_CLIENT_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_CLIENT_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? "localhost:5173/owner/"
                : null

const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${day} ${monthNames[Number.parseInt(month) - 1]} ${year}`
}

const categoryOptions = [
    { value: "renovation", label: "Renovation" },
    { value: "partition", label: "Partition" },
    { value: "smart_iot", label: "Smart IoT" },
    { value: "project_management", label: "Project Management" },
    { value: "electrical_appliances", label: "Electrical Appliances" },
    { value: "air_conditioning", label: "Air Conditioning" },
    { value: "others", label: "Others" },
]

function OrderDetail() {
    const navigate = useNavigate()
    const { state } = useLocation()
    const { id } = useParams<{ id: string }>()
    const orderId = id ? Number.parseInt(id, 10) : null

    const { orderDetail: order, loading, error, refetch } = useFetchOrder(orderId)
    const [orderDetail, setOrderDetail] = useState<Order | null>(null)
    const [packageCategories, setPackageCategories] = useState<
        { category: string; total_price: number; cogs: number; quantity: number }[]
    >([])
    const [totalExcludedAddonAmount, setTotalExcludedAddonAmount] = useState<number>(0)

    const [isEditingInternalRemark, setIsEditingInternalRemark] = useState(false)
    const [isEditingBePowered, setIsEditingBePowered] = useState(false)
    const [editableInternalRemark, setEditableInternalRemark] = useState("")
    const [editableBePowered, setEditableBePowered] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({})

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

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

    useEffect(() => {
        document.title = "Quotation Order Detail | RenoXpert"

        KTAccordion.init()
        KTTooltip.init()

        setIsLoading(loading)

        if (order) {
            setOrderDetail(order)
        } else if (!loading && !order && !error) {
            setOrderDetail(null)
        }
    }, [order, loading, error])

    useEffect(() => {
        if (!orderDetail?.latest_quotation?.packages) return

        let addonCounter = 0

        const packages: Package[] = orderDetail.latest_quotation.packages

        const categoryTotals = packages.reduce((acc, pkg) => {
            if (pkg.is_addon === true && pkg.is_addon_included === false) {
                return acc;
            }

            let category;
            if (pkg.is_addon === true) {
                addonCounter += 1;
                category = `Add-on Option ${addonCounter} (${pkg.name})`;
            } else {
                category = pkg.category || 'others';
            }

            const categoryData = pkg.products?.reduce(
                (data, product) => {
                    let supplyPrice = 0;
                    let installPrice = 0;
                    let supplyCogs = 0;
                    let installCogs = 0;

                    if (product.provisioning?.supply) {
                        if (product.pivot?.includeSupply) {
                            supplyPrice = (product.provisioning.supply.retail_price || 0) * (product.pivot.quantity || 1);
                            supplyCogs = (product.provisioning.supply.cogs || 0) * (product.pivot.quantity || 1);
                        } else {
                            supplyPrice = Math.max(0,
                                (product.provisioning.supply.retail_price || 0) -
                                (product.provisioning.supply.excluded_price || 0)
                            ) * (product.pivot?.quantity || 1);
                        }
                    }

                    if (product.provisioning?.install) {
                        if (product.pivot?.includeInstall) {
                            installPrice = (product.provisioning.install.retail_price || 0) * (product.pivot?.quantity || 1);
                            installCogs = (product.provisioning.install.cogs || 0) * (product.pivot?.quantity || 1);
                        } else {
                            installPrice = Math.max(0,
                                (product.provisioning.install.retail_price || 0) -
                                (product.provisioning.install.excluded_price || 0)
                            ) * (product.pivot?.quantity || 1);
                        }
                    }

                    return {
                        total_price: data.total_price + supplyPrice + installPrice,
                        cogs: data.cogs + supplyCogs + installCogs,
                    };
                },
                { total_price: 0, cogs: 0 }
            ) || { total_price: pkg.total_price || 0, cogs: 0 };

            const categoryTotalPrice = orderDetail.is_be_powered ? (pkg.markup_amount * (pkg.quantity || 1)) : (categoryData.total_price * (pkg.quantity || 1));
            const categoryCogs = categoryData.cogs * (pkg.quantity || 1);

            if (!acc[category]) {
                acc[category] = { total_price: 0, cogs: 0, quantity: 0 };
            }
            acc[category].total_price += categoryTotalPrice;
            acc[category].cogs += categoryCogs;
            acc[category].quantity += pkg.quantity || 1;

            return acc;
        }, {} as Record<string, { total_price: number; cogs: number; quantity: number }>);

        const categoriesArray = Object.entries(categoryTotals).map(([category, { total_price, cogs, quantity }]) => ({
            category: category.startsWith('Add-on Option')
                ? category
                : categoryOptions.find(option => option.value === category)?.label || category,
            total_price,
            cogs,
            quantity,
        }));

        const sortedCategories = [
            ...categoriesArray.filter(item => !item.category.startsWith('Add-on Option')),
            ...categoriesArray.filter(item => item.category.startsWith('Add-on Option')),
        ];

        setPackageCategories(sortedCategories)

        if (orderDetail.latest_quotation.packages.length > 0) {
            KTAccordion.createInstances()
        }
    }, [orderDetail?.latest_quotation?.packages])

    useEffect(() => {
        if (orderDetail) {
            const totalRetailPrice = orderDetail.final_amount
                ? orderDetail.final_amount
                : orderDetail.latest_quotation.packages.reduce((total, pkg) => {
                    if (pkg.is_addon === true && pkg.is_addon_included === false) {
                        return total
                    }

                    const packageRetail = pkg.products.reduce((pkgTotal, product) => {
                        let supplyPrice = 0
                        if (product.pivot.includeSupply) {
                            supplyPrice = product.provisioning.supply.retail_price * product.pivot.quantity || 0
                        } else {
                            supplyPrice = product.provisioning.supply.retail_price - product.provisioning.supply.excluded_price || 0
                        }

                        let installPrice = 0
                        if (product.pivot.includeInstall) {
                            installPrice = product.provisioning.install.retail_price * product.pivot.quantity || 0
                        } else {
                            installPrice =
                                product.provisioning.install.retail_price - product.provisioning.install.excluded_price || 0
                        }

                        return pkgTotal + (supplyPrice + installPrice)
                    }, 0)
                    return total + packageRetail * (pkg.quantity || 1)
                }, 0)

            setTotalExcludedAddonAmount(totalRetailPrice)

            const clipboard = new ClipboardJS(".copy-link")

            clipboard.on("success", (e) => {
                notify("success", "Copied to clipboard!")
                e.clearSelection()
            })

            return () => {
                clipboard.destroy()
            }
        }
    }, [orderDetail])

    useEffect(() => {
        if (orderDetail) {
            setOpenAccordions(() => {
                const initialState: { [key: string]: boolean } = {}
                if (orderDetail) {
                    orderDetail.latest_quotation.packages.forEach((_, index) => {
                        initialState[`content_${index}`] = false
                    })
                }
                return initialState
            })

            setOpenAccordions((prev) => ({
                ...prev,
                property: false,
            }))
        }
    }, [orderDetail])

    // Toggle dropdown visibility
    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!orderId) return null

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl)
        } else {
            navigate(LOCAL_PATH_PREFIX + "orders")
        }
    }

    const handleReleaseOrder = async () => {
        setIsLoading(true)
        try {
            const response = await releaseOrder(orderId)

            if (response?.success) {
                notify("success", "Order released successfully!")
                refetch()
            }
        } catch (error) {
            console.error(error)
        }
        setIsLoading(false)
    }

    const handleEditInternalRemark = () => {
        setEditableInternalRemark(orderDetail.internal_remark || "")
        setIsEditingInternalRemark(true)
    }

    const handleEditBePowered = () => {
        setEditableBePowered(orderDetail.is_be_powered)
        setIsEditingBePowered(true)
    }

    const handleChangeInternalRemark = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditableInternalRemark(event.target.value)
    }

    const handleChangeBePowered = async () => {
        setEditableBePowered(!editableBePowered)

        try {
            const response = await toggleBePowered(orderId)

            if (response?.success) {
                notify("success", "Be powered updated!")
                setOrderDetail((orderDetail) =>
                    orderDetail ? { ...orderDetail, is_be_powered: !orderDetail.is_be_powered } : null,
                )
            }
        } catch (error) {
            console.error(error)
            notify("error", "Error occurred while updating be powered.")
        }
    }

    const handleSaveInternalRemark = async () => {
        setIsLoading(true)

        try {
            const response = await updateOrderInternalRemark(orderId, editableInternalRemark)

            if (response?.success) {
                setIsEditingInternalRemark(false)
                refetch()
                notify("success", "Internal remark updated!")
            }
        } catch (error) {
            console.error(error)
            notify("error", "Error occurred while saving internal remark.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleReReleaseOrder = async () => {
        setIsLoading(true)

        try {
            const response = await reReleaseOrder(orderId)

            if (response?.success) {
                notify("success", "Order re-released successfully!")
            }
        } catch (error) {
            notify("error", "Failed to re-release order.")
        } finally {
            const modalEl = document.querySelector("#re_release_order_modal") as HTMLElement
            const modal = KTModal.getInstance(modalEl)
            modal.hide()

            setIsLoading(false)
            refetch()
        }
    }

    const handleVoidQuotation = async () => {
        setIsLoading(true)

        try {
            const response = await voidOrder(orderId)

            if (response?.success) {
                notify("success", "Order voided successfully!")
            }
        } catch (error) {
            notify("error", "Failed to re-release order.")
        } finally {
            const modalEl = document.querySelector("#void_quotation_modal") as HTMLElement
            const modal = KTModal.getInstance(modalEl)
            modal.hide()

            setIsLoading(false)
            refetch()
        }
    }

    if (error) return <div>{error}</div>
    if (!orderDetail) return <div>Order not found</div>

    const selectedQuotation = orderDetail.latest_quotation
    const selectedPackages = orderDetail.latest_quotation.packages

    const calculateQuotationMargin = () => {
        const totalRetailPrice = orderDetail.final_amount
            ? orderDetail.final_amount
            : selectedPackages.reduce((total, pkg) => {
                if (pkg.is_addon === true && pkg.is_addon_included === false) {
                    return total
                }

                const packageRetail = pkg.products.reduce((pkgTotal, product) => {
                    let supplyPrice = 0
                    if (product.pivot.includeSupply) {
                        supplyPrice = product.provisioning.supply.retail_price * product.pivot.quantity || 0
                    } else {
                        supplyPrice = product.provisioning.supply.retail_price - product.provisioning.supply.excluded_price || 0
                    }

                    let installPrice = 0
                    if (product.pivot.includeInstall) {
                        installPrice = product.provisioning.install.retail_price * product.pivot.quantity || 0
                    } else {
                        installPrice =
                            product.provisioning.install.retail_price - product.provisioning.install.excluded_price || 0
                    }

                    return pkgTotal + (supplyPrice + installPrice)
                }, 0)
                return total + packageRetail * (pkg.quantity || 1)
            }, 0)

        const totalDiscountPrice = Number(selectedQuotation.bonus?.value || 0)

        const totalCogs = selectedPackages.reduce((total, pkg) => {
            if (pkg.is_addon === true && pkg.is_addon_included === false) {
                return total
            }

            const packageCogs = pkg.products.reduce((pkgTotal, product) => {
                const supplyCogs = product.pivot.includeSupply ? product.provisioning.supply.cogs * product.pivot.quantity : 0
                const installCogs = product.pivot.includeInstall
                    ? product.provisioning.install.cogs * product.pivot.quantity
                    : 0
                return pkgTotal + (supplyCogs + installCogs)
            }, 0)
            return total + packageCogs * (pkg.quantity || 1)
        }, 0)

        const marginInAmount = totalRetailPrice - totalCogs
        const marginInPercentage = totalRetailPrice > 0 ? (marginInAmount / totalRetailPrice) * 100 : 0

        return {
            totalCogs,
            marginInAmount,
            marginInPercentage,
        }
    }

    const calculatePackageTotal = (pkg: Package) => {
        const packageTotal = pkg.products.reduce((prodSum, product) => {
            let supplyPrice = 0
            let installPrice = 0

            if (product.provisioning?.supply) {
                if (product.pivot?.includeSupply) {
                    supplyPrice = (product.provisioning.supply.retail_price || 0) * (product.pivot.quantity || 1)
                } else {
                    supplyPrice =
                        Math.max(
                            0,
                            (product.provisioning.supply.retail_price || 0) - (product.provisioning.supply.excluded_price || 0),
                        ) * (product.pivot?.quantity || 1)
                }
            }

            if (product.provisioning?.install) {
                if (product.pivot?.includeInstall) {
                    installPrice = (product.provisioning.install.retail_price || 0) * (product.pivot?.quantity || 1)
                } else {
                    installPrice =
                        Math.max(
                            0,
                            (product.provisioning.install.retail_price || 0) - (product.provisioning.install.excluded_price || 0),
                        ) * (product.pivot?.quantity || 1)
                }
            }

            return prodSum + supplyPrice + installPrice
        }, 0)

        return packageTotal * (pkg.quantity || 1)
    }

    const calculateSummaryTotals = (totalAmount: number) => {
        const totalCogs = packageCategories.reduce((sum, cat) => sum + cat.cogs, 0);
        const marginInAmount = totalAmount - totalCogs;
        const marginInPercentage = totalAmount > 0 ? (marginInAmount / totalAmount) * 100 : 0;

        const discount = selectedQuotation.bonus ? Number(selectedQuotation.bonus.value) : 0
        const nettAmount = totalAmount - discount;
        const nettMargin = nettAmount - totalCogs;
        const nettMarginPercentage = nettAmount > 0 ? (nettMargin / nettAmount) * 100 : 0;

        return {
            totalCogs,
            marginInAmount,
            marginInPercentage,
            discount,
            nettAmount,
            nettMargin,
            nettMarginPercentage,
        };
    };

    const { totalCogs, marginInAmount, marginInPercentage } = calculateQuotationMargin()

    const discount = selectedQuotation.bonus ? Number(selectedQuotation.bonus.value) : 0
    const nettAmount = totalExcludedAddonAmount - discount
    const nettMargin = nettAmount - totalCogs
    const nettMarginPercentage = nettAmount > 0 ? (nettMargin / nettAmount) * 100 : 0

    const upfrontAmount = selectedPackages.reduce((acc, pkg) => acc + (
        orderDetail.is_be_powered &&
            pkg.payment_method === "one-off" &&
            (pkg.is_addon ? pkg.is_addon_included === true : true)
            ? (pkg.markup_amount ? pkg.markup_amount : pkg.total_price) * (pkg.quantity || 1)
            : 0)
        , orderDetail.be_powered_base_price || 0);


    const monthlySum = selectedPackages.reduce((acc, pkg) => acc + (
        orderDetail.is_be_powered &&
            pkg.payment_method !== 'one-off' &&
            (pkg.is_addon ? pkg.is_addon_included === true : true)
            ? pkg.monthly_amount * (pkg.quantity || 1)
            : 0)
        , 0);


    const calculatedTotalAmount = packageCategories.reduce((sum, cat) => sum + cat.total_price, 0);
    const summaryTotals = calculateSummaryTotals(calculatedTotalAmount);

    return (
        <>
            {isLoading && <Loading />}

            {/* iOS-style Header */}
            <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 px-6 py-4 mb-8">
                <div className="flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <button
                            className="w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center transition-all duration-200 active:scale-95"
                            onClick={handleBackClick}
                        >
                            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 -tracking-wide">Quotation Order Detail</h1>
                            <p className="text-sm text-gray-500 mt-1">Order #{orderDetail?.order_no}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {orderDetail?.status === "unreleased" && (
                            <button
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                                onClick={handleReleaseOrder}
                            >
                                Release Order
                            </button>
                        )}
                        {orderDetail?.status === "released" && (
                            <button
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                                data-modal-toggle="#confirm_order_modal"
                            >
                                Confirm Order
                            </button>
                        )}
                        {orderDetail?.status === "voided" && (
                            <button
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                                data-modal-toggle="#re_release_order_modal"
                            >
                                Re-release Order
                            </button>
                        )}
                        {orderDetail?.status !== "confirmed" && (
                            <Link
                                to={LOCAL_PATH_PREFIX + `orders/edit/${orderId}`}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id={orderId}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                                Edit Order
                            </Link>
                        )}

                        <div className="relative">
                            <button
                                ref={buttonRef}
                                className="w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center transition-all duration-200 active:scale-95"
                                onClick={toggleDropdown}
                            >
                                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                            </button>

                            {isDropdownOpen && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute right-0 mt-2 w-64 bg-white/95 border border-gray-200 backdrop-blur-xl rounded-2xl shadow-xl py-2 z-50"
                                >
                                    {orderDetail?.user && (
                                        <button
                                            className="w-full px-4 p-3 text-left hover:bg-gray-50/80 transition-colors duration-200 flex items-center gap-3 copy-link"
                                            data-clipboard-text={`${CLIENT_URL}order/overview/id/${orderId}`}
                                        >
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <span className="text-sm text-gray-700">Copy Quotation Link</span>
                                        </button>
                                    )}
                                    <Link
                                        to={`${LOCAL_PATH_PREFIX}orders/create?dp=${orderId}`}
                                        className="w-full px-4 p-3 text-left hover:bg-gray-50/80 transition-colors duration-200 flex items-center gap-3"
                                        target="_blank"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                                            />
                                        </svg>
                                        <span className="text-sm text-gray-700">Duplicate Order</span>
                                    </Link>
                                    <button
                                        className="w-full px-4 p-3 text-left hover:bg-gray-50/80 transition-colors duration-200 flex items-center gap-3"
                                        data-modal-toggle="#preview_order_modal"
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span className="text-sm text-gray-700">Preview in Owner View</span>
                                    </button>
                                    <Link
                                        to={`${LOCAL_PATH_PREFIX}orders/print/${orderId}`}
                                        className="w-full px-4 p-3 text-left hover:bg-gray-50/80 transition-colors duration-200 flex items-center gap-3"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <span className="text-sm text-gray-700">Print Quotation</span>
                                    </Link>
                                    <Link
                                        to={`${LOCAL_PATH_PREFIX}orders/print/${orderId}/internal`}
                                        className="w-full px-4 p-3 text-left hover:bg-gray-50/80 transition-colors duration-200 flex items-center gap-3"
                                        onClick={() => setIsDropdownOpen(false)}
                                    >
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <span className="text-sm text-gray-700">Internal Quotation PDF</span>
                                    </Link>
                                    {orderDetail?.status === 'released' && (
                                        <button
                                            className="w-full px-4 p-3 text-left hover:bg-red-50/80 transition-colors duration-200 flex items-center gap-3 text-red-600"
                                            data-modal-toggle="#void_quotation_modal"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            <span className="text-sm">Void Quotation</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full mx-auto px-6 pb-8">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Column - Order Details */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* Owner Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200/50">
                                <h3 className="text-lg font-semibold text-gray-900">Owner</h3>
                            </div>
                            <div className="p-6">
                                {orderDetail.user ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Name:</span>
                                            <span className="text-sm font-medium text-gray-900">{orderDetail.user.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Email:</span>
                                            <span className="text-sm font-medium text-gray-900">{orderDetail.user.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Phone:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                +{orderDetail.user.country_code} {orderDetail.user.phone_no}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-500">N/A</span>
                                )}
                            </div>
                        </div>

                        {/* General Info Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200/50">
                                <h3 className="text-lg font-semibold text-gray-900">General Info</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">QUO No:</span>
                                        <span className="text-sm font-medium text-gray-900">{orderDetail.order_no}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Original Amount:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            RM{" "}
                                            {totalExcludedAddonAmount.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                    {orderDetail.final_amount && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Final Amount:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                RM{" "}
                                                {orderDetail.final_amount.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    {selectedQuotation.bonus && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Discount Amount:</span>
                                            <span className="text-sm font-medium text-red-600">
                                                - RM{" "}
                                                {Number(selectedQuotation.bonus.value).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Nett Amount:</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            RM {summaryTotals.nettAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Status:</span>
                                        <span
                                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${orderDetail.status === "released"
                                                ? "bg-blue-100 text-blue-800"
                                                : orderDetail.status === "confirmed"
                                                    ? "bg-green-100 text-green-800"
                                                    : orderDetail.status === "revoked" || orderDetail.status === "voided"
                                                        ? "bg-red-100 text-red-800"
                                                        : orderDetail.status === "draft"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {orderDetail.status === "confirmed" ? "sale" : orderDetail.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Version:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {orderDetail.latest_quotation.version
                                                ? String.fromCharCode(64 + orderDetail.latest_quotation.version)
                                                : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Released Date:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {orderDetail.released_at ? formatDate(orderDetail.released_at) : "N/A"}
                                        </span>
                                    </div>
                                    {orderDetail.status === "confirmed" && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Agreed Date:</span>
                                            <span className="text-sm font-medium text-gray-900">{formatDate(orderDetail.confirmed_at)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Updated Date:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatDate(orderDetail.latest_quotation.created_at)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Updated by:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {orderDetail.latest_quotation.created_by.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Installment Plan Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200/50 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Installment Plan</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Status:</span>
                                        {isEditingBePowered ? (
                                            <button
                                                onClick={handleChangeBePowered}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${editableBePowered ? "bg-blue-500" : "bg-gray-200"
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${editableBePowered ? "translate-x-6" : "translate-x-1"
                                                        }`}
                                                />
                                            </button>
                                        ) : (
                                            <span
                                                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${orderDetail.is_be_powered ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                    }`}
                                            >
                                                {orderDetail.is_be_powered ? "Active" : "Inactive"}
                                            </span>
                                        )}
                                    </div>
                                    {orderDetail.is_be_powered &&
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Tenure:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {orderDetail.tenure} months
                                            </span>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Internal Remark Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200/50 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Internal Remark</h3>
                                {!isEditingInternalRemark && (
                                    <button
                                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-all duration-200 active:scale-95"
                                        onClick={handleEditInternalRemark}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            <div className="p-6">
                                {isEditingInternalRemark ? (
                                    <div className="space-y-4">
                                        <textarea
                                            className="w-full h-32 px-4 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={editableInternalRemark || ""}
                                            onChange={handleChangeInternalRemark}
                                            placeholder="Enter internal remark..."
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all duration-200 active:scale-95"
                                                onClick={() => setIsEditingInternalRemark(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all duration-200 active:scale-95"
                                                onClick={handleSaveInternalRemark}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-700">
                                        {orderDetail.internal_remark || <span className="text-gray-500">N/A</span>}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Discount/Bonus Card */}
                        <div className="bg-blue-50/80 backdrop-blur-xl rounded-2xl border border-blue-200/50 shadow-sm">
                            <div className="px-6 py-4 border-b border-blue-200/50">
                                <h3 className="text-lg font-semibold text-blue-900">Discount/Bonus</h3>
                            </div>
                            <div className="p-6">
                                {selectedQuotation.bonus ? (
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-sm text-blue-700 font-medium">Description:</span>
                                            <div className="mt-2">
                                                {selectedQuotation.bonus.description ? (
                                                    <ul className="text-sm text-blue-800 space-y-1">
                                                        {selectedQuotation.bonus.description.split("\n").map((item, index) => (
                                                            <li key={index} className="flex items-start">
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-sm text-blue-600">No Details</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-blue-700 font-medium">Value:</span>
                                            <span className="text-sm font-semibold text-blue-900">
                                                RM{" "}
                                                {Number(selectedQuotation.bonus.value).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-blue-600">N/A</span>
                                )}
                            </div>
                        </div>

                        {/* Property Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200/50">
                                <h3 className="text-lg font-semibold text-gray-900">Property</h3>
                            </div>
                            <div className="p-6">
                                {orderDetail.property ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Property Name:</span>
                                            <span className="text-sm font-medium text-gray-900">{orderDetail.property.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Unit:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Unit Type:</span>
                                            <span className="text-sm font-medium text-gray-900">{orderDetail.unit_type || "-"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Address:</span>
                                            <span className="text-sm font-medium text-gray-900 text-right max-w-xs">
                                                {[
                                                    orderDetail.property.address,
                                                    orderDetail.property.street,
                                                    orderDetail.property.postcode,
                                                    orderDetail.property.city,
                                                    orderDetail.property.state,
                                                ]
                                                    .filter(Boolean)
                                                    .join(", ")}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Bedrooms:</span>
                                                <span className="text-sm font-medium text-gray-900">{orderDetail.bedroom_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Bathrooms:</span>
                                                <span className="text-sm font-medium text-gray-900">{orderDetail.bathroom_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Single Beds:</span>
                                                <span className="text-sm font-medium text-gray-900">{orderDetail.single_bedroom_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Queen Beds:</span>
                                                <span className="text-sm font-medium text-gray-900">{orderDetail.queen_bedroom_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Studios:</span>
                                                <span className="text-sm font-medium text-gray-900">{orderDetail.studio_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Partition:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {orderDetail.include_partition ? "Yes" : "No"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-500">N/A</span>
                                )}
                            </div>
                        </div>

                        {/* Reno Agreement Detail Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200/50">
                                <h3 className="text-lg font-semibold text-gray-900">Reno Agreement Detail</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Completion Day(s):</span>
                                        <span className="text-sm font-medium text-gray-900">{orderDetail.completion_day} Working Days</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Payment Schedule:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {orderDetail.is_progressive_payment ? "Progressive Payment" : "Full Payment"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Revision History Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200/50">
                                <h3 className="text-lg font-semibold text-gray-900">Revision History</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3">
                                    {orderDetail.order_quotations.length > 0 ? (
                                        orderDetail.order_quotations
                                            .slice()
                                            .reverse()
                                            .map((orderQuotation: OrderQuotation, index: number) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-200/50"
                                                >
                                                    <div className="flex flex-col">
                                                        <Link
                                                            to={LOCAL_PATH_PREFIX + `orders/${orderDetail.id}/ver/${orderQuotation.version}`}
                                                            className="text-orange-600 hover:text-orange-700 font-semibold text-sm transition-colors duration-200"
                                                        >
                                                            {orderDetail.order_no}-{String.fromCharCode(64 + orderQuotation.version)}
                                                        </Link>
                                                        <span className="text-xs text-gray-500 mt-1">
                                                            Updated: <span className="font-medium">{orderQuotation.updated_at}</span>
                                                        </span>
                                                        <span className="text-xs text-gray-600">
                                                            By: <span className="font-medium">{orderQuotation.created_by.name}</span>
                                                        </span>
                                                    </div>
                                                    <button className="px-3 py-1.5 bg-gray-200 text-gray-500 text-xs font-medium rounded-lg cursor-not-allowed">
                                                        Revise
                                                    </button>
                                                </div>
                                            ))
                                    ) : (
                                        <div className="text-sm text-gray-500">No Revision History on this Quotation Order</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary & Packages */}
                    <div className="xl:col-span-9 space-y-6">
                        {/* Summary Pricing Card */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200/50">
                                <h3 className="text-lg font-semibold text-gray-900">Summary Pricing</h3>
                            </div>
                            <div className="p-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200/50">
                                                <th className="text-left text-sm font-medium text-gray-600 p-3">Category</th>
                                                <th className="text-right text-sm font-medium text-gray-600 p-3">Total Price</th>
                                                <th className="text-right text-sm font-medium text-gray-600 p-3">COGS</th>
                                                <th className="text-right text-sm font-medium text-gray-600 p-3">Nett Margin</th>
                                                <th className="text-right text-sm font-medium text-gray-600 p-3">Margin %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {packageCategories.map((category, index) => {
                                                const categoryMargin = category.total_price - category.cogs
                                                const categoryMarginPercentage =
                                                    category.total_price > 0 ? (categoryMargin / category.total_price) * 100 : 0

                                                return (
                                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors duration-200 p-2">
                                                        <td className="p-3 text-sm text-gray-700">{category.category}</td>
                                                        <td className="p-3 text-sm font-medium text-gray-900 text-right">
                                                            RM{" "}
                                                            {category.total_price.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                        <td className="p-3 text-sm font-medium text-gray-900 text-right">
                                                            RM{" "}
                                                            {category.cogs.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                        <td className="p-3 text-sm font-medium text-gray-900 text-right">
                                                            RM{" "}
                                                            {categoryMargin.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                        <td className="p-3 text-sm font-medium text-gray-900 text-right">
                                                            {categoryMarginPercentage.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                            %
                                                        </td>
                                                    </tr>
                                                )
                                            })}

                                            {/* Total Row */}
                                            <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                                                <td className="p-3 text-sm font-semibold text-gray-900">Total</td>
                                                <td className="p-3 text-sm font-semibold text-gray-900 text-right">
                                                    RM{" "}
                                                    {calculatedTotalAmount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td className="p-3 text-sm font-semibold text-gray-900 text-right">
                                                    RM{" "}
                                                    {summaryTotals.totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3 text-sm font-semibold text-gray-900 text-right">
                                                    RM{" "}
                                                    {summaryTotals.marginInAmount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td className="p-3 text-sm font-semibold text-gray-900 text-right">
                                                    {summaryTotals.marginInPercentage.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                    %
                                                </td>
                                            </tr>

                                            {/* Bonus/Discount Row */}
                                            {selectedQuotation.bonus && (
                                                <tr className="bg-red-50/50">
                                                    <td className="p-3 text-sm text-gray-700">Bonus/Discount</td>
                                                    <td className="p-3 text-sm font-medium text-red-600 text-right">
                                                        - RM{" "}
                                                        {Number(selectedQuotation.bonus.value).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </td>
                                                    <td className="p-3 text-sm text-gray-500 text-right">-</td>
                                                    <td className="p-3 text-sm font-medium text-red-600 text-right">
                                                        - RM{" "}
                                                        {Number(selectedQuotation.bonus.value).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </td>
                                                    <td className="p-3 text-sm font-medium text-red-600 text-right">
                                                        -{" "}
                                                        {(marginInPercentage - nettMarginPercentage).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                        %
                                                    </td>
                                                </tr>
                                            )}

                                            {/* Nett Amount Row */}
                                            <tr className="border-t-2 border-blue-200 bg-blue-50/50">
                                                <td className="p-3 text-sm font-bold text-blue-900">Nett Amount</td>
                                                <td className="p-3 text-sm font-bold text-blue-900 text-right">
                                                    RM{" "}
                                                    {summaryTotals.nettAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3 text-sm font-bold text-blue-900 text-right">
                                                    RM{" "}
                                                    {summaryTotals.totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3 text-sm font-bold text-blue-900 text-right">
                                                    RM{" "}
                                                    {summaryTotals.nettMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3 text-sm font-bold text-blue-900 text-right">
                                                    {summaryTotals.nettMarginPercentage.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                    %
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Installment Detail Card */}
                        {orderDetail.is_be_powered &&
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm">
                                <div className="px-6 py-4 border-b border-gray-200/50">
                                    <h3 className="text-lg font-semibold text-gray-900">Installment Detail</h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-medium text-gray-900">Original Nett Amount</span>
                                            </div>
                                            <span className="font-medium">RM {nettAmount.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                            </span>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-900">Upfront Payment</span>
                                                <span className="font-medium">RM {upfrontAmount.toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })}</span>
                                            </div>

                                            <div className="flex justify-between items-center text-gray-600 mt-1">
                                                <span>Base Price</span>
                                                <span>RM {orderDetail.be_powered_base_price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                            </div>

                                            {selectedPackages.filter(pkg =>
                                                orderDetail.is_be_powered &&
                                                pkg.payment_method === 'one-off' &&
                                                (pkg.is_addon ? pkg.is_addon_included === true : true)
                                            ).map((pkg, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center text-gray-600 mt-1"
                                                >
                                                    <div className="flex items-center">
                                                        <span>{pkg.name} x{pkg.quantity || 1}</span>
                                                        {pkg.is_addon && (
                                                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                                Add-On
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span>RM {(pkg.markup_amount * (pkg.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-900">Installment ({orderDetail.tenure} months)</span>
                                                <span className="font-medium">RM {(orderDetail.installment_method === 'fixed' ? orderDetail.installment_amount : monthlySum).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })}/mth</span>
                                            </div>

                                            {orderDetail.installment_method === 'fixed'
                                                ? (
                                                    <div className="flex justify-between items-center text-gray-600 mt-1">
                                                        <div className="flex items-center">
                                                            <span>Installment method fixed</span>
                                                        </div>
                                                        <span>Fixed</span>
                                                    </div>
                                                ) : selectedPackages.filter(pkg =>
                                                    orderDetail.is_be_powered &&
                                                    pkg.payment_method !== 'one-off' &&
                                                    (pkg.is_addon ? pkg.is_addon_included === true : true)
                                                ).map((pkg, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex justify-between items-center text-gray-600 mt-1"
                                                    >
                                                        <div className="flex items-center">
                                                            <span>{pkg.name} x{pkg.quantity || 1}</span>
                                                            {pkg.is_addon && (
                                                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                                    Add-On
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span>RM {(pkg.monthly_amount * (pkg.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mth</span>
                                                    </div>
                                                ))}
                                        </div>

                                        {orderDetail?.latest_quotation?.bonus &&
                                            <div>
                                                <div className="flex justify-between items-center text-red-600">
                                                    <span className="font-medium">Bonus</span>
                                                    <span className="font-medium">- RM {Number(orderDetail?.latest_quotation?.bonus.value).toLocaleString(undefined, {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0
                                                    })}</span>
                                                </div>
                                            </div>
                                        }

                                        {/* Installment Plan Total Pricing */}
                                        <div className="flex flex-col mt-2 pt-2 border-t border-gray-200">
                                            <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                                                <span>Total</span>
                                                <span>RM {(upfrontAmount - (Number(orderDetail?.latest_quotation?.bonus?.value) || 0)).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })} + (RM {orderDetail.installment_method === 'fixed' ? orderDetail.installment_amount : monthlySum.toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })} / month)</span>
                                            </div>

                                            <div className="flex justify-between items-center text-green-600 mt-1">
                                                <span>EPP (36 months)</span>
                                                <span>RM {((upfrontAmount * 1.105) / 36).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })}/mth</span>
                                            </div>

                                            <div className="flex justify-between items-center text-green-600 mt-1">
                                                <span>EPP (60 months)</span>
                                                <span>RM {((upfrontAmount * 1.14) / 60).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                })}/mth</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }

                        {/* Packages Section - Maintaining exact structure as requested */}
                        {selectedQuotation && (
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-sm">
                                <div className="px-6 py-4 border-b border-gray-200/50">
                                    <h3 className="text-lg font-semibold text-gray-900">Packages</h3>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-col gap-5" data-accordion="true">
                                        {(() => {
                                            let packageCounter = 0
                                            let addonCounter = 0

                                            return selectedPackages.map((prodPackage: Package) => {
                                                const isAddon = prodPackage.is_addon
                                                const counter = isAddon ? addonCounter++ : packageCounter++
                                                const label = isAddon
                                                    ? `ADD-ON OPTIONAL ${counter + 1}: \n${prodPackage.name}`
                                                    : prodPackage.name

                                                // Calculate totals for each column
                                                const totals = prodPackage.products.reduce(
                                                    (acc, product) => {
                                                        if (!product.pivot.included) return acc
                                                        const supplyRRP = product.pivot.includeSupply
                                                            ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                            : 0
                                                        const installRRP = product.pivot.includeInstall
                                                            ? product.provisioning.install.retail_price * product.pivot.quantity
                                                            : 0
                                                        const supplyCOGS = product.pivot.includeSupply
                                                            ? product.provisioning.supply.cogs * product.pivot.quantity
                                                            : 0
                                                        const installCOGS = product.pivot.includeInstall
                                                            ? product.provisioning.install.cogs * product.pivot.quantity
                                                            : 0

                                                        return {
                                                            supplyRRP: acc.supplyRRP + supplyRRP,
                                                            installRRP: acc.installRRP + installRRP,
                                                            totalRRP: acc.totalRRP + supplyRRP + installRRP,
                                                            supplyCOGS: acc.supplyCOGS + supplyCOGS,
                                                            installCOGS: acc.installCOGS + installCOGS,
                                                            totalCOGS: acc.totalCOGS + supplyCOGS + installCOGS,
                                                        }
                                                    },
                                                    {
                                                        supplyRRP: 0,
                                                        installRRP: 0,
                                                        totalRRP: 0,
                                                        supplyCOGS: 0,
                                                        installCOGS: 0,
                                                        totalCOGS: 0,
                                                    },
                                                )

                                                // Calculate Margin % and Margin Amount
                                                const marginPercent =
                                                    totals.totalRRP !== 0
                                                        ? (((totals.totalRRP - totals.totalCOGS) / totals.totalRRP) * 100).toLocaleString(
                                                            undefined,
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            },
                                                        ) + "%"
                                                        : totals.totalCOGS > 0
                                                            ? "-100.00%"
                                                            : "0.00%"
                                                const marginAmount = (totals.totalRRP - totals.totalCOGS).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })

                                                return (
                                                    <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                                        <div
                                                            className="accordion-item active border rounded-xl w-full"
                                                            data-accordion-item="true"
                                                            id={"package_item_" + prodPackage.id.toString()}
                                                        >
                                                            <button
                                                                className="accordion-toggle flex justify-between p-4"
                                                                data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}
                                                            >
                                                                <div className="flex flex-col items-start">
                                                                    <span className="text-base text-gray-900 font-medium text-start">{label}</span>
                                                                    <ul className="text-sm text-gray-600 text-start">
                                                                        {prodPackage?.description?.split("\n").map((item, index) => (
                                                                            <li key={index} className="flex items-start">
                                                                                {item}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                    <span className="text-base text-gray-700">
                                                                        {orderDetail.is_be_powered && 
                                                                            <span>Original Amount: </span>
                                                                        }
                                                                        RM{" "}
                                                                        {calculatePackageTotal(prodPackage).toLocaleString(undefined, {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })}
                                                                    </span>
                                                                    {prodPackage.category && (
                                                                        <div className="badge text-sm">
                                                                            {categoryOptions.find((option) => option.value === prodPackage.category)?.label}
                                                                        </div>
                                                                    )}
                                                                    <span className="text-sm text-gray-600 font-medium text-start my-2">
                                                                        {prodPackage.description_internal && (
                                                                            <div className="flex items-center gap-2">
                                                                                <i className="ki-filled ki-information-2 text-warning text-xl"></i>
                                                                                <ul className="text-xs text-gray-500">
                                                                                    {prodPackage?.description_internal?.split("\n").map((item, index) => (
                                                                                        <li key={index} className="flex items-start">
                                                                                            {item}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="flex gap-4 items-center">
                                                                    <div className="flex flex-col gap-4">
                                                                        <div className="flex items-center justify-end gap-8">
                                                                            {prodPackage.is_addon && (
                                                                                <span className="text-gray-700 font-semibold py-2 px-4 bg-slate-200 rounded-md whitespace-nowrap">
                                                                                    {`Add-on Included: ${prodPackage.is_addon_included ? "Yes" : "No"}`}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-gray-600 font-semibold py-2 px-4 bg-gray-200 rounded-md whitespace-nowrap">
                                                                                Quantity: {prodPackage.quantity ? prodPackage.quantity : 1}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                                                                            {orderDetail.is_be_powered ? (
                                                                                <span>
                                                                                    RM{" "}
                                                                                    {prodPackage.markup_amount.toLocaleString(undefined, {
                                                                                        minimumFractionDigits: 0,
                                                                                        maximumFractionDigits: 0,
                                                                                    })}{" "}
                                                                                    (Markup Price)
                                                                                </span>
                                                                            ) : (
                                                                                <span>
                                                                                    RM{" "}
                                                                                    {totals.totalRRP.toLocaleString(undefined, {
                                                                                        minimumFractionDigits: 2,
                                                                                        maximumFractionDigits: 2,
                                                                                    })}{" "}
                                                                                    (Unit Price)
                                                                                </span>
                                                                            )}
                                                                            <span>x</span>
                                                                            <span>{prodPackage.quantity || 1} (Qty)</span>
                                                                            <span>=</span>
                                                                            {orderDetail.is_be_powered ? (
                                                                                <span className="font-semibold text-lg text-gray-800">
                                                                                    RM{" "}
                                                                                    {(prodPackage.markup_amount * (prodPackage.quantity || 1)).toLocaleString(undefined, {
                                                                                        minimumFractionDigits: 0,
                                                                                        maximumFractionDigits: 0,
                                                                                    })}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="font-semibold text-lg text-gray-800">
                                                                                    RM{" "}
                                                                                    {(totals.totalRRP * (prodPackage.quantity || 1)).toLocaleString(undefined, {
                                                                                        minimumFractionDigits: 2,
                                                                                        maximumFractionDigits: 2,
                                                                                    })}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {orderDetail.is_be_powered && (prodPackage.payment_method !== 'one-off' && prodPackage.payment_method !== 'base-price') && (prodPackage.is_addon ? prodPackage.is_addon_included === true : true) &&
                                                                            <div className="flex items-center justify-end">
                                                                                <span className="text-sm text-gray-600 mr-2">
                                                                                    Installment ({prodPackage.payment_method === 'fixed-installation' ? "Fixed" : "Dynamic"}) :
                                                                                </span>
                                                                                <span className="text-orange-700 font-semibold text-gray-800">RM {prodPackage.monthly_amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mth</span>
                                                                            </div>
                                                                        }
                                                                    </div>
                                                                    <div className="flex">
                                                                        <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                                        <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                            <div
                                                                className="accordion-content active border-t"
                                                                id={"package_content_" + prodPackage.id.toString()}
                                                            >
                                                                <div className="product-list flex flex-col">
                                                                    <table className="table align-middle text-gray-700 text-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th className="w-[10px] text-center">Supply</th>
                                                                                <th className="w-[10px] text-center">Install</th>
                                                                                <th className="w-[10px] text-center">No.</th>
                                                                                <th className="w-[450px]">Product</th>
                                                                                <th className="w-[10px] text-center"></th>
                                                                                <th className="w-[160px] text-center">Supplier</th>
                                                                                <th className="w-[100px] text-center">Quantity</th>
                                                                                <th className="w-[100px] whitespace-nowrap">Supply RRP</th>
                                                                                <th className="w-[100px] whitespace-nowrap">Install RRP</th>
                                                                                <th className="w-[100px] whitespace-nowrap">Total RRP</th>
                                                                                <th className="w-[100px] whitespace-nowrap">Supply COGS</th>
                                                                                <th className="w-[100px] whitespace-nowrap">Install COGS</th>
                                                                                <th className="w-[100px] whitespace-nowrap">Total COGS</th>
                                                                                <th className="w-[100px] whitespace-nowrap">Margin %</th>
                                                                                <th className="w-[100px] whitespace-nowrap">Margin Amount</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {prodPackage.products.map((product, index) => (
                                                                                <tr
                                                                                    key={product.id}
                                                                                    className={`${!product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                        ? "light:bg-orange-50 dark:bg-orange-950"
                                                                                        : ""
                                                                                        }`}
                                                                                >
                                                                                    <td>
                                                                                        <span></span>
                                                                                        <div className="flex flex-col items-center">
                                                                                            <input
                                                                                                className="checkbox"
                                                                                                name="supply"
                                                                                                type="checkbox"
                                                                                                checked={!!product.pivot.includeSupply}
                                                                                                readOnly
                                                                                            />
                                                                                        </div>
                                                                                    </td>
                                                                                    <td>
                                                                                        <div className="flex flex-col items-center">
                                                                                            <input
                                                                                                className="checkbox"
                                                                                                name="install"
                                                                                                type="checkbox"
                                                                                                checked={!!product.pivot.includeInstall}
                                                                                                readOnly
                                                                                            />
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="text-center">
                                                                                        <span>{index + 1}</span>
                                                                                    </td>
                                                                                    <td>
                                                                                        <div className="flex flex-col">
                                                                                            <span>{product.name}</span>
                                                                                            <span className="text-xs text-gray-500">
                                                                                                {!product.description || product.description === ""
                                                                                                    ? ""
                                                                                                    : [
                                                                                                        product.pivot.includeSupply && "Supply",
                                                                                                        product.pivot.includeInstall && "Install",
                                                                                                    ]
                                                                                                        .filter(Boolean)
                                                                                                        .join(" and ") +
                                                                                                    (product.description ? " " + product.description : "")}
                                                                                            </span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="text-center">
                                                                                        {!product.pivot.visibility && (
                                                                                            <i className="ki-solid ki-eye-slash text-2xl"></i>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="text-center">
                                                                                        <span>{product.supplier_name ? product.supplier_name : "-"}</span>
                                                                                    </td>
                                                                                    <td className="text-center text-lg">
                                                                                        <span className="mx-2 text-base">
                                                                                            {product.pivot.included
                                                                                                ? !product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                                    ? 0
                                                                                                    : product.pivot.quantity
                                                                                                : "0"}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                        {product.pivot.includeSupply &&
                                                                                            `RM ${product.provisioning.supply.retail_price.toLocaleString(undefined, {
                                                                                                minimumFractionDigits: 2,
                                                                                                maximumFractionDigits: 2,
                                                                                            })}`}
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                        {product.pivot.includeInstall &&
                                                                                            `RM ${product.provisioning.install.retail_price.toLocaleString(
                                                                                                undefined,
                                                                                                {
                                                                                                    minimumFractionDigits: 2,
                                                                                                    maximumFractionDigits: 2,
                                                                                                },
                                                                                            )}`}
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap font-semibold text-success">
                                                                                        {!product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                            ? null
                                                                                            : `RM ${(
                                                                                                (product.pivot.includeSupply
                                                                                                    ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                                                                    : 0) +
                                                                                                (product.pivot.includeInstall
                                                                                                    ? product.provisioning.install.retail_price *
                                                                                                    product.pivot.quantity
                                                                                                    : 0)
                                                                                            ).toLocaleString(undefined, {
                                                                                                minimumFractionDigits: 2,
                                                                                                maximumFractionDigits: 2,
                                                                                            })}`}
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                        {product.pivot.includeSupply &&
                                                                                            `RM ${product.provisioning.supply.cogs.toLocaleString(undefined, {
                                                                                                minimumFractionDigits: 2,
                                                                                                maximumFractionDigits: 2,
                                                                                            })}`}
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                                                        {product.pivot.includeInstall &&
                                                                                            `RM ${product.provisioning.install.cogs.toLocaleString(undefined, {
                                                                                                minimumFractionDigits: 2,
                                                                                                maximumFractionDigits: 2,
                                                                                            })}`}
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap font-semibold text-danger">
                                                                                        {!product.pivot.includeSupply && !product.pivot.includeInstall
                                                                                            ? null
                                                                                            : `RM ${(
                                                                                                (product.pivot.includeSupply
                                                                                                    ? product.provisioning.supply.cogs * product.pivot.quantity
                                                                                                    : 0) +
                                                                                                (product.pivot.includeInstall
                                                                                                    ? product.provisioning.install.cogs * product.pivot.quantity
                                                                                                    : 0)
                                                                                            ).toLocaleString(undefined, {
                                                                                                minimumFractionDigits: 2,
                                                                                                maximumFractionDigits: 2,
                                                                                            })}`}
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap font-semibold">
                                                                                        {product.pivot.included
                                                                                            ? (() => {
                                                                                                const totalRRP =
                                                                                                    (product.pivot.includeSupply
                                                                                                        ? product.provisioning.supply.retail_price *
                                                                                                        product.pivot.quantity
                                                                                                        : 0) +
                                                                                                    (product.pivot.includeInstall
                                                                                                        ? product.provisioning.install.retail_price *
                                                                                                        product.pivot.quantity
                                                                                                        : 0)
                                                                                                const totalCOGS =
                                                                                                    (product.pivot.includeSupply
                                                                                                        ? product.provisioning.supply.cogs * product.pivot.quantity
                                                                                                        : 0) +
                                                                                                    (product.pivot.includeInstall
                                                                                                        ? product.provisioning.install.cogs * product.pivot.quantity
                                                                                                        : 0)
                                                                                                return product.pivot.includeSupply || product.pivot.includeInstall
                                                                                                    ? totalRRP !== 0
                                                                                                        ? `${(((totalRRP - totalCOGS) / totalRRP) * 100).toLocaleString(
                                                                                                            undefined,
                                                                                                            {
                                                                                                                minimumFractionDigits: 2,
                                                                                                                maximumFractionDigits: 2,
                                                                                                            },
                                                                                                        )}%`
                                                                                                        : totalCOGS > 0
                                                                                                            ? "-100.00%"
                                                                                                            : "0.00%"
                                                                                                    : ""
                                                                                            })()
                                                                                            : ""}
                                                                                    </td>
                                                                                    <td className="whitespace-nowrap font-semibold">
                                                                                        {product.pivot.included
                                                                                            ? (() => {
                                                                                                const totalRRP =
                                                                                                    (product.pivot.includeSupply
                                                                                                        ? product.provisioning.supply.retail_price *
                                                                                                        product.pivot.quantity
                                                                                                        : 0) +
                                                                                                    (product.pivot.includeInstall
                                                                                                        ? product.provisioning.install.retail_price *
                                                                                                        product.pivot.quantity
                                                                                                        : 0)
                                                                                                const totalCOGS =
                                                                                                    (product.pivot.includeSupply
                                                                                                        ? product.provisioning.supply.cogs * product.pivot.quantity
                                                                                                        : 0) +
                                                                                                    (product.pivot.includeInstall
                                                                                                        ? product.provisioning.install.cogs * product.pivot.quantity
                                                                                                        : 0)
                                                                                                const marginAmount = totalRRP - totalCOGS
                                                                                                return product.pivot.includeSupply || product.pivot.includeInstall
                                                                                                    ? `RM ${marginAmount.toLocaleString(undefined, {
                                                                                                        minimumFractionDigits: 2,
                                                                                                        maximumFractionDigits: 2,
                                                                                                    })}`
                                                                                                    : ""
                                                                                            })()
                                                                                            : ""}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                        <tfoot>
                                                                            <tr className="bg-gray-500">
                                                                                <td></td>
                                                                                <td></td>
                                                                                <td></td>
                                                                                <td></td>
                                                                                <td></td>
                                                                                <td></td>
                                                                                <td className="text-center p-3">
                                                                                    <span className="text-lg font-bold">Total</span>
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-600">
                                                                                    <span className="text-sm">
                                                                                        {calculatePackageTotal(prodPackage) >= 0 &&
                                                                                            `RM ${calculatePackageTotal(prodPackage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-600">
                                                                                    <span className="text-sm">
                                                                                        {totals.installRRP >= 0 &&
                                                                                            `RM ${totals.installRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-success font-extrabold highlight-total">
                                                                                    <span className="text-sm font-bold text-success">
                                                                                        {totals.totalRRP >= 0 &&
                                                                                            `RM ${totals.totalRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-600">
                                                                                    <span className="text-sm">
                                                                                        {totals.supplyCOGS >= 0 &&
                                                                                            `RM ${totals.supplyCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-600">
                                                                                    <span className="text-sm">
                                                                                        {totals.installCOGS >= 0 &&
                                                                                            `RM ${totals.installCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-danger font-extrabold highlight-total-cogs">
                                                                                    <span className="text-sm font-bold text-danger">
                                                                                        {totals.totalCOGS >= 0 &&
                                                                                            `RM ${totals.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-600">
                                                                                    <span className="text-sm font-bold">{marginPercent}</span>
                                                                                </td>
                                                                                <td className="whitespace-nowrap text-gray-600">
                                                                                    <span className="text-sm font-bold">{`RM ${marginAmount}`}</span>
                                                                                </td>
                                                                            </tr>
                                                                        </tfoot>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <OrderPreviewModal
                orderDetail={orderDetail}
                selectedQuotation={selectedQuotation}
                packageCategories={packageCategories}
                formatDate={formatDate}
                totalExcludedAddonAmount={totalExcludedAddonAmount}
            />

            <ConfirmOrderModal order={{ id: orderDetail.id, name: orderDetail.order_no }} onSubmit={refetch} />

            <ReReleaseOrderModal handleConfirm={handleReReleaseOrder} />

            <VoidQuotationModal handleConfirm={handleVoidQuotation} />

            <div className="tooltip" id="final_pricing_tooltip">
                This is the price that will be display to the owner
            </div>
        </>
    )
}

export default OrderDetail
