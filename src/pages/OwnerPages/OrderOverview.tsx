"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import type { Order, Package, Product, Property } from "../../types/index"
import Loading from "../../components/Loading"
import { Slide, toast } from "react-toastify"
import KTComponent, { KTModal } from "../../metronic/core"
import useFetchOwnerOrder from "../../hook/useFetchOwnerOrder"
import { Link } from "react-router-dom"
import { fetchProperty, toggleOwnerOrderAddon } from "../../services/ownerApi"
import ConfirmUnincludeAddon from "./components/Modals/ConfirmUnincludeAddon"
import { CreditCardIcon, InformationCircleIcon } from "@heroicons/react/24/outline"
import PaymentInfoModal from "./components/Modals/PaymentInfoModal"
import AgreePartitionRiskModal from "./components/Modals/AgreePartitionRiskModal"
import { CalendarDateRangeIcon } from "@heroicons/react/24/solid"
import { ROIProgramModal } from "./components/Modals/ROIProjectModal"
import { AnimatePresence, motion } from "framer-motion"
import { getWithExpiry, setWithExpiry } from "../../utils/storage"

const LOCAL_PATH_PREFIX = import.meta.env.VITE_APP_ENV === "local" ? "/owner/" : "/"

const MEDIA_URL = import.meta.env.VITE_APP_ENV === "local" ? "/public/media/" : "/media/"

const convertToWords = (num: number) => {
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
    const teens = [
        "ten",
        "eleven",
        "twelve",
        "thirteen",
        "fourteen",
        "fifteen",
        "sixteen",
        "seventeen",
        "eighteen",
        "nineteen",
    ]
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

    if (num < 10) {
        return ones[num]
    } else if (num >= 10 && num < 20) {
        return teens[num - 10]
    } else {
        const tenPart = Math.floor(num / 10)
        const onePart = num % 10
        return tens[tenPart] + (onePart > 0 ? "-" + ones[onePart] : "")
    }
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

function OrderOverview() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const orderId = id ? Number.parseInt(id, 10) : null

    const { orderDetail: order, loading, error } = useFetchOwnerOrder(orderId)
    const [packageCategories, setPackageCategories] = useState<{ category: string; total_price: number }[]>([])
    const [orderDetail, setOrderDetail] = useState<Order>(null)
    const [property, setProperty] = useState<Property>(null)
    const [selectedConfirmPkg, setSelectedConfirmPkg] = useState<Package>(null)
    const [totalExcludedAddonAmount, setTotalExcludedAddonAmount] = useState<number>(0)

    const [selectedPlan, setSelectedPlan] = useState<string>("60")
    const [selectedProgram, setSelectedProgram] = useState<string>("normal")

    const [activeTab, setActiveTab] = useState("tab_1_1")
    const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({})

    const [agreeTnc, setAgreeTnc] = useState(false)
    const [agreeRenoAgreement, setAgreeRenoAgreement] = useState(false)
    const [agreePartitionRisk, setAgreePartitionRisk] = useState(false)

    const [isRoiModalOpen, setIsRoiModalOpen] = useState(false)

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
        if (order) {
            setOrderDetail(order)
            KTModal.init()

            const getPropertyDetail = async () => {
                try {
                    const response = await fetchProperty(Number(order.property_id))
                    const proeprtyData: Property = response.data

                    if (response.data) {
                        setProperty(proeprtyData)

                        if (order.status !== "confirmed" && !getWithExpiry<string>("roiModal")) {
                            if (proeprtyData.propertyRoi.view_enabled) {
                                setIsRoiModalOpen(true)

                                // Set localStorage with key 'roiModal' and expire in 1 week (7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
                                const oneWeekInMs = 7 * 24 * 60 * 60 * 1000
                                setWithExpiry("roiModal", "true", oneWeekInMs)
                            }
                        }
                    }
                } catch (error) {
                    console.log(error)
                    notify("error", "Failed to fetch property.")
                }
            }

            getPropertyDetail()
        }
    }, [order])

    useEffect(() => {
        if (!orderDetail?.latest_quotation?.metadata) return

        let addonCounter = 0 // To number each add-on uniquely

        const packages: Package[] = JSON.parse(JSON.parse(JSON.stringify(orderDetail?.latest_quotation?.metadata)))

        const categoryTotals = packages.reduce(
            (acc, quotationPackage) => {
                let category
                if (quotationPackage.is_addon === true) {
                    addonCounter += 1
                    category = `Add-on Option ${addonCounter} (${quotationPackage.name})`
                } else {
                    category = quotationPackage.category
                }

                const categoryTotal =
                    quotationPackage.products.reduce((total, product) => {
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

                        return total + supplyPrice + installPrice
                    }, 0) * (quotationPackage.quantity || 1)

                if (!(quotationPackage.is_addon === true && quotationPackage.is_addon_included === false)) {
                    if (!acc[category]) {
                        acc[category] = { total_price: 0, quantity: 0 }
                    }
                    acc[category].total_price += categoryTotal
                    acc[category].quantity += quotationPackage.quantity
                }

                return acc
            },
            {} as Record<string, { total_price: number; quantity: number }>,
        )

        // Calculate filtered total_amount
        const filteredTotalAmount = Object.values(categoryTotals).reduce((sum, { total_price }) => sum + total_price, 0)

        const categoriesArray = Object.entries(categoryTotals).map(([category, { total_price, quantity }]) => ({
            category: category.startsWith("Add-on Option")
                ? category
                : categoryOptions.find((option) => option.value === category)?.label || category,
            total_price,
            quantity,
        }))

        const sortedCategories = [
            ...categoriesArray.filter((item) => !item.category.startsWith("Add-on Option")),
            ...categoriesArray.filter((item) => item.category.startsWith("Add-on Option")),
        ]

        setPackageCategories(sortedCategories)

        // Update orderDetail with filtered total_amount (assuming you can modify it)
        setOrderDetail((prev) => ({
            ...prev,
            total_amount: orderDetail.f_1 ? orderDetail.total_amount : filteredTotalAmount,
        }))
    }, [orderDetail?.latest_quotation, orderDetail?.total_amount, orderDetail?.f_1])

    useEffect(() => {
        if (orderDetail) {
            const packages: Package[] = JSON.parse(JSON.parse(JSON.stringify(orderDetail?.latest_quotation?.metadata)))

            const totalAmount = orderDetail.f_1
                ? orderDetail.total_amount
                : packages.reduce((total, pkg) => {
                    // Skip if package is not an addon or not included
                    if (pkg.is_addon === true && pkg.is_addon_included === false) {
                        return total
                    }

                    // Use final_amount if available, otherwise use total_price
                    return total + pkg.total_price * (pkg.quantity || 1)
                }, 0)

            setTotalExcludedAddonAmount(totalAmount)
        }
    }, [orderDetail])

    useEffect(() => {
        if (orderDetail) {
            setOpenAccordions(() => {
                const initialState: { [key: string]: boolean } = {}
                if (orderDetail) {
                    JSON.parse(JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata))).forEach(
                        (item: Package, index: number) => {
                            initialState[`content_${index}`] = false
                        },
                    )
                }
                return initialState
            })

            setOpenAccordions((prev) => ({
                ...prev,
                property: false,
                amount_breakdown: false,
            }))
        }
    }, [orderDetail])

    const getCurrentDate = () => {
        const date = new Date()
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
    }

    const formatDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split("/")
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return `${day} ${monthNames[Number.parseInt(month) - 1]} ${year}`
    }

    const toggleAccordion = (id: string) => {
        setOpenAccordions((prev) => ({
            ...prev,
            [id]: prev[id] == null ? false : !prev[id],
        }))
    }

    useEffect(() => {
        document.title = "Order Overview | RenoXpert"
        KTComponent.init()
    }, [])

    const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedProgram = e.target.value
        setSelectedProgram(selectedProgram)

        if (selectedProgram === "bePowered") {
            setSelectedPlan("60")
        }
    }

    const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPlan = e.target.value
        setSelectedPlan(selectedPlan)
    }

    const handleToggleAddonPackage = async (packageId: number) => {
        try {
            const response = await toggleOwnerOrderAddon(Number(orderDetail.id), packageId)

            if (response?.success) {
                const packages: Package[] = JSON.parse(JSON.parse(JSON.stringify(response?.data?.latest_quotation?.metadata)))

                const selectedPackage = packages.find((pkg) => pkg.id === packageId)

                const isIncluded = selectedPackage.is_addon_included

                if (!isIncluded) {
                    notify("success", "Aww! You missed the good deal.")
                } else {
                    notify("success", "You just save your money!")
                }

                setOrderDetail(response.data)

                const modalEl = document.querySelector("#confirm_uninclude_modal") as HTMLElement
                const modal = KTModal.getInstance(modalEl)

                modal.hide()
                setSelectedConfirmPkg(null)
            }
        } catch (error) {
            console.log(error.message)
            notify("error", "Failed to save changes.")
        }
    }

    const handleConfirmationAddonPackage = (selectedPkg: Package, isTurningOff: boolean) => {
        if (isTurningOff) {
            const modalEl = document.querySelector("#confirm_uninclude_modal") as HTMLElement
            const modal = KTModal.getInstance(modalEl)

            modal.show()
            setSelectedConfirmPkg(selectedPkg)
        } else {
            handleToggleAddonPackage(selectedPkg.id)
        }
    }

    const handleAgreeTncChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAgreeTnc(event.target.checked)
    }

    const handleAgreeRenoAgreementChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAgreeRenoAgreement(event.target.checked)
    }

    const handleAgreePartitionRisk = () => {
        // If not check, show modal
        if (!agreePartitionRisk) {
            const modalEl = document.querySelector("#agree_partition_risk_modal") as HTMLElement
            const modal = KTModal.getInstance(modalEl)

            modal.show()
        } else {
            // If check, uncheck
            setAgreePartitionRisk(!agreePartitionRisk)
        }
    }

    const handleAgreeOrder = async () => {
        navigate(LOCAL_PATH_PREFIX + "confirm/order/otp/verify", {
            state: {
                conutry_code: orderDetail.user.country_code,
                mobile: orderDetail.user.phone_no,
                orderId: orderDetail.id,
            },
        })
    }

    // Check if quotation has BePowered packages
    const hasBePoweredPackages = () => {
        if (!orderDetail?.latest_quotation?.metadata) return false
        const packages: Package[] = JSON.parse(JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata)))
        return packages.some((pkg) => pkg.is_be_powered === true)
    }

    // Get BePowered packages
    const getBePoweredPackages = () => {
        if (!orderDetail?.latest_quotation?.metadata) return []
        const packages: Package[] = JSON.parse(JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata)))
        return packages.filter((pkg) => pkg.is_be_powered === true)
    }

    if (loading) return <Loading />
    if (error)
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex flex-col items-center">
                    <img alt="image" className="dark:hidden max-h-[160px] mb-12" src={`${MEDIA_URL}illustrations/3.svg`} />
                    <img alt="image" className="light:hidden max-h-[160px] mb-12" src={`${MEDIA_URL}illustrations/3-dark.svg`} />

                    <h2 className="text-xl font-semibold text-gray-900">Order not found or invalid</h2>
                </div>
            </div>
        )
    if (!orderDetail) return <div>An unexpected error occured</div>

    const tnc = (
        <ol className="list-decimal text-sm space-y-6">
            <li className="[&::marker]:font-bold pl-2">
                This quotation is only valid for 7 days. If RenoXpert receives the Client’s confirmation after 7 days, RenoXpert
                reserves the right to make changes to the quotation.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                RenoXpert reserves the right to decide on the overall design and theme, the selection of furniture, fixtures, and
                fittings for the Client’s unit including the colour and material of products.
            </li>
            <li className="[&::marker]:font-bold pl-2">The pre-booking payment has a grace period of 7 days upon booking payment.</li>
            <li className="[&::marker]:font-bold pl-2">
                Any pictures or illustrations shown are for reference purposes only. RenoXpert will attempt to create a similar
                concept; however, some items may be seasonal, and RenoXpert reserves the right to substitute similar products of
                equivalent quality at our discretion.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                RenoXpert is allowed to take photos of the renovation and the end product for marketing and promotional purposes.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                RenoXpert reserves the right to replace the items as quoted with products of equivalent or higher value, of similar
                functionality, and/or purpose.
            </li>
            <li className="[&::marker]:font-bold pl-2">The commencement date for the renovation shall be determined at the sole discretion of RenoXpert.</li>
            <li className="[&::marker]:font-bold pl-2">
                RenoXpert will make reasonable efforts to meet the specified completion dates. However, unforeseen circumstances
                may lead to adjustments in the timeline. The Client will be informed of any changes.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                In the event of non-payment or breach of contract by the Client, RenoXpert reserves the right to suspend work until
                the issue is resolved. Any additional costs incurred as a result of such suspension will be borne by the Client.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                The bank interest rate for the installment plan may change by the bank(s) without prior notification to the
                Client.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                For safety and security reasons, access/execution of all works by RenoXpert staff, suppliers, contractors, and
                sub-contractors requires the unit to be vacated during the entire duration of renovation work.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                The Client consents to refrain from accessing the unit without prior notification to the RenoXpert team. Entry
                should be coordinated with a designated team member if the Client wishes to enter the unit during the renovation
                period.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                It is advised that the Client refrain from staying in the unit during the renovation period. Occupancy may
                impact renovation progress and could raise safety concerns.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                The Client acknowledges that the scope of work for this renovation project is fixed, and no changes,
                alterations, or customizations are permitted once the quotation is signed.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                The quotation includes up to 6 feet of copper piping per air conditioning unit. An additional charge of RM25 per
                foot will apply for any additional copper piping required.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                This quotation includes the supply and installation of kitchen cabinets up to the length specified. Any
                additional length will incur extra charges.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                Complimentary items are provided if required for the unit, subject to necessity. These items are
                non-exchangeable for cash, discounts, or any other value. If deemed unnecessary for the unit, they will not be
                applicable for redemption.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                Payment verification: Kindly WhatsApp us at +6011-5698 5313 with the bank-in slip or online payment receipt,
                along with the client's name, development name, and unit number.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                It shall be the Client’s duty to ensure that all details ascribed in the email are correct and accurate. RenoXpert
                shall not be held responsible for any discrepancies.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                Renovations proceed in batches based on a first-come, first-served basis. RenoXpert is not responsible for delays
                due to a lack of documents or payment delays.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                The Client assumes all risk for installing a partition. RenoXpert is not liable for penalties or removal costs
                requested by authorities.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                The Client is solely responsible for paying the renovation deposit to the management office and for handling all
                related matters.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                For all goods, products, and materials under the renovation work, RenoXpert reserves the right to remove any
                furniture and/or fittings up to the value of the amount owing to RenoXpert.
            </li>
            <li className="[&::marker]:font-bold pl-2">
                If the Client opts to make payment using a credit card, an additional admin fee of 2% will apply. This charge is
                not applicable for credit card installment plans, FPX, or bank transfers.
            </li>
            <li className="[&::marker]:font-bold pl-2">Any payment made is non-refundable.</li>
            <li className="[&::marker]:font-bold pl-2">
                By signing this quotation, the Client acknowledges and agrees to the terms and conditions outlined in the
                quotation and the attached renovation agreement.
            </li>
        </ol>
    )

    const address = orderDetail.user
        ? [
            orderDetail.user.address.address_1,
            orderDetail.user.address.street,
            orderDetail.user.address.postcode,
            orderDetail.user.address.city,
            orderDetail.user.address.state,
        ]
            .filter(Boolean)
            .join(", ")
        : null

    const propertyAddress = [
        orderDetail.property.address,
        orderDetail.property.street,
        orderDetail.property.postcode,
        orderDetail.property.city,
        orderDetail.property.state,
    ].filter((part) => part !== null && part !== "")

    const bonus = JSON.parse(JSON.parse(JSON.stringify(orderDetail.latest_quotation.bonus)))

    const renoAgreement = (
        <div className="flex flex-col w-full text-sm text-justify">
            <div className="flex flex-col items-center justify-center gap-6 text-center mb-6">
                <span>
                    THIS AGREEMENT is made this day of{" "}
                    <strong>{orderDetail.status === "confirmed" ? formatDate(orderDetail.updated_at) : getCurrentDate()}</strong>
                </span>
                <span>BETWEEN</span>
                <span>
                    <strong>RENOXPERT SDN. BHD. [Registration No.202401032588 (1578437-W)]</strong> of{" "}
                    <strong>42-46, Ground Floor, Jalan SS 19/1d, SS 19, 46500 Subang Jaya, Selangor</strong> ("the Contractor") of
                    the one part;
                </span>
                <span>AND</span>
                <span>
                    <strong>
                        {orderDetail.user ? orderDetail.user.name : "[Owner Name]"} (NRIC No.{" "}
                        {orderDetail.user ? orderDetail.user.ic : "[Owner IC]"})
                    </strong>{" "}
                    of <strong>{address ? address : "[Owner Address]"}</strong> ("the Owner") of the other part
                </span>
            </div>
            <div className="flex flex-col gap-6 mb-6">
                <span className="font-bold">WHEREAS:</span>
                <span>
                    The Contractor desires to provide renovation services to the Owner and the Owner desires to utilize the
                    services of the Contractor for the renovation of the Owner's property described as{" "}
                    <strong>
                        A (1) unit of Service Residence known as {orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no},{" "}
                        {orderDetail.property.name}, {propertyAddress}
                    </strong>{" "}
                    (the "Property") subject to the terms and conditions hereinafter appearing.
                </span>
                <span>
                    <strong>NOW THIS AGREEMENT WITNESSETH</strong> as follows:-
                </span>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>1. CONTRACT SUM</strong>
                    </span>
                    <span>
                        1.1 The Owner hereby appoints the Contractor and the Contractor agrees to accept such appointment of making
                        improvements to the Property, to carry out, execute and complete the upgrading and alteration works to the
                        Property which are more particularly described and set out in the <strong>Quotation</strong> hereto
                        ("Works") at an agreed lump sum of <strong>Ringgit Malaysia (RM) ONLY</strong> (the "said Contract Sum")
                        payable by instalments/progressive payment in accordance with the <strong>First Schedule</strong> hereof,
                        subject to the Owner's right of inspection as set forth below.
                    </span>
                    <span>
                        1.2 Any change in the Contract Sum, change in the Works or change in the contract time that to be defined
                        herein must be agreed by all parties herein and set forth in writing signed by the Owner and the Contractor.
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>2. DURATION</strong>
                    </span>
                    <span>
                        2.1 The renovation agreement and renovation Phase 1 shall commence upon the following conditions precedent
                        have been fulfilled:-
                    </span>
                    <div className="flex flex-col gap-3 pl-5">
                        <span>
                            (a) the Owner shall make the first Fifty (50%) per cent as stated in the <strong>First Schedule</strong>{" "}
                            as deposit;
                        </span>
                        <span>
                            (b) defects of the Property shall be duly rectified, repaired and fixed by the Developer's defects' teams
                            and workers with the Owner or the Contractor's approval;
                        </span>
                        <span>
                            (c) the Owner or the Contractor has obtained the working permit granted by the relevant authorities; and
                        </span>
                        <span>
                            (d) the full set of keys and access cards of the Property (if required) have been passed to the
                            Contractor,
                        </span>
                        <span>
                            the commencement date for renovation work shall be after <strong>Seven (7) working days</strong> from the
                            date when the <strong>clause 2.1(a), (b), (c) and (d)</strong> have been fulfilled following the sequence
                            of <strong>clause 2.1(a), (b), (c) and (d)</strong>. Failure to comply with the above-mentioned
                            conditions, the Owner shall unconditionally allow the Contractor to extend the commencement and completion
                            date without any interest.
                        </span>
                    </div>
                    <span>
                        2.2 The renovation Phase 2 shall commence upon the following conditions precedent have been fulfilled:-
                    </span>
                    <div className="flex flex-col gap-3 pl-5">
                        <span>(a) the Contractor has completed renovation Phase 1 works; and</span>
                        <span>
                            (b) the Owner has made the second Fifty (50%) per cent as stated in the <strong>First Schedule</strong> as
                            deposit;
                        </span>
                        <span>
                            the commencement date for renovation work shall be after <strong>Seven (7) working days</strong> from the
                            date when the <strong>clause 2.2(a) and (b)</strong> have been fulfilled following the sequence of{" "}
                            <strong>clause 2.2(a) and (b)</strong>. Failure to comply with the above-mentioned conditions, the Owner
                            shall unconditionally allow the Contractor to extend the commencement and completion date without any
                            interest.
                        </span>
                    </div>
                    <span>
                        2.3 The period for this renovation work shall take{" "}
                        <strong>
                            {convertToWords(orderDetail.completion_day).toUpperCase()} {orderDetail.completion_day} working days
                        </strong>{" "}
                        or any approved extension period by all parties ("the said Contract Time"). Time wherever mentioned shall be
                        of the essence of this Agreement.
                    </span>
                    <span>
                        2.4 For the avoidance of doubt, renovation Phase 1 includes wiring, painting, and installation of smart
                        devices while renovation Phase 2 includes the supply and installation of furniture and loose items.
                    </span>
                </div>
            </div>
        </div>
    )

    const isButtonDisabled = !(agreeTnc && agreeRenoAgreement && agreePartitionRisk)

    // Sparkle component
    const Sparkle = ({ delay = 0 }: { delay?: number }) => (
        <motion.div
            className="absolute w-1 h-1 bg-green-600 rounded-full"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, Math.random() * 40 - 20],
                y: [0, Math.random() * 40 - 20],
            }}
            transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                delay,
                ease: "easeInOut",
            }}
        />
    )

    return (
        <>
            <div className={`flex w-full px-2 ${openAccordions["amount_breakdown"] ? "mb-60" : "mb-10"}`}>
                <div className="card flex-auto w-full max-w-4xl">
                    {/* Header */}
                    <div className="card-header flex justify-between">
                        <div className="flex gap-4 justify-center">
                            <Link
                                to={LOCAL_PATH_PREFIX + "quotations"}
                                className="ki-solid ki-arrow-left items-center text-gray-900"
                            ></Link>
                            {orderDetail.status === "confirmed" ? (
                                <span className="text-md text-gray-900 font-semibold">Quotation Order Overview</span>
                            ) : (
                                <span className="text-md text-gray-900 font-semibold">Quotation Order Agreement</span>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="card-body pt-2 px-4">
                        {/* Tabs */}
                        <div className="mb-2 flex gap-2 bg-white">
                            <button
                                className={`py-2 text-xs px-2 rounded-md transition-all ${activeTab === "tab_1_1" ? "active bg-blue-500 text-white" : "hover:bg-gray-100"
                                    }`}
                                onClick={() => setActiveTab("tab_1_1")}
                            >
                                {orderDetail.status === "confirmed" ? "Overview" : "Quotation Order"}
                            </button>

                            {orderDetail.status === "confirmed" && (
                                <button
                                    className={`py-2 px-2 text-xs rounded-md transition-all ${activeTab === "tab_1_4" ? "active bg-blue-500 text-white" : "hover:bg-gray-100"
                                        }`}
                                    onClick={() => setActiveTab("tab_1_4")}
                                >
                                    Quotation Order
                                </button>
                            )}

                            <button
                                className={`py-2 px-2 text-xs rounded-md transition-all ${activeTab === "tab_1_2" ? "active bg-blue-500 text-white" : "hover:bg-gray-100"
                                    }`}
                                onClick={() => setActiveTab("tab_1_2")}
                            >
                                T&C
                            </button>

                            <button
                                className={`py-2 px-2 text-xs rounded-md transition-all ${activeTab === "tab_1_3" ? "active bg-blue-500 text-white" : "hover:bg-gray-100"
                                    }`}
                                onClick={() => setActiveTab("tab_1_3")}
                            >
                                Reno Agreement
                            </button>

                            {/* Animated ROI Button */}
                            {property?.propertyRoi?.view_enabled ? (
                                <div className="relative">
                                    {/* Sparkles */}
                                    <AnimatePresence>
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <Sparkle key={i} delay={i * 0.2} />
                                        ))}
                                    </AnimatePresence>

                                    {/* ROI Button with animations */}
                                    <motion.button
                                        className={`py-2 px-4 text-xs rounded-md relative overflow-hidden font-semibold transition-all ${activeTab === "tab_1_5"
                                                ? "active bg-gradient-to-r from-green-600 to-green-600 text-white shadow-lg"
                                                : "bg-gradient-to-r from-green-500 to-green-500 text-white hover:from-redgreen-600 hover:to-green-600"
                                            }`}
                                        data-modal-toggle="#roi-program-modal"
                                        // onClick={() => setActiveTab("tab_1_5")}
                                        animate={{
                                            boxShadow: [
                                                "0 0 0 rgba(0, 128, 0, 0)",
                                                "0 0 20px rgba(0, 128, 0, 0.4)",
                                                "0 0 0 rgba(0, 128, 0, 0)",
                                            ],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Number.POSITIVE_INFINITY,
                                            ease: "easeInOut",
                                        }}
                                        whileHover={{
                                            scale: 1.05,
                                            boxShadow: "0 0 25px rgba(215, 30, 66, 0.6)",
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {/* Shine effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "100%" }}
                                            transition={{
                                                duration: 2,
                                                repeat: Number.POSITIVE_INFINITY,
                                                repeatDelay: 3,
                                                ease: "easeInOut",
                                            }}
                                        />

                                        {/* Button text */}
                                        <span className="relative z-10">ROI</span>

                                        {/* Pulsing background overlay */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-400 opacity-30 rounded-md"
                                            animate={{
                                                opacity: [0.3, 0.6, 0.3],
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Number.POSITIVE_INFINITY,
                                                ease: "easeInOut",
                                            }}
                                        />
                                    </motion.button>
                                </div>
                            ) : (
                                ""
                            )}
                        </div>

                        <hr className="my-2" />

                        {/* Tab Content */}
                        <div className={activeTab === "tab_1_1" ? "block" : "hidden"} id="tab_1_1">
                            <div className="overflow-x-auto">
                                {/* Progress Bar */}
                                {orderDetail.status === "confirmed" && (
                                    <div className="flex flex-col mb-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-center mb-2">
                                            <span className="text-md text-gray-900 font-semibold">
                                                {(100 - orderDetail.sale.remaining_percentage * 100).toFixed(2)}% Invoice Issued
                                            </span>
                                            <div className="badge badge-success badge-outline text-sm mt-2 sm:mt-0">
                                                {(
                                                    orderDetail.sale.invoices.reduce(
                                                        (sum, invoice) => (invoice.status === "paid" ? sum + invoice.percentage : sum),
                                                        0,
                                                    ) * 100
                                                ).toFixed(2)}
                                                % Paid
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-blue-200"
                                                style={{ width: `${100 - orderDetail.sale.remaining_percentage * 100}%` }}
                                            />
                                            <div
                                                className="absolute top-0 left-0 h-full bg-green-500"
                                                style={{
                                                    width: `${orderDetail.sale.invoices.reduce(
                                                        (sum, invoice) => (invoice.status === "paid" ? sum + invoice.percentage : sum),
                                                        0,
                                                    ) * 100
                                                        }%`,
                                                }}
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <span className="badge badge-outline bg-blue-50 border-blue-200 text-blue-300 flex items-center gap-1">
                                                <span className="badge badge-dot size-1.5 bg-blue-300"></span> Issued
                                            </span>
                                            <span className="badge badge-outline badge-success flex items-center gap-1">
                                                <span className="badge badge-dot size-1.5 bg-green-500"></span> Paid
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Property */}
                                <div className="accordion-item flex-1 card mb-4 shadow-sm rounded-md">
                                    <button
                                        className="flex items-center justify-between gap-4 w-full text-2xs p-0 py-2 rounded-xl md:cursor-default md:hover:bg-transparent transition duration-200 focus:outline-none"
                                        onClick={() => window.innerWidth < 768 && toggleAccordion("property")}
                                    >
                                        <div className="card-body p-0 px-4 flex justify-around items-center">
                                            <span className="text-xs text-gray-600">Quote: QUO-2500031</span>
                                            <span className="text-xs text-gray-600">Date: 16 Apr 2025</span>
                                            {orderDetail.status !== "released" && (
                                                <div className="flex flex-col">
                                                    {/* Quotation Status */}
                                                    <span
                                                        className={`badge badge-xs p-2 capitalize badge-outline ${orderDetail.status === "confirmed"
                                                                ? "badge-success"
                                                                : orderDetail.status === "voided"
                                                                    ? "badge-danger"
                                                                    : ""
                                                            }`}
                                                    >
                                                        {orderDetail.status === "confirmed" ? "Sale" : orderDetail.status}
                                                    </span>
                                                </div>
                                            )}
                                            <i
                                                className={`ki-outline ${openAccordions["property"] !== false ? "ki-down" : "ki-right"
                                                    } text-gray-600 text-xs transition-transform duration-300 md:hidden`}
                                            ></i>
                                        </div>
                                    </button>
                                    <div
                                        className={`border-t overflow-hidden transition-all duration-300 ease-in-out ${openAccordions["property"] !== false ? "max-h-screen" : "max-h-0 md:max-h-screen"
                                            }`}
                                    >
                                        <div className="p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { label: "Name", value: orderDetail.property.name },
                                                    {
                                                        label: "Unit",
                                                        value: `${orderDetail.block}-${orderDetail.floor}-${orderDetail.unit_no}`,
                                                    },
                                                    { label: "Unit Type", value: orderDetail.unit_type || "-" },
                                                    {
                                                        label: "Partition",
                                                        value: orderDetail.include_partition ? "Yes" : "No",
                                                    },
                                                ].map(({ label, value }) => (
                                                    <div key={label}>
                                                        <span className="text-xs text-gray-600">{label}:</span>
                                                        <p className="text-xs text-gray-900 font-semibold">{value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4">
                                                <span className="text-xs text-gray-600">Address:</span>
                                                <p className="text-xs text-gray-900">
                                                    {[
                                                        orderDetail.property.address,
                                                        orderDetail.property.street,
                                                        orderDetail.property.postcode,
                                                        orderDetail.property.city,
                                                        orderDetail.property.state,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4 mb-2 max-md:hidden ">
                                    {/* Easy Payment Plan */}
                                    {orderDetail.status !== "confirmed" ? (
                                        <div className={`card w-full bg-white rounded-lg shadow-md`}>
                                            <div className="card-body p-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 mb-2">
                                                            <CreditCardIcon className="w-5 h-5 text-blue-600" aria-label="Payment Icon" />
                                                            <span className="text-xs font-semibold text-gray-700">Easy Payment Plan</span>
                                                        </div>
                                                        {/* Show BePowered option if quotation has BePowered packages */}
                                                        {hasBePoweredPackages() && (
                                                            <select
                                                                className="flex select select-sm w-fit pr-8 border border-gray-300 rounded-md bg-white py-0 px-2 text-2xs h-6 appearance-none"
                                                                id="program"
                                                                value={selectedProgram}
                                                                onChange={handleProgramChange}
                                                                name="program"
                                                            >
                                                                <option value="normal">Normal</option>
                                                                <option value="bePowered">BePowered 2.0</option>
                                                            </select>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-between">
                                                        {selectedProgram !== "bePowered" ? (
                                                            <>
                                                                <div className="flex flex-col items-start w-full">
                                                                    <p className="text-lg text-[#d71e42] font-bold">
                                                                        RM{" "}
                                                                        {selectedProgram === "bePowered"
                                                                            ? (
                                                                                (25000 * (selectedPlan === "60" ? 1.14 : 1.105)) /
                                                                                Number(selectedPlan)
                                                                            ).toLocaleString(undefined, {
                                                                                minimumFractionDigits: 0,
                                                                                maximumFractionDigits: 0,
                                                                            })
                                                                            : (
                                                                                ((totalExcludedAddonAmount - (bonus?.value || 0)) *
                                                                                    (selectedPlan === "60" ? 1.14 : 1.105)) /
                                                                                Number(selectedPlan)
                                                                            ).toLocaleString(undefined, {
                                                                                minimumFractionDigits: 0,
                                                                                maximumFractionDigits: 0,
                                                                            })}
                                                                        <span className="text-sm text-gray-600">/month </span>
                                                                        <span className="text-xs text-gray-600">
                                                                            for {selectedPlan === "60" ? "60" : "36"} months
                                                                        </span>
                                                                    </p>
                                                                    <div className="flex justify-between w-full">
                                                                        <p className="italic text-gray-600 text-xs flex items-center">
                                                                            <span>(Terms & Conditions)</span>
                                                                            <button className="mx-1" data-modal-toggle="#payment_info_modal">
                                                                                <InformationCircleIcon
                                                                                    className="w-4 h-4 text-yellow-500"
                                                                                    aria-label="Payment Info"
                                                                                />
                                                                            </button>
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <select
                                                                    className="flex select select-sm w-fit pr-8 border border-gray-300 rounded-md bg-white py-0 px-2 text-2xs h-6 appearance-none"
                                                                    id="payment_plan"
                                                                    value={selectedPlan}
                                                                    onChange={handlePlanChange}
                                                                    name="payment_plan"
                                                                >
                                                                    <option value="36">36 months</option>
                                                                    <option value="60">60 months</option>
                                                                </select>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-start w-full">
                                                                <p className="text-lg text-[#d71e42] font-bold">
                                                                    <span className="text-sm text-gray-600">Total </span>
                                                                    RM 25,000
                                                                    <span className="text-sm text-gray-600"> Upfront</span>
                                                                </p>
                                                                <p className="text-sm text-[#d71e42] font-bold">
                                                                    RM{" "}
                                                                    {hasBePoweredPackages()
                                                                        ? (
                                                                            (25000 * (selectedPlan === "60" ? 1.14 : 1.105)) /
                                                                            Number(selectedPlan)
                                                                        ).toLocaleString(undefined, {
                                                                            minimumFractionDigits: 0,
                                                                            maximumFractionDigits: 0,
                                                                        })
                                                                        : (
                                                                            ((totalExcludedAddonAmount - (bonus?.value || 0)) *
                                                                                (selectedPlan === "60" ? 1.14 : 1.105)) /
                                                                            Number(selectedPlan)
                                                                        ).toLocaleString(undefined, {
                                                                            minimumFractionDigits: 0,
                                                                            maximumFractionDigits: 0,
                                                                        })}
                                                                    <span className="text-sm text-gray-600">/month </span>
                                                                    <span className="text-xs text-gray-600">
                                                                        for {selectedPlan === "60" ? "60" : "36"} months
                                                                    </span>
                                                                </p>
                                                                <div className="flex justify-between w-full">
                                                                    <p className="italic text-gray-600 text-xs flex items-center">
                                                                        <span>(Terms & Conditions)</span>
                                                                        <button className="mx-1" data-modal-toggle="#payment_info_modal">
                                                                            <InformationCircleIcon
                                                                                className="w-4 h-4 text-yellow-500"
                                                                                aria-label="Payment Info"
                                                                            />
                                                                        </button>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-start justify-between mt-4">
                                                        {selectedProgram !== "bePowered" && (
                                                            <span className="text-xs text-gray-600">
                                                                <strong>Or</strong> pay one-time: RM{" "}
                                                                {(totalExcludedAddonAmount - (bonus?.value || 0)).toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        )}
                                                        <button
                                                            className="md:hidden italic underline text-blue-600 text-xs"
                                                            onClick={() => toggleAccordion("amount_breakdown")}
                                                        >
                                                            {openAccordions["amount_breakdown"] ? "Hide Details" : "See Details"}
                                                        </button>
                                                    </div>

                                                    {/* Accordion content with conditional border-top */}
                                                    <div
                                                        className={`overflow-hidden transition-all duration-300 ease-in-out mt-1 ${openAccordions["amount_breakdown"]
                                                                ? "max-h-screen border-t border-gray-200 pt-3"
                                                                : "max-h-0 md:max-h-screen md:border-t md:border-gray-200 md:pt-3"
                                                            }`}
                                                    >
                                                        {selectedProgram === "bePowered" ? (
                                                            ""
                                                        ) : (
                                                            <div className="mt-2 space-y-4">
                                                                <div className="flex flex-col">
                                                                    {packageCategories.map((category, index) => (
                                                                        <div key={index} className="flex justify-between space-y-2">
                                                                            <span className="text-xs text-gray-600">Total {category.category}</span>
                                                                            <span className="text-xs text-gray-700 font-semibold whitespace-nowrap">
                                                                                RM{" "}
                                                                                {category.total_price.toLocaleString(undefined, {
                                                                                    minimumFractionDigits: 2,
                                                                                    maximumFractionDigits: 2,
                                                                                })}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {bonus && (
                                                                    <div className="">
                                                                        <h3 className="text-sm text-teal-600 font-bold">Discount:</h3>
                                                                        <div className="text-2xs text-gray-600 font-semibold space-y-2 mt-1">
                                                                            {(bonus.description?.split("\n") || ["No Details"]).map(
                                                                                (item: string, index: number) => (
                                                                                    <p key={index} className="mb-1 last:mb-0">
                                                                                        {item}
                                                                                    </p>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                        <div className="mt-2">
                                                                            <span className="text-xs text-gray-600 font-semibold">Total Discount:</span>
                                                                            <p className="text-md text-teal-600 font-bold">
                                                                                RM{" "}
                                                                                {bonus.value.toLocaleString(undefined, {
                                                                                    minimumFractionDigits: 2,
                                                                                    maximumFractionDigits: 2,
                                                                                })}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="">
                                                                    <h3 className="text-sm text-blue-600 font-bold">Total Amount:</h3>
                                                                    <p className="text-sm text-gray-900 font-semibold">
                                                                        RM{" "}
                                                                        {(
                                                                            (orderDetail.final_amount > 0
                                                                                ? orderDetail.final_amount
                                                                                : totalExcludedAddonAmount) - (bonus?.value || 0)
                                                                        ).toLocaleString(undefined, {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })}
                                                                    </p>
                                                                    {bonus && (
                                                                        <p className="text-xs text-gray-900">
                                                                            Original Price: RM{" "}
                                                                            {totalExcludedAddonAmount.toLocaleString(undefined, {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            })}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="card w-full">
                                            <div className="card-body p-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1 mb-3">
                                                        <CreditCardIcon className="w-5 h-5 text-blue-600" aria-label="Payment Icon" />
                                                        <span className="text-2xs font-semibold text-gray-700">Total Amount</span>
                                                    </div>
                                                    <div className="flex">
                                                        <div className="flex flex-col items-start">
                                                            <p className="text-lg text-[#d71e42] font-bold">
                                                                RM{" "}
                                                                {(totalExcludedAddonAmount - (bonus?.value || 0)).toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <hr className="my-4" />

                                {/* Payment Invoices */}
                                {orderDetail.status === "confirmed" && (
                                    <div className="mb-6">
                                        <h2 className="text-md text-gray-900 font-semibold mb-4">Payment Invoices</h2>
                                        {orderDetail.sale.invoices.length === 0 ? (
                                            <div className="flex flex-col items-center">
                                                <img
                                                    alt="No invoices"
                                                    className="max-h-[160px] mb-4"
                                                    src={`${MEDIA_URL}illustrations/3${document.documentElement.classList.contains("dark") ? "-dark" : ""
                                                        }.svg`}
                                                />
                                                <h3 className="text-md font-semibold text-gray-900">No Payment Invoices Available</h3>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {orderDetail.sale.invoices.map((invoice, index) => (
                                                    <Link
                                                        to={LOCAL_PATH_PREFIX + `invoice/${invoice.id}/view`}
                                                        key={index}
                                                        className="card bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="card-body p-4 flex flex-col">
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className="relative size-12 shrink-0">
                                                                    <svg className="w-full h-full stroke-blue-500 fill-blue-100" viewBox="0 0 44 48">
                                                                        <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" />
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-xs text-gray-900 font-medium">{invoice.invoice_no}</h3>
                                                                    <span
                                                                        className={`badge badge-outline ${invoice.status === "paid"
                                                                                ? "badge-success"
                                                                                : invoice.status === "overdue"
                                                                                    ? "badge-danger"
                                                                                    : ""
                                                                            }`}
                                                                    >
                                                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="mt-2">
                                                                <span className="text-2xs text-gray-600">Amount:</span>
                                                                <p className="text-xs text-gray-900 font-medium">
                                                                    RM{" "}
                                                                    {invoice.amount.toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                </p>
                                                            </div>
                                                            <div className="mt-2">
                                                                <span className="text-2xs text-gray-600">Due Date:</span>
                                                                <p className="text-xs text-gray-900 font-medium">
                                                                    {invoice.due_date
                                                                        ? new Date(invoice.due_date).toLocaleDateString("en-GB", {
                                                                            day: "numeric",
                                                                            month: "long",
                                                                            year: "numeric",
                                                                        })
                                                                        : "N/A"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Packages and Summary */}
                                {orderDetail.status !== "confirmed" && (
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between bg-gray-50 py-3 px-4 rounded-t-lg border-b border-gray-200 mb-6">
                                            <div className="flex items-center gap-3">
                                                <svg
                                                    className="w-5 h-5 text-blue-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M20 12H4m16-4H4m16 8H4m-2-6h20a2 2 0 012 2v6a2 2 0 01-2 2H2a2 2 0 01-2-2v-6a2 2 0 012-2z"
                                                    />
                                                </svg>
                                                <h2 className="text-lg sm:text-xl text-blue-600 font-bold tracking-tight">Packages</h2>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            {orderDetail
                                                ? (() => {
                                                    let packageCounter = 0
                                                    let addonCounter = 0
                                                    const packages = JSON.parse(
                                                        JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata)),
                                                    )

                                                    const regularPackages = packages.filter((prodPackage: Package) => !prodPackage.is_addon)
                                                    const addonPackages = packages.filter((prodPackage: Package) => prodPackage.is_addon)

                                                    const renderPackage = (prodPackage: Package, index: number, isAddon: boolean) => {
                                                        const counter = isAddon ? addonCounter++ : packageCounter++
                                                        const accordionId = `content_${index}`
                                                        const isOpen = openAccordions[accordionId] !== false

                                                        return (
                                                            <div
                                                                className={`accordion-item border rounded-xl w-full shadow-sm ${isAddon ? "bg-blue-50 border-blue-300" : ""}`}
                                                                key={index}
                                                            >
                                                                <button
                                                                    className="flex items-center justify-between gap-4 w-full text-2xs p-4 rounded-xl hover:bg-gray-50 transition duration-200 focus:outline-none"
                                                                    onClick={() => toggleAccordion(`content_${index}`)}
                                                                >
                                                                    <div className="flex items-center flex-grow text-left w-full">
                                                                        <div className="flex flex-col w-full">
                                                                            {isAddon ? (
                                                                                <>
                                                                                    <div className="flex justify-between">
                                                                                        <span className="font-medium text-gray-700 text-2xs">
                                                                                            Add-on Option {counter + 1}:
                                                                                        </span>
                                                                                    </div>
                                                                                    <span className="text-sm font-semibold text-gray-900">
                                                                                        {prodPackage.name}
                                                                                    </span>
                                                                                </>
                                                                            ) : (
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-sm font-semibold text-gray-900">
                                                                                        {prodPackage.name}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            <span className="text-xs text-gray-500 mt-1 max-w-md">
                                                                                {prodPackage.description}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-4">
                                                                        {isAddon ? (
                                                                            <div className="flex flex-col gap-2">
                                                                                <label className="switch switch-lg">
                                                                                    <input
                                                                                        className="checkbox"
                                                                                        type="checkbox"
                                                                                        checked={!!prodPackage.is_addon_included}
                                                                                        onChange={() =>
                                                                                            handleConfirmationAddonPackage(
                                                                                                prodPackage,
                                                                                                prodPackage.is_addon_included,
                                                                                            )
                                                                                        }
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    />
                                                                                </label>
                                                                                <div className="inline-block">
                                                                                    <span className={`badge ${isAddon ? "bg-white border-blue-300" : ""}`}>
                                                                                        x{prodPackage.quantity}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col gap-2">
                                                                                {/* Show BePowered toggle for packages that are BePowered enabled */}
                                                                                {prodPackage.is_be_powered && (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-xs text-gray-600">BePowered:</span>
                                                                                        <label className="switch switch-sm">
                                                                                            <input
                                                                                                className="checkbox"
                                                                                                type="checkbox"
                                                                                                checked={!!prodPackage.is_be_powered_included}
                                                                                                onChange={() => {
                                                                                                    // Handle BePowered toggle
                                                                                                    // This would need to be implemented similar to addon toggle
                                                                                                }}
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                                disabled={!prodPackage.is_be_powered}
                                                                                            />
                                                                                        </label>
                                                                                    </div>
                                                                                )}
                                                                                <div className="inline-block">
                                                                                    <span className="badge bg-white border-blue-300">
                                                                                        x{prodPackage.quantity}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        <i
                                                                            className={`ki-outline ${isOpen ? "ki-down" : "ki-right"} text-gray-600 text-xs transition-transform duration-300`}
                                                                        ></i>
                                                                    </div>
                                                                </button>
                                                                <div
                                                                    className={`border-t overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[9999px]" : "max-h-0"}`}
                                                                >
                                                                    <div className="p-4">
                                                                        <h2 className="text-xs font-semibold text-gray-800 mb-3">Products</h2>
                                                                        <table className="w-full text-xs text-left border-collapse">
                                                                            <thead>
                                                                                <tr
                                                                                    className={`border-b ${isAddon ? "bg-white border-blue-300" : "bg-gray-100"}`}
                                                                                >
                                                                                    <th className="p-3 font-medium text-gray-700">S.o.W</th>
                                                                                    <th className="p-3 font-medium text-gray-700">Product</th>
                                                                                    <th className="p-3 font-medium text-gray-700">Quantity</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {prodPackage.products.map((product: Product, idx: number) => {
                                                                                    const isSupplyAndInstall =
                                                                                        product.pivot.includeSupply || product.pivot.includeInstall

                                                                                    if (product.pivot.visibility) {
                                                                                        if (isSupplyAndInstall) {
                                                                                            return (
                                                                                                <tr
                                                                                                    key={idx}
                                                                                                    className={`border-b hover:bg-gray-100 transition duration-150 ${isAddon ? " border-blue-300" : ""}`}
                                                                                                >
                                                                                                    <td className="py-3 px-2 text-gray-700 text-left">
                                                                                                        {product.pivot.includeSupply && product.pivot.includeInstall
                                                                                                            ? "Supply & Install"
                                                                                                            : product.pivot.includeSupply
                                                                                                                ? "Supply"
                                                                                                                : "Install"}
                                                                                                    </td>
                                                                                                    <td className="p-3">
                                                                                                        <div className="flex flex-col">
                                                                                                            <span className="font-medium text-gray-900">
                                                                                                                {product.name}
                                                                                                            </span>
                                                                                                            <span className="text-2xs text-gray-600 mt-1">
                                                                                                                {product.description || "-"}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="p-3 text-gray-700">
                                                                                                        {product.pivot.quantity} {product.uom}
                                                                                                        {product.pivot.quantity > 1 ? "s" : ""}
                                                                                                    </td>
                                                                                                </tr>
                                                                                            )
                                                                                        }
                                                                                    }
                                                                                    return null
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }

                                                    return (
                                                        <>
                                                            {regularPackages.map((prodPackage: Package, index: number) =>
                                                                renderPackage(prodPackage, index, false),
                                                            )}
                                                            {addonPackages.length > 0 && (
                                                                <div className="mt-2 ml-1 flex items-center gap-1">
                                                                    <InformationCircleIcon className="h-5 w-5 text-yellow-600" />
                                                                    <p className="text-sm text-gray-600 italic">
                                                                        Feel free to toggle on/ off of the add-on optional package to explore more!
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {addonPackages.map((prodPackage: Package, index: number) =>
                                                                renderPackage(prodPackage, regularPackages.length + index, true),
                                                            )}
                                                        </>
                                                    )
                                                })()
                                                : null}
                                            <hr className="my-4" />

                                            <div className="card mb-4 shadow-sm rounded-md">
                                                <div className="card-body p-4">
                                                    <div className="flex flex-col mb-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1 mb-2">
                                                                <CalendarDateRangeIcon className="w-5 h-5 text-blue-600" aria-label="Payment Icon" />
                                                                <span className="text-xs font-semibold text-gray-700">
                                                                    Progressive Payment of the Contract Sum
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <table className="w-full text-xs text-gray-700 font-medium border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                                <th className="p-3 text-left font-semibold text-gray-700">Description</th>
                                                                <th className="p-3 text-center font-semibold text-gray-700">%</th>
                                                                <th className="p-3 text-center font-semibold text-gray-700">Amount (RM)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {orderDetail.is_progressive_payment ? (
                                                                [
                                                                    {
                                                                        desc: "Upon Confirmation and before Commencement of Phase 1",
                                                                        percent: 50,
                                                                    },
                                                                    {
                                                                        desc: "Upon Completion of Phase 1 and before Commencement of Phase 2",
                                                                        percent: 50,
                                                                    },
                                                                ].map((row, idx) => (
                                                                    <tr
                                                                        key={idx}
                                                                        className="border-b border-gray-200 hover:bg-gray-50 transition duration-150"
                                                                    >
                                                                        <td className="p-3 text-gray-600 max-w-xs">{row.desc}</td>
                                                                        <td className="p-3 text-center">{row.percent}%</td>
                                                                        <td className="p-3 text-center">
                                                                            {((totalExcludedAddonAmount - (bonus?.value || 0)) / 2).toLocaleString(
                                                                                undefined,
                                                                                {
                                                                                    minimumFractionDigits: 2,
                                                                                    maximumFractionDigits: 2,
                                                                                },
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr className="border-b border-gray-200 hover:bg-gray-50 transition duration-150">
                                                                    <td className="p-3 text-gray-600 max-w-xs">Upon Confirmation of Agreement</td>
                                                                    <td className="p-3 text-center">100%</td>
                                                                    <td className="p-3 text-center">
                                                                        {(totalExcludedAddonAmount - (bonus?.value || 0)).toLocaleString(undefined, {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            <tr className="font-bold bg-gray-50 border-t border-gray-200">
                                                                <td className="p-3 text-gray-700">Total</td>
                                                                <td className="p-3 text-center">100%</td>
                                                                <td className="p-3 text-center">
                                                                    {(totalExcludedAddonAmount - (bonus?.value || 0)).toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Checkboxes */}
                                {orderDetail.status !== "confirmed" && (
                                    <div className="flex flex-col gap-4 mt-6">
                                        {[
                                            {
                                                name: "agree_tnc",
                                                label: "Terms and Conditions",
                                                checked: agreeTnc,
                                                onChange: handleAgreeTncChange,
                                                tab: "tab_1_2",
                                            },
                                            {
                                                name: "agree_reno_agreement",
                                                label: "Reno Agreement",
                                                checked: agreeRenoAgreement,
                                                onChange: handleAgreeRenoAgreementChange,
                                                tab: "tab_1_3",
                                            },
                                        ].map(({ name, label, checked, onChange, tab }) => (
                                            <label key={name} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox"
                                                    name={name}
                                                    checked={checked || orderDetail.status === "confirmed"}
                                                    onChange={onChange}
                                                    disabled={orderDetail.status === "confirmed"}
                                                />
                                                <span className="text-xs">
                                                    I have read and accept the{" "}
                                                    <a href="#" className="text-blue-500 hover:underline" onClick={() => setActiveTab(tab)}>
                                                        {label}
                                                    </a>
                                                </span>
                                            </label>
                                        ))}
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                name="agree_partition_risk"
                                                checked={agreePartitionRisk || orderDetail.status === "confirmed"}
                                                onClick={handleAgreePartitionRisk}
                                                disabled={orderDetail.status === "confirmed"}
                                            />
                                            <span className="text-xs">I understand and acknowledge the risk of Partioning</span>
                                        </label>
                                        {orderDetail.status === "released" && (
                                            <div className="flex justify-center mt-2">
                                                <button
                                                    className="btn btn-md btn-primary rounded-3xl shadow-lg text-xs text-center"
                                                    onClick={handleAgreeOrder}
                                                    disabled={isButtonDisabled}
                                                >
                                                    Agree Quotation Order
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quotation Order Tab (confirmed status) */}
                        <div className={activeTab === "tab_1_4" ? "block" : "hidden"} id="tab_1_4">
                            <div className="flex flex-col gap-4">
                                {orderDetail
                                    ? (() => {
                                        let packageCounter = 0
                                        let addonCounter = 0
                                        return JSON.parse(JSON.parse(JSON.stringify(orderDetail.latest_quotation.metadata))).map(
                                            (prodPackage: Package, index: number) => {
                                                const isAddon = prodPackage.is_addon
                                                const counter = isAddon ? addonCounter++ : packageCounter++
                                                const accordionId = `content_${index}`
                                                const isOpen = openAccordions[accordionId] !== false

                                                return (
                                                    <div
                                                        className={`accordion-item border rounded-xl w-full shadow-sm ${isAddon ? "bg-blue-50 border-blue-300" : ""
                                                            }`}
                                                        key={index}
                                                    >
                                                        <button
                                                            className="flex items-center justify-between gap-4 w-full text-2xs p-4 rounded-xl hover:bg-gray-50 transition duration-200 focus:outline-none"
                                                            onClick={() => toggleAccordion(`content_${index}`)}
                                                        >
                                                            <div className="flex items-center flex-grow text-left w-full">
                                                                <div className="flex flex-col w-full">
                                                                    {prodPackage.is_addon ? (
                                                                        <>
                                                                            <div className="flex justify-between">
                                                                                <span className="font-medium text-gray-700 text-2xs">
                                                                                    Add-on Option {counter + 1}:
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-sm font-semibold text-gray-900">{prodPackage.name}</span>
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-sm font-semibold text-gray-900">{prodPackage.name}</span>
                                                                        </div>
                                                                    )}
                                                                    <span className="text-xs text-gray-500 mt-1 max-w-md">
                                                                        {prodPackage.description}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-4">
                                                                {prodPackage.is_addon ? (
                                                                    <div className="flex flex-col gap-2">
                                                                        <label className="switch switch-lg">
                                                                            <input
                                                                                className="checkbox"
                                                                                type="checkbox"
                                                                                checked={!!prodPackage.is_addon_included}
                                                                                onChange={() =>
                                                                                    handleConfirmationAddonPackage(prodPackage, prodPackage.is_addon_included)
                                                                                }
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            />
                                                                        </label>
                                                                        <div className="inline-block">
                                                                            <span className={`badge ${isAddon ? "bg-white border-blue-300" : ""}`}>
                                                                                x{prodPackage.quantity}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="inline-block">
                                                                        <span className="badge bg-white border-blue-300">x{prodPackage.quantity}</span>
                                                                    </div>
                                                                )}
                                                                <i
                                                                    className={`ki-outline ${isOpen ? "ki-down" : "ki-right"
                                                                        } text-gray-600 text-xs transition-transform duration-300`}
                                                                ></i>
                                                            </div>
                                                        </button>
                                                        <div
                                                            className={`border-t overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[9999px]" : "max-h-0"
                                                                }`}
                                                        >
                                                            <div className="p-4">
                                                                <h2 className="text-xs font-semibold text-gray-800 mb-3">Products</h2>
                                                                <table className="w-full text-xs text-left border-collapse">
                                                                    <thead>
                                                                        <tr
                                                                            className={`border-b ${isAddon ? "bg-white border-blue-300" : "bg-gray-100"}`}
                                                                        >
                                                                            <th className="p-3 font-medium text-gray-700">S.o.W</th>
                                                                            <th className="p-3 font-medium text-gray-700">Product</th>
                                                                            <th className="p-3 font-medium text-gray-700">Quantity</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {prodPackage.products.map((product: Product, idx: number) => {
                                                                            const isSupplyAndInstall =
                                                                                product.pivot.includeSupply || product.pivot.includeInstall

                                                                            if (product.pivot.visibility) {
                                                                                if (isSupplyAndInstall) {
                                                                                    return (
                                                                                        <tr
                                                                                            key={idx}
                                                                                            className={`border-b hover:bg-gray-100 transition duration-150 ${isAddon ? " border-blue-300" : ""
                                                                                                }`}
                                                                                        >
                                                                                            <td className="py-3 px-2 text-gray-700 text-left">
                                                                                                {product.pivot.includeSupply && product.pivot.includeInstall
                                                                                                    ? "Supply & Install"
                                                                                                    : product.pivot.includeSupply
                                                                                                        ? "Supply"
                                                                                                        : "Install"}
                                                                                            </td>
                                                                                            <td className="p-3">
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="font-medium text-gray-900">{product.name}</span>
                                                                                                    <span className="text-2xs text-gray-600 mt-1">
                                                                                                        {product.description || "-"}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="p-3 text-gray-700">
                                                                                                {product.pivot.quantity} {product.uom}
                                                                                                {product.pivot.quantity > 1 ? "s" : ""}
                                                                                            </td>
                                                                                        </tr>
                                                                                    )
                                                                                }
                                                                            }
                                                                            return null
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            },
                                        )
                                    })()
                                    : null}
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-md mb-2">Progressive Payment of the Contract Sum</span>
                                    <div className="overflow-x-auto w-full max-w-lg">
                                        <table className="table w-full text-xs text-gray-700 font-medium">
                                            <thead>
                                                <tr>
                                                    <th className="p-2">Description</th>
                                                    <th className="p-2 text-center">%</th>
                                                    <th className="p-2 text-center">Amount (RM)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderDetail.is_progressive_payment ? (
                                                    <>
                                                        <tr>
                                                            <td className="p-2">Upon Confirmation and before Commencement of Phase 1</td>
                                                            <td className="p-2 text-center">50</td>
                                                            <td className="p-2 text-center">
                                                                {((totalExcludedAddonAmount - Number(bonus?.value || 0)) / 2).toLocaleString(
                                                                    undefined,
                                                                    {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    },
                                                                )}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="p-2">Upon Completion of Phase 1 and before Commencement of Phase 2</td>
                                                            <td className="p-2 text-center">50</td>
                                                            <td className="p-2 text-center">
                                                                {((totalExcludedAddonAmount - Number(bonus?.value || 0)) / 2).toLocaleString(
                                                                    undefined,
                                                                    {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    },
                                                                )}
                                                            </td>
                                                        </tr>
                                                    </>
                                                ) : (
                                                    <tr>
                                                        <td className="p-2">Upon Confirmation of Agreement</td>
                                                        <td className="p-2 text-center">100</td>
                                                        <td className="p-2 text-center">
                                                            {(totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className="font-bold">
                                                    <td className="p-2">Total:</td>
                                                    <td className="p-2 text-center">100</td>
                                                    <td className="p-2 text-center">
                                                        {(totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Checkboxes */}
                        {orderDetail.status !== "confirmed" && (
                            <div className="flex flex-col gap-4 mt-6">
                                {[
                                    {
                                        name: "agree_tnc",
                                        label: "Terms and Conditions",
                                        checked: agreeTnc,
                                        onChange: handleAgreeTncChange,
                                        tab: "tab_1_2",
                                    },
                                    {
                                        name: "agree_reno_agreement",
                                        label: "Reno Agreement",
                                        checked: agreeRenoAgreement,
                                        onChange: handleAgreeRenoAgreementChange,
                                        tab: "tab_1_3",
                                    },
                                ].map(({ name, label, checked, onChange, tab }) => (
                                    <label key={name} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            name={name}
                                            checked={checked || orderDetail.status === "confirmed"}
                                            onChange={onChange}
                                            disabled={orderDetail.status === "confirmed"}
                                        />
                                        <span className="text-xs">
                                            I have read and accept the{" "}
                                            <a href="#" className="text-blue-500 hover:underline" onClick={() => setActiveTab(tab)}>
                                                {label}
                                            </a>
                                        </span>
                                    </label>
                                ))}
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="checkbox"
                                        name="agree_partition_risk"
                                        checked={agreePartitionRisk || orderDetail.status === "confirmed"}
                                        onClick={handleAgreePartitionRisk}
                                        disabled={orderDetail.status === "confirmed"}
                                    />
                                    <span className="text-xs">I understand and acknowledge the risk of Partioning</span>
                                </label>
                                {orderDetail.status === "released" && (
                                    <div className="flex justify-center mt-2">
                                        <button
                                            className="btn btn-md btn-primary rounded-3xl shadow-lg text-xs text-center"
                                            onClick={handleAgreeOrder}
                                            disabled={isButtonDisabled}
                                        >
                                            Agree Quotation Order
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            {orderDetail.status !== "confirmed" && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white p-3 px-5 z-50 transition-all duration-300 rounded-t-xl shadow-[0_-6px_12px_rgba(0,0,0,0.25)]">
                    {/* Accordion content with conditional border-top */}
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordions["amount_breakdown"] ? "max-h-screen" : "max-h-0 md:max-h-screen"
                            }`}
                    >
                        {selectedProgram === "bePowered" ? (
                            ""
                        ) : (
                            <div className="mt-2 space-y-4">
                                <div className="flex flex-col">
                                    {packageCategories.map((category, index) => (
                                        <div key={index} className="flex justify-between space-y-2">
                                            <span className="text-xs text-gray-600">Total {category.category}</span>
                                            <span className="text-xs text-gray-700 font-semibold whitespace-nowrap">
                                                RM{" "}
                                                {category.total_price.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {bonus && (
                                    <div className="">
                                        <h3 className="text-sm text-teal-600 font-bold">Discount:</h3>
                                        <div className="text-2xs text-gray-600 font-semibold space-y-2 mt-1">
                                            {(bonus.description?.split("\n") || ["No Details"]).map((item: string, index: number) => (
                                                <p key={index} className="mb-1 last:mb-0">
                                                    {item}
                                                </p>
                                            ))}
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-xs text-gray-600 font-semibold">Total Discount:</span>
                                            <p className="text-md text-teal-600 font-bold">
                                                RM{" "}
                                                {bonus.value.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="">
                                    <h3 className="text-sm text-blue-600 font-bold">Total Amount:</h3>
                                    <p className="text-sm text-gray-900 font-semibold">
                                        RM{" "}
                                        {(
                                            (orderDetail.final_amount > 0 ? orderDetail.final_amount : totalExcludedAddonAmount) -
                                            (bonus?.value || 0)
                                        ).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                    {bonus && (
                                        <p className="text-xs text-gray-900">
                                            Original Price: RM{" "}
                                            {totalExcludedAddonAmount.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <hr className="my-2" />
                    </div>

                    <div className="flex flex-col space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <CreditCardIcon className="w-5 h-5 text-blue-600" aria-label="Payment Icon" />
                                <span className="text-xs font-semibold text-gray-700">Easy Payment Plan</span>
                            </div>
                            {hasBePoweredPackages() && (
                                <select
                                    className="flex select select-sm w-fit pr-8 border border-gray-300 rounded-md bg-white py-0 px-2 text-2xs h-6 appearance-none"
                                    id="program"
                                    value={selectedProgram}
                                    onChange={handleProgramChange}
                                    name="program"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="bePowered">BePowered 2.0</option>
                                </select>
                            )}
                        </div>
                        <div className="flex justify-between">
                            {selectedProgram !== "bePowered" ? (
                                <>
                                    <div className="flex flex-col items-start w-full">
                                        <p className="text-lg text-[#d71e42] font-bold">
                                            RM{" "}
                                            {selectedProgram === "bePowered"
                                                ? ((25000 * (selectedPlan === "60" ? 1.14 : 1.105)) / Number(selectedPlan)).toLocaleString(
                                                    undefined,
                                                    {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    },
                                                )
                                                : (
                                                    ((totalExcludedAddonAmount - (bonus?.value || 0)) *
                                                        (selectedPlan === "60" ? 1.14 : 1.105)) /
                                                    Number(selectedPlan)
                                                ).toLocaleString(undefined, {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                })}
                                            <span className="text-sm text-gray-600">/month </span>
                                            <span className="text-xs text-gray-600">for {selectedPlan === "60" ? "60" : "36"} months</span>
                                        </p>
                                        <div className="flex justify-between w-full">
                                            <p className="italic text-gray-600 text-xs flex items-center">
                                                <span>(Terms & Conditions)</span>
                                                <button className="mx-1" data-modal-toggle="#payment_info_modal">
                                                    <InformationCircleIcon className="w-4 h-4 text-yellow-500" aria-label="Payment Info" />
                                                </button>
                                            </p>
                                        </div>
                                    </div>

                                    <select
                                        className="flex select select-sm w-fit pr-8 border border-gray-300 rounded-md bg-white py-0 px-2 text-2xs h-6 appearance-none"
                                        id="payment_plan"
                                        value={selectedPlan}
                                        onChange={handlePlanChange}
                                        name="payment_plan"
                                    >
                                        <option value="36">36 months</option>
                                        <option value="60">60 months</option>
                                    </select>
                                </>
                            ) : (
                                <div className="flex flex-col items-start w-full">
                                    <p className="text-lg text-[#d71e42] font-bold">
                                        <span className="text-sm text-gray-600">Total </span>
                                        RM 25,000
                                        <span className="text-sm text-gray-600"> Upfront</span>
                                    </p>
                                    <p className="text-sm text-[#d71e42] font-bold">
                                        RM{" "}
                                        {hasBePoweredPackages()
                                            ? ((25000 * (selectedPlan === "60" ? 1.14 : 1.105)) / Number(selectedPlan)).toLocaleString(
                                                undefined,
                                                {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                },
                                            )
                                            : (
                                                ((totalExcludedAddonAmount - (bonus?.value || 0)) * (selectedPlan === "60" ? 1.14 : 1.105)) /
                                                Number(selectedPlan)
                                            ).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            })}
                                        <span className="text-sm text-gray-600">/month </span>
                                        <span className="text-xs text-gray-600">for {selectedPlan === "60" ? "60" : "36"} months</span>
                                    </p>
                                    <div className="flex justify-between w-full">
                                        <p className="italic text-gray-600 text-xs flex items-center">
                                            <span>(Terms & Conditions)</span>
                                            <button className="mx-1" data-modal-toggle="#payment_info_modal">
                                                <InformationCircleIcon className="w-4 h-4 text-yellow-500" aria-label="Payment Info" />
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-start justify-between mt-4">
                            {selectedProgram === "bePowered" ? (
                                <div className="flex flex-col space-y-2">
                                    <span className="text-2xs font-semibold text-gray-600 p-2 border border-gray-300 rounded-md">
                                        Normal Price: RM{" "}
                                        {(totalExcludedAddonAmount - (bonus?.value || 0)).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-600">
                                        <strong>Or</strong> pay one-time: RM{" "}
                                        {(totalExcludedAddonAmount - (bonus?.value || 0)).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            )}
                            <button
                                className="md:hidden italic underline text-blue-600 text-xs"
                                onClick={() => toggleAccordion("amount_breakdown")}
                            >
                                {openAccordions["amount_breakdown"] ? "Hide Details" : "See Details"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmUnincludeAddon pkg={selectedConfirmPkg} onSubmit={handleToggleAddonPackage} />

            <PaymentInfoModal />

            <AgreePartitionRiskModal onChange={setAgreePartitionRisk} />

            <ROIProgramModal isOpen={isRoiModalOpen} property={property} />

            {/* <div className="fixed bottom-10 right-6">
                <button className="btn btn-outline btn-primary rounded-full" data-scrollto="#footer">
                    <i className="ki-outline ki-black-down">
                    </i>
                </button>
            </div> */}
        </>
    )
}

export default OrderOverview
