"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import type { Order, Package, Product } from "../../types/index"
import Loading from "../../components/Loading"
import { Slide, toast } from "react-toastify"
import KTComponent, { KTModal } from "../../metronic/core"
import useFetchOwnerOrder from "../../hook/useFetchOwnerOrder"
import { Link } from "react-router-dom"
import { toggleOwnerOrderAddon } from "../../services/ownerApi"
import ConfirmUnincludeAddon from "./components/Modals/ConfirmUnincludeAddon"
import { CreditCardIcon, InformationCircleIcon } from "@heroicons/react/24/outline"
import PaymentInfoModal from "./components/Modals/PaymentInfoModal"
import AgreePartitionRiskModal from "./components/Modals/AgreePartitionRiskModal"
import { CalendarDateRangeIcon } from "@heroicons/react/24/solid"
import accordion from "../../metronic/core/plugins/components/accordion"

const LOCAL_PATH_PREFIX = import.meta.env.VITE_APP_ENV === "local" ? '/owner/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

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
    const [selectedConfirmPkg, setSelectedConfirmPkg] = useState<Package>(null)
    const [totalExcludedAddonAmount, setTotalExcludedAddonAmount] = useState<number>(0)

    const [selectedPlan, setSelectedPlan] = useState<string>("60")

    const [activeTab, setActiveTab] = useState("tab_1_1")
    const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({})

    const [agreeTnc, setAgreeTnc] = useState(false)
    const [agreeRenoAgreement, setAgreeRenoAgreement] = useState(false)
    const [agreePartitionRisk, setAgreePartitionRisk] = useState(false)

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
                amount_breakdown: false
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
        <ul className="list-disc list-inside space-y-4 text-sm">
            <li>
                This quotation is only valid for 7 days. If BeLive receives the Client’s confirmation after 7 days, BeLive
                reserves the right to make changes to the quotation.
            </li>
            <li>
                BeLive reserves the right to decide on the overall design and theme, the selection of furniture, fixtures, and
                fittings for the Client’s unit including the colour and material of products.
            </li>
            <li>The pre-booking payment has a grace period of 7 days upon booking payment.</li>
            <li>
                Any pictures or illustrations shown are for reference purposes only. BeLive will attempt to create a similar
                concept; however, some items may be seasonal, and BeLive reserves the right to substitute similar products of
                equivalent quality at our discretion.
            </li>
            <li>
                BeLive is allowed to take photos of the renovation and the end product for marketing and promotional purposes.
            </li>
            <li>
                BeLive reserves the right to replace the items as quoted with products of equivalent or higher value, of similar
                functionality, and/or purpose.
            </li>
            <li>The commencement date for the renovation shall be determined at the sole discretion of BeLive.</li>
            <li>
                BeLive will make reasonable efforts to meet the specified completion dates. However, unforeseen circumstances
                may lead to adjustments in the timeline. The Client will be informed of any changes.
            </li>
            <li>
                In the event of non-payment or breach of contract by the Client, BeLive reserves the right to suspend work until
                the issue is resolved. Any additional costs incurred as a result of such suspension will be borne by the Client.
            </li>
            <li>
                The bank interest rate for the installment plan may change by the bank(s) without prior notification to the
                Client.
            </li>
            <li>
                For safety and security reasons, access/execution of all works by BeLive staff, suppliers, contractors, and
                sub-contractors requires the unit to be vacated during the entire duration of renovation work.
            </li>
            <li>
                The Client consents to refrain from accessing the unit without prior notification to the BeLive team. Entry
                should be coordinated with a designated team member if the Client wishes to enter the unit during the renovation
                period.
            </li>
            <li>
                It is advised that the Client refrain from staying in the unit during the renovation period. Occupancy may
                impact renovation progress and could raise safety concerns.
            </li>
            <li>
                The Client acknowledges that the scope of work for this renovation project is fixed, and no changes,
                alterations, or customizations are permitted once the quotation is signed.
            </li>
            <li>
                The quotation includes up to 6 feet of copper piping per air conditioning unit. An additional charge of RM25 per
                foot will apply for any additional copper piping required.
            </li>
            <li>
                This quotation includes the supply and installation of kitchen cabinets up to the length specified. Any
                additional length will incur extra charges.
            </li>
            <li>
                Complimentary items are provided if required for the unit, subject to necessity. These items are
                non-exchangeable for cash, discounts, or any other value. If deemed unnecessary for the unit, they will not be
                applicable for redemption.
            </li>
            <li>
                Payment verification: Kindly WhatsApp us at +6011-5698 5313 with the bank-in slip or online payment receipt,
                along with the client’s name, development name, and unit number.
            </li>
            <li>
                It shall be the Client’s duty to ensure that all details ascribed in the email are correct and accurate. BeLive
                shall not be held responsible for any discrepancies.
            </li>
            <li>
                Renovations proceed in batches based on a first-come, first-served basis. BeLive is not responsible for delays
                due to a lack of documents or payment delays.
            </li>
            <li>
                The Client assumes all risk for installing a partition. BeLive is not liable for penalties or removal costs
                requested by authorities.
            </li>
            <li>
                The Client is solely responsible for paying the renovation deposit to the management office and for handling all
                related matters.
            </li>
            <li>
                For all goods, products, and materials under the renovation work, BeLive reserves the right to remove any
                furniture and/or fittings up to the value of the amount owing to BeLive.
            </li>
            <li>
                If the Client opts to make payment using a credit card, an additional admin fee of 2% will apply. This charge is
                not applicable for credit card installment plans, FPX, or bank transfers.
            </li>
            <li>Any payment made is non-refundable.</li>
            <li>
                By signing this quotation, the Client acknowledges and agrees to the terms and conditions outlined in the
                quotation and the attached renovation agreement.
            </li>
        </ul>
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
                    <strong>42-46, Ground Floor, Jalan SS 19/1d, SS 19, 46500 Subang Jaya, Selangor</strong> (“the Contractor”) of
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
                    services of the Contractor for the renovation of the Owner’s property described as{" "}
                    <strong>
                        A (1) unit of Service Residence known as {orderDetail.block}-{orderDetail.floor}-{orderDetail.unit_no},{" "}
                        {orderDetail.property.name}, {propertyAddress}
                    </strong>{" "}
                    (the “Property”) subject to the terms and conditions hereinafter appearing.
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
                        (“Works”) at an agreed lump sum of <strong>Ringgit Malaysia (RM) ONLY</strong> (the “said Contract Sum”)
                        payable by instalments/progressive payment in accordance with the <strong>First Schedule</strong> hereof,
                        subject to the Owner’s right of inspection as set forth below.
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
                            (b) defects of the Property shall be duly rectified, repaired and fixed by the Developer’s defects’ teams
                            and workers with the Owner or the Contractor’s approval;
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
                        or any approved extension period by all parties (“the said Contract Time”). Time wherever mentioned shall be
                        of the essence of this Agreement.
                    </span>
                    <span>
                        2.4 For the avoidance of doubt, renovation Phase 1 includes wiring, painting, and installation of smart
                        devices while renovation Phase 2 includes the supply and installation of furniture and loose items.
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>3. FORCE MAJEURE</strong>
                    </span>
                    <span>
                        3.1 Notwithstanding <strong>Clause 4</strong>, no party shall be held liable in the performance of any
                        obligations under this Agreement resulting from “Force Majeure” which shall include Movement Control Order
                        (“MCO”), Full Movement Control Order (“FMCO”), Extended Movement Control Order (“EMCO”), acts of God, fire,
                        or other catastrophe, storms, curfew, blockade, government restrictions and/or change in government
                        policies, war, strikes or other labour disturbances, acute shortage of building materials, acts of civil or
                        military authorities or any other causes beyond the control of the party thereby affected whether similar or
                        dissimilar from the foregoing <strong>PROVIDED ALWAYS THAT</strong> the party claiming to be affected by any
                        event of force majeure shall as soon as practicable give written notice of such claim to the other party
                        with full particulars thereof.
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>4. CONTRACTOR’S DUTIES, OBLIGATIONS, RIGHTS AND INTERESTS</strong>
                    </span>
                    <span>
                        4.1 The Contractor shall be responsible for the purchase and delivery of materials, except in the event that
                        the Owner volunteers for economic considerations. All materials at the Property shall be at the risk of the
                        Contractor during the said Contract Time and if the Owner volunteered for the purchase and delivery of
                        materials, such risk shall be passed to the Owner.
                    </span>
                    <span>
                        4.2 The Works shall be constructed in a good and workmanlike manner in accordance with the description and
                        specification as set out in the Quotation hereto, which description and specification have been duly
                        accepted and approved by the Owner, as the Owner hereby acknowledges via the instant messaging services such
                        as email and/or WhatsApp.
                    </span>
                    <span>
                        4.3 The Contractor will furnish and be fully responsible for all equipment, labour, transportation,
                        construction equipment and machinery, tools, appliances, fuel, power, light, heat and all other facilities
                        and incidentals necessary for the furnishing, performance, testing, start-up, and completion of the Work.
                    </span>
                    <span>
                        4.4 The Contractor will provide competent, suitable personnel to perform services as required and will at
                        all times maintain good discipline and order at the Property.
                    </span>
                    <span>
                        4.5 The Contractor may sub-contract the Works or any part thereof to any subcontractor(s) or party(ies) as
                        is customary in the construction industry provided that the Contractor shall be solely liable to the Owner
                        for any act or default by its subcontractor(s).
                    </span>
                    <span>
                        4.6 The Contractor may update the Owner from time to time on the progress of works by attach the photos of
                        the works done by the Contractor and/or subcontractor(s), the photos and description of works shall form
                        part of this Agreement by way of video or photos to be sent to the Owner by way of WhatsApp or any way the
                        Contractor deems appropriate.
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>5. NOTICES</strong>
                    </span>
                    <span>
                        5.1 Any notice required to be given under this Agreement shall be deemed to be sufficiently served if sent
                        by registered post or ordinary post to the party to whom such notice is being served at its address given
                        herein and such notice shall be deemed to be received in the ordinary course of post{" "}
                        <strong>three (3) working days</strong> after posting.
                    </span>
                    <span>
                        5.2 Notwithstanding <strong>Clause 5.1</strong> above, any notice required to be given under this Agreement
                        shall be deemed to be sufficiently served by way of instant messaging services such as email and/or WhatsApp
                        to the party to whom such notice is being served at its email address and/or WhatsApp number/account given
                        herein and such notice shall be deemed to be received instantly within{" "}
                        <strong>twenty four (24) hours</strong> after sent out.
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>6. COSTS</strong>
                    </span>
                    <span>
                        6.1 Unless otherwise agreed, all the legal costs, stamp duty of and incidental to this Agreement shall be
                        borne and paid by the Contractor solely.
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>7. SPECIAL CONDITIONS, SCHEDULES AND APPENDIX</strong>
                    </span>
                    <span>
                        7.1 The Special Conditions, Schedules and Appendix hereinafter stipulated shall for an integral part of this
                        Agreement and in the event of any inconsistency or repugnant terms in the aforementioned Agreement, the
                        provisions contained in the Special Conditions shall prevail.
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>8. GOVERNING LAW</strong>
                    </span>
                    <span>
                        8.1 This Agreement shall in all respect, include all matters of construction, validity and performance be
                        governed by, construed and enforced exclusively in accordance with the laws of Malaysia. The parties shall
                        submit to the exclusive jurisdiction of the Malaysian courts.
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>9. WARRANTY AND DEFECT PERIOD</strong>
                    </span>
                    <span>
                        9.1 The Contractor warrants that each Product sold, installed and provided by the Contractor under this
                        Agreement will conform to its Specifications for the Warranty and Defect period (the “said Product
                        Warranty”). In the event if the Products are not conformed to its Specifications due to the Contractor’s
                        fault, the Contractor shall grant Product Warranty and Defect claims to the Owner. The Product Warranty and
                        Defect claims must be in written and serve to The Contractor in pursuant to the Clause 5 of this Agreement.
                    </span>
                    <span>
                        9.2 The Warranty and Defect period varies from <strong>Six (6) to Twelve (12) months</strong>, depending on
                        the type of the Products. The Warranty period for each of the Products models are described clearly in the
                        Second Schedule of this Agreement.
                    </span>
                    <span>
                        9.3 The Warranty and Defect period shall start from the date the Contractor installed the products and
                        ceases upon the expiration of the period. The Owner shall furnish to us this agreement together with the
                        sales receipt or original purchase invoice to the Contractor.
                    </span>
                    <span>In addition, this Warranty shall not applies in the following circumstances:-</span>
                    <div className="flex flex-col gap-3 pl-5">
                        <span>
                            (a) if any damages, abuse, negligent act or use, misuse, tampering, or wrongful usage including failure or
                            neglect to maintain the correct, proper and normal usage by the Owner, any end-users or third parties;
                        </span>
                        <span>
                            (b) if any damages, defects, malfunctions or non-functioning to or in the Product howsoever arising from,
                            caused by or incidental to any external cause (including accidents, fire, lightning, Act of God, exposure
                            to water or moisture, or caused by or during any or any attempted burglary, theft and/or riot), and any
                            corrosion, rust, staining or any other such like matters; and
                        </span>
                        <span>(c) any damages and defect caused by the Owner, any end-users or third parties.</span>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>10. NON-COMPLETION/ FAILURE TO HAND OVER</strong>
                    </span>
                    <span>
                        10.1 In the event where the Contractor fails and/or delay in handing over the Property in good, adequate and
                        final conditions as per the terms and conditions mentioned in this Agreement.
                    </span>
                    <span>
                        10.2 In default by the Contractor to hand over the Property in good, adequate and final conditions within
                        the said Contract Time, the Contractor shall be liable to pay penalty at the rate of{" "}
                        <strong>eight per centum (8%) per annum</strong> on daily basis on the undelivered items stated in the
                        Quotation, with the maximum claim sum not more than the said Contract Sum (the “said Liquidated Damages”).
                    </span>
                    <span>
                        10.3 The Contractor shall not be liable to pay the said Liquidated Damages in pursuant to{" "}
                        <strong>Clause 10.2</strong> in the event where the <strong>Clause 2.1 & 2.2</strong> above is not complied
                        with.
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>11. NO VARIATION</strong>
                    </span>
                    <span>
                        11.1 No variation of this Agreement of whatever nature shall be made or purported to be made by any party or
                        parties nor shall any variation or purported variation be valid or enforceable unless the same is in writing
                        and duly agreed to and executed by the parties concerned.
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>12. SEVERABILITY</strong>
                    </span>
                    <span>
                        12.1 If any provision of this Agreement for any reason shall be declared invalid, void, illegal or otherwise
                        unenforceable, the remaining provisions of this Agreement shall remain in full force and effect. The parties
                        shall amend that provision in such reasonable manner so as to achieve the intention of the parties without
                        illegality or where it is not practicable to do so, that provision shall be severed from this Agreement.
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <span>
                        <strong>13. BINDING EFFECTS</strong>
                    </span>
                    <span>
                        13.1 This Agreement shall be binding on the respective heirs, personal representatives, successors in title
                        and assigns of the parties hereto.
                    </span>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-6 text-center mb-6">
                <div className="flex flex-col">
                    <span className="font-bold underline">FIRST SCHEDULE</span>
                    <span>(to be taken read and construed as an essential part of this Agreement)</span>
                </div>
                <span className="font-bold">-</span>
                <span className="font-bold">PROGRESSIVE PAYMENT OF THE CONTRACT SUM</span>
                {orderDetail && orderDetail.is_progressive_payment ? (
                    <table className="table align-middle text-gray-700 font-medium text-sm max-w-lg">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className="text-center">%</th>
                                <th className="text-center">Amount (RM)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Upon Confirmation and before Commencement of Phase 1</td>
                                <td className="text-center">50</td>
                                <td className="text-center">
                                    {((totalExcludedAddonAmount - Number(bonus?.value || 0)) / 2).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </td>
                            </tr>
                            <tr>
                                <td>Upon Completion of Phase 1 and before Commencement of Phase 2</td>
                                <td className="text-center">50</td>
                                <td className="text-center">
                                    {((totalExcludedAddonAmount - Number(bonus?.value || 0)) / 2).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </td>
                            </tr>
                            <tr className="font-bold">
                                <td>Total:</td>
                                <td className="text-center">100</td>
                                <td className="text-center">
                                    {(totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <table className="table align-middle text-gray-700 font-medium text-sm max-w-lg">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className="text-center">%</th>
                                <th className="text-center">Amount (RM)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Upon Confirmation of Agreement</td>
                                <td className="text-center">100</td>
                                <td className="text-center">
                                    {orderDetail
                                        ? (totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })
                                        : "0.00"}
                                </td>
                            </tr>
                            <tr className="font-bold">
                                <td>Total:</td>
                                <td className="text-center">100</td>
                                <td className="text-center">
                                    {orderDetail
                                        ? (totalExcludedAddonAmount - Number(bonus?.value || 0)).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })
                                        : "0.00"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
                <span>
                    In the event of a default by the Owner of the payment hereunder when due, the Owner shall be liable to pay
                    interest at the rate of eight per centum (8%) per annum on the outstanding sum from the date due for payment
                    until the date of actual payment.
                </span>
            </div>
        </div>
    )

    const isButtonDisabled = !(agreeTnc && agreeRenoAgreement && agreePartitionRisk)

    return (
        <>
            <div className={`flex w-full px-2 ${openAccordions["amount_breakdown"]
                ? "mb-40"
                : "mb-0"
                }`}>
                <div className="card flex-auto w-full max-w-4xl">
                    {/* Header */}
                    <div className="card-header flex justify-between">
                        <div className="flex gap-4 justify-center">
                            <Link to={LOCAL_PATH_PREFIX + "quotations"} className="ki-solid ki-arrow-left items-center text-gray-900"></Link>
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
                        <div className="tabs mb-5">
                            <button
                                className={`tab ${activeTab === "tab_1_1" ? "active" : ""}`}
                                onClick={() => setActiveTab("tab_1_1")}
                            >
                                {orderDetail.status === "confirmed" ? "Overview" : "Quotation Order"}
                            </button>
                            {orderDetail.status === "confirmed" ? (
                                <button
                                    className={`tab ${activeTab === "tab_1_4" ? "active" : ""}`}
                                    onClick={() => setActiveTab("tab_1_4")}
                                >
                                    Quotation Order
                                </button>
                            ) : (
                                ""
                            )}
                            <button
                                className={`tab ${activeTab === "tab_1_2" ? "active" : ""}`}
                                onClick={() => setActiveTab("tab_1_2")}
                            >
                                T&C
                            </button>
                            <button
                                className={`tab ${activeTab === "tab_1_3" ? "active" : ""}`}
                                onClick={() => setActiveTab("tab_1_3")}
                            >
                                Reno Agreement
                            </button>
                        </div>

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
                                        <div
                                            className={`card w-full bg-white rounded-lg shadow-md`}
                                        >
                                            <div className="card-body p-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1 mb-2">
                                                            <CreditCardIcon className="w-5 h-5 text-blue-600" aria-label="Payment Icon" />
                                                            <span className="text-xs font-semibold text-gray-700">Easy Payment Plan</span>
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
                                                    </div>

                                                    <div className="flex">
                                                        <div className="flex flex-col items-start">
                                                            <p className="text-lg text-[#d71e42] font-bold">
                                                                RM{" "}
                                                                {(
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

                                                    <div className="flex items-start justify-between mt-4">
                                                        <span className="text-xs text-gray-600">
                                                            <strong>Or</strong> pay one-time: RM{" "}
                                                            {(totalExcludedAddonAmount - (bonus?.value || 0)).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </span>
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
                                                                            <div className="inline-block">
                                                                                <span className="badge bg-white border-blue-300">
                                                                                    x{prodPackage.quantity}
                                                                                </span>
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

                        {/* T&C Tab */}
                        <div className={activeTab === "tab_1_2" ? "block" : "hidden"} id="tab_1_2">
                            <div className="prose max-w-none p-4 text-xs">{tnc}</div>
                        </div>

                        {/* Reno Agreement Tab */}
                        <div className={activeTab === "tab_1_3" ? "block" : "hidden"} id="tab_1_3">
                            <div className="prose max-w-none p-4 text-xs">{renoAgreement}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            {orderDetail.status !== "confirmed" && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white p-3 px-5 z-50 transition-all duration-300 rounded-t-xl shadow-[0_-6px_12px_rgba(0,0,0,0.25)]">
                    {/* Accordion content with conditional border-top */}
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openAccordions["amount_breakdown"]
                            ? "max-h-screen"
                            : "max-h-0 md:max-h-screen"
                            }`}
                    >
                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <h3 className="text-sm text-purple-600 font-bold mb-1">Summary:</h3>
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

                        <hr className="my-2" />
                    </div>

                    <div className="flex flex-col space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <CreditCardIcon className="w-5 h-5 text-blue-600" aria-label="Payment Icon" />
                                <span className="text-xs font-semibold text-gray-700">Easy Payment Plan</span>
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
                        </div>
                        <div className="flex">
                            <div className="flex flex-col items-start w-full">
                                <p className="text-lg text-[#d71e42] font-bold">
                                    RM{" "}
                                    {(
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
                        </div>
                        <div className="flex items-start justify-between mt-4">
                            <span className="text-xs text-gray-600">
                                <strong>Or</strong> pay one-time: RM{" "}
                                {(totalExcludedAddonAmount - (bonus?.value || 0)).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
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
