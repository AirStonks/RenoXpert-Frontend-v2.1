// "use client"

// import React, { useState, useEffect } from "react"
// import { Eye, Clock, ChevronDown, ChevronUp, Package, DollarSign, User, Building, Calendar, Truck, PlusIcon } from "lucide-react"
// import { Link } from "react-router-dom"

// const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

// // Mock data types based on your interfaces
// interface PurchaseOrder {
//     id: string
//     po_no: string
//     property: {
//         name: string
//         block: string
//         unit_no: string
//     }
//     sales: Array<{
//         id: string
//         sales_no: string
//         sales_date: string
//     }>
//     owner: {
//         name: string
//         email: string
//     }
//     vendor: {
//         name: string
//         email: string
//         phone?: string
//     }
//     total_amount: number
//     order_status: "pending" | "approved" | "shipped" | "delivered" | "cancelled"
//     created_at: string
//     updated_at: string
// }

// type SortOrder = "asc" | "desc"
// type SortField = "po_no" | "total_amount" | "order_status" | "created_at"

// const statusConfig = {
//     pending: { label: "Pending", color: "bg-yellow-500", textColor: "text-white" },
//     approved: { label: "Approved", color: "bg-blue-500", textColor: "text-white" },
//     shipped: { label: "Shipped", color: "bg-purple-500", textColor: "text-white" },
//     delivered: { label: "Delivered", color: "bg-green-500", textColor: "text-white" },
//     cancelled: { label: "Cancelled", color: "bg-red-500", textColor: "text-white" },
// }

// // Mock data
// const mockPurchaseOrders: PurchaseOrder[] = [
//     {
//         id: "1",
//         po_no: "RPO-2500001",
//         property: {
//             name: "Skyline Residences",
//             block: "A",
//             unit_no: "12-05",
//         },
//         sales: [
//             {
//                 id: "sale-001",
//                 sales_no: "RSO-2500001",
//                 sales_date: "2024-01-10T09:00:00Z",
//             },
//             {
//                 id: "sale-002",
//                 sales_no: "RSO-2500002",
//                 sales_date: "2024-01-12T14:30:00Z",
//             },
//         ],
//         owner: {
//             name: "John Smith",
//             email: "john.smith@email.com",
//         },
//         vendor: {
//             name: "Premium Supplies Co.",
//             email: "orders@premiumsupplies.com",
//             phone: "+60123456789",
//         },
//         total_amount: 25000.0,
//         order_status: "approved",
//         created_at: "2024-01-15T10:30:00Z",
//         updated_at: "2024-01-16T14:20:00Z",
//     },
//     {
//         id: "2",
//         po_no: "RPO-2500002",
//         property: {
//             name: "Marina Bay Towers",
//             block: "B",
//             unit_no: "08-12",
//         },
//         sales: [
//             {
//                 id: "sale-003",
//                 sales_no: "RSO-2500003",
//                 sales_date: "2024-01-08T11:15:00Z",
//             },
//         ],
//         owner: {
//             name: "Sarah Johnson",
//             email: "sarah.johnson@email.com",
//         },
//         vendor: {
//             name: "BuildTech Solutions",
//             email: "support@buildtech.com",
//             phone: "+60198765432",
//         },
//         total_amount: 18500.0,
//         order_status: "shipped",
//         created_at: "2024-01-14T09:15:00Z",
//         updated_at: "2024-01-17T11:45:00Z",
//     },
//     {
//         id: "3",
//         po_no: "RPO-2500003",
//         property: {
//             name: "Garden Heights",
//             block: "C",
//             unit_no: "15-03",
//         },
//         sales: [
//             {
//                 id: "sale-004",
//                 sales_no: "RSO-2500004",
//                 sales_date: "2024-01-05T16:20:00Z",
//             },
//             {
//                 id: "sale-005",
//                 sales_no: "RSO-2500005",
//                 sales_date: "2024-01-07T10:45:00Z",
//             },
//             {
//                 id: "sale-006",
//                 sales_no: "RSO-2500006",
//                 sales_date: "2024-01-09T13:30:00Z",
//             },
//         ],
//         owner: {
//             name: "Michael Chen",
//             email: "michael.chen@email.com",
//         },
//         vendor: {
//             name: "Elite Materials Ltd.",
//             email: "procurement@elitematerials.com",
//             phone: "+60187654321",
//         },
//         total_amount: 32000.0,
//         order_status: "pending",
//         created_at: "2024-01-13T16:45:00Z",
//         updated_at: "2024-01-13T16:45:00Z",
//     },
//     {
//         id: "4",
//         po_no: "RPO-2500004",
//         property: {
//             name: "Oceanview Suites",
//             block: "D",
//             unit_no: "20-08",
//         },
//         sales: [
//             {
//                 id: "sale-007",
//                 sales_no: "RSO-2500007",
//                 sales_date: "2024-01-03T08:00:00Z",
//             },
//         ],
//         owner: {
//             name: "Emily Davis",
//             email: "emily.davis@email.com",
//         },
//         vendor: {
//             name: "Apex Construction Supply",
//             email: "orders@apexconstruction.com",
//             phone: "+60176543210",
//         },
//         total_amount: 41200.0,
//         order_status: "delivered",
//         created_at: "2024-01-12T13:20:00Z",
//         updated_at: "2024-01-18T10:30:00Z",
//     },
// ]

// export default function POMain() {
//     const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
//     const [isLoading, setIsLoading] = useState<boolean>(true)
//     const [page, setPage] = useState<number>(1)
//     const [size, setSize] = useState<number>(10)
//     const [totalItems, setTotalItems] = useState<number>(0)
//     const [searchTerm, setSearchTerm] = useState<string>("")
//     const [sortField, setSortField] = useState<SortField>("po_no")
//     const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
//     const [expandedRows, setExpandedRows] = useState<string[]>([])

//     useEffect(() => {
//         document.title = "Purchase Orders Overview | RenoXpert"
//         fetchPurchaseOrders()
//     }, [])

//     const fetchPurchaseOrders = async () => {
//         try {
//             setIsLoading(true)
//             // Simulate API call
//             setTimeout(() => {
//                 setPurchaseOrders(mockPurchaseOrders)
//                 setTotalItems(mockPurchaseOrders.length)
//                 setIsLoading(false)
//             }, 1000)
//         } catch (error) {
//             console.error("Error fetching purchase orders:", error)
//             setIsLoading(false)
//         }
//     }

//     const handlePageChange = (newPage: number) => {
//         if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
//         setPage(newPage);
//         // fetchProjects(newPage, size, searchTerm, sortOrder, sortField, filterStatus);
//         fetchPurchaseOrders();
//     };

//     const handleSizeChange = (newSize: number) => {
//         setSize(newSize);
//         setPage(1);
//         // fetchProjects(1, newSize, searchTerm, sortOrder, sortField, filterStatus);
//         fetchPurchaseOrders();
//     };

//     const formatDate = (dateString: string) => {
//         return new Date(dateString).toLocaleDateString("en-MY", {
//             year: "numeric",
//             month: "short",
//             day: "numeric",
//             hour: "2-digit",
//             minute: "2-digit",
//         })
//     }

//     const formatDateShort = (dateString: string) => {
//         return new Date(dateString).toLocaleDateString("en-MY", {
//             year: "numeric",
//             month: "short",
//             day: "numeric",
//         })
//     }

//     const formatCurrency = (amount: number) => {
//         return new Intl.NumberFormat("en-MY", {
//             style: "currency",
//             currency: "MYR",
//         }).format(amount)
//     }

//     const toggleRowExpansion = (id: string) => {
//         setExpandedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
//     }

//     const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setSearchTerm(e.target.value)
//         // Implement search logic here
//     }

//     const SkeletonRow = () => (
//         <tr className="border-b">
//             <td className="px-4 py-3">
//                 <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
//             </td>
//             <td className="px-6 py-4">
//                 <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
//                 <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
//             </td>
//             <td className="px-6 py-4">
//                 <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
//                 <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
//             </td>
//             <td className="px-6 py-4">
//                 <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1"></div>
//                 <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
//             </td>
//             <td className="px-6 py-4">
//                 <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
//             </td>
//             <td className="px-6 py-4">
//                 <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
//             </td>
//             <td className="px-6 py-4">
//                 <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
//                 <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
//             </td>
//             <td className="px-6 py-4">
//                 <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
//             </td>
//             <td className="px-6 py-4">
//                 <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1"></div>
//                 <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
//             </td>
//             <td className="px-6 py-4">
//                 <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
//             </td>
//         </tr>
//     )


//     const totalPages = Math.ceil(totalItems / size);

//     return (
//         <div className="min-h-screen bg-gray-100 p-4">
//             {/* Header */}
//             <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-6 z-10">
//                 <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//                     <div className="flex items-center gap-3">
//                         <Package className="h-8 w-8 text-blue-600" />
//                         <h1 className="text-2xl font-bold text-gray-800">Purchase Orders Overview</h1>
//                     </div>
//                     <div className="flex gap-3 flex-wrap">
//                         <input
//                             type="text"
//                             placeholder="Search purchase orders..."
//                             value={searchTerm}
//                             onChange={handleSearch}
//                             className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         />
//                         <Link
//                             to={LOCAL_PATH_PREFIX + 'orders/create'}
//                             className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
//                         >
//                             <PlusIcon className="h-5 w-5" />
//                             Create New PO
//                         </Link>
//                     </div>
//                 </div>
//             </div>

//             {/* Summary Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//                     <div className="flex items-center justify-between">
//                         <div>
//                             <p className="text-sm font-medium text-gray-600">Total Orders</p>
//                             <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
//                         </div>
//                         <Package className="h-8 w-8 text-gray-400" />
//                     </div>
//                 </div>
//                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//                     <div className="flex items-center justify-between">
//                         <div>
//                             <p className="text-sm font-medium text-gray-600">Total Value</p>
//                             <p className="text-2xl font-bold text-gray-900">
//                                 {formatCurrency(purchaseOrders.reduce((sum, po) => sum + po.total_amount, 0))}
//                             </p>
//                         </div>
//                         <DollarSign className="h-8 w-8 text-gray-400" />
//                     </div>
//                 </div>
//                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//                     <div className="flex items-center justify-between">
//                         <div>
//                             <p className="text-sm font-medium text-gray-600">Pending</p>
//                             <p className="text-2xl font-bold text-gray-900">
//                                 {purchaseOrders.filter((po) => po.order_status === "pending").length}
//                             </p>
//                         </div>
//                         <Clock className="h-8 w-8 text-gray-400" />
//                     </div>
//                 </div>
//                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//                     <div className="flex items-center justify-between">
//                         <div>
//                             <p className="text-sm font-medium text-gray-600">Delivered</p>
//                             <p className="text-2xl font-bold text-gray-900">
//                                 {purchaseOrders.filter((po) => po.order_status === "delivered").length}
//                             </p>
//                         </div>
//                         <Building className="h-8 w-8 text-gray-400" />
//                     </div>
//                 </div>
//             </div>

//             {/* Table */}
//             <div className="bg-white rounded-lg shadow-md overflow-x-auto">
//                 <table className="w-full text-sm text-left text-gray-700">
//                     <thead className="bg-gray-50 text-gray-800 sticky top-0">
//                         <tr>
//                             <th className="px-4 py-3 w-12"></th>
//                             <th className="px-6 py-4 font-semibold">PO Number</th>
//                             <th className="px-6 py-4 font-semibold">
//                                 Unit
//                             </th>
//                             <th className="px-6 py-4 font-semibold">Owner</th>
//                             <th className="px-6 py-4 font-semibold">Total Amount</th>
//                             <th className="px-6 py-4 font-semibold">Order Status</th>
//                             <th className="px-6 py-4 font-semibold">Associated Sales Number</th>
//                             <th className="px-6 py-4 font-semibold">Sales Date</th>
//                             <th className="px-6 py-4 font-semibold">Vendor</th>
//                             <th className="px-6 py-4 font-semibold">Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                         {isLoading
//                             ? Array.from({ length: size }).map((_, index) => <SkeletonRow key={index} />)
//                             : purchaseOrders.map((po) => (
//                                 <React.Fragment key={po.id}>
//                                     <tr className="hover:bg-gray-50 transition-colors">
//                                         <td className="px-4 py-3">
//                                             <button
//                                                 onClick={() => toggleRowExpansion(po.id)}
//                                                 className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
//                                             >
//                                                 {expandedRows.includes(po.id) ? (
//                                                     <ChevronUp className="h-5 w-5" />
//                                                 ) : (
//                                                     <ChevronDown className="h-5 w-5" />
//                                                 )}
//                                             </button>
//                                         </td>
//                                         <td className="px-6 py-4">
//                                             <div>
//                                                 <p className="font-medium text-gray-900">{po.po_no}</p>
//                                                 <p className="text-xs text-gray-500">ID: {po.id}</p>
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4">
//                                             <div className="space-y-1">
//                                                 <p className="font-medium text-gray-900">{po.property.name}</p>
//                                                 <p className="text-sm text-gray-600">
//                                                     {po.property.block}-{po.property.unit_no}
//                                                 </p>
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4">
//                                             <div>
//                                                 <p className="font-medium text-gray-900 flex items-center gap-1">
//                                                     <User className="h-4 w-4" />
//                                                     {po.owner.name}
//                                                 </p>
//                                                 <p className="text-sm text-gray-600">{po.owner.email}</p>
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4">
//                                             <p className="font-semibold text-lg text-green-600">{formatCurrency(po.total_amount)}</p>
//                                         </td>
//                                         <td className="px-6 py-4">
//                                             <span
//                                                 className={`px-2 py-1 rounded-full text-sm font-medium ${statusConfig[po.order_status].color} ${statusConfig[po.order_status].textColor}`}
//                                             >
//                                                 {statusConfig[po.order_status].label}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4">
//                                             <div className="space-y-1">
//                                                 {po.sales.slice(0, 2).map((sale) => (
//                                                     <p
//                                                         key={sale.id}
//                                                         className="font-mono text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
//                                                     >
//                                                         {sale.sales_no}
//                                                     </p>
//                                                 ))}
//                                                 {po.sales.length > 2 && (
//                                                     <p className="text-xs text-gray-500 font-medium">+{po.sales.length - 2} more sales</p>
//                                                 )}
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4">
//                                             <div className="space-y-1">
//                                                 {po.sales.slice(0, 2).map((sale) => (
//                                                     <div key={sale.id} className="flex items-center text-sm text-gray-600">
//                                                         <Calendar className="w-3 h-3 mr-1" />
//                                                         {formatDateShort(sale.sales_date)}
//                                                     </div>
//                                                 ))}
//                                                 {po.sales.length > 2 && <p className="text-xs text-gray-500">+{po.sales.length - 2} more</p>}
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4">
//                                             <div>
//                                                 <p className="font-medium text-gray-900 flex items-center gap-1">
//                                                     <Truck className="h-4 w-4" />
//                                                     {po.vendor.name}
//                                                 </p>
//                                                 <p className="text-sm text-gray-600">{po.vendor.email}</p>
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4">
//                                             <button className="inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
//                                                 <Eye className="w-4 h-4" />
//                                                 View
//                                             </button>
//                                         </td>
//                                     </tr>
//                                     {expandedRows.includes(po.id) && (
//                                         <tr className="border-b">
//                                             <td colSpan={10} className="px-6 py-4">
//                                                 <div className="bg-gray-50 rounded-lg p-6 transition-all duration-300 ease-in-out">
//                                                     <h3 className="text-base font-semibold text-gray-800 mb-4">Purchase Order Details</h3>
//                                                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
//                                                         <div className="space-y-3">
//                                                             <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
//                                                                 Order Information
//                                                             </h4>
//                                                             <div>
//                                                                 <p className="font-medium text-gray-700">PO Number</p>
//                                                                 <p className="text-gray-600">{po.po_no}</p>
//                                                             </div>
//                                                             <div>
//                                                                 <p className="font-medium text-gray-700">Total Amount</p>
//                                                                 <p className="text-gray-600 font-semibold">{formatCurrency(po.total_amount)}</p>
//                                                             </div>
//                                                             <div>
//                                                                 <p className="font-medium text-gray-700">Status</p>
//                                                                 <span
//                                                                     className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[po.order_status].color} ${statusConfig[po.order_status].textColor}`}
//                                                                 >
//                                                                     {statusConfig[po.order_status].label}
//                                                                 </span>
//                                                             </div>
//                                                         </div>
//                                                         <div className="space-y-3">
//                                                             <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
//                                                                 Property Details
//                                                             </h4>
//                                                             <div>
//                                                                 <p className="font-medium text-gray-700">Property Name</p>
//                                                                 <p className="text-gray-600">{po.property.name}</p>
//                                                             </div>
//                                                             <div>
//                                                                 <p className="font-medium text-gray-700">Block & Unit</p>
//                                                                 <p className="text-gray-600">
//                                                                     Block {po.property.block}, Unit {po.property.unit_no}
//                                                                 </p>
//                                                             </div>
//                                                             <div>
//                                                                 <p className="font-medium text-gray-700">Owner</p>
//                                                                 <p className="text-gray-600">{po.owner.name}</p>
//                                                                 <p className="text-gray-500 text-xs">{po.owner.email}</p>
//                                                             </div>
//                                                         </div>
//                                                         <div className="space-y-3">
//                                                             <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
//                                                                 Associated Sales
//                                                             </h4>
//                                                             <div className="space-y-2">
//                                                                 {po.sales.map((sale) => (
//                                                                     <div key={sale.id} className="bg-white p-2 rounded border">
//                                                                         <p className="font-mono text-blue-600 text-sm">{sale.sales_no}</p>
//                                                                         <p className="text-xs text-gray-500 flex items-center gap-1">
//                                                                             <Calendar className="w-3 h-3" />
//                                                                             {formatDate(sale.sales_date)}
//                                                                         </p>
//                                                                     </div>
//                                                                 ))}
//                                                             </div>
//                                                         </div>
//                                                         <div className="space-y-3">
//                                                             <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
//                                                                 Vendor & Timeline
//                                                             </h4>
//                                                             <div>
//                                                                 <p className="font-medium text-gray-700">Vendor</p>
//                                                                 <p className="text-gray-600">{po.vendor.name}</p>
//                                                                 <p className="text-gray-500 text-xs">{po.vendor.email}</p>
//                                                                 {po.vendor.phone && <p className="text-gray-500 text-xs">{po.vendor.phone}</p>}
//                                                             </div>
//                                                             <div>
//                                                                 <p className="font-medium text-gray-700">Created</p>
//                                                                 <p className="text-gray-600">{formatDate(po.created_at)}</p>
//                                                             </div>
//                                                             <div>
//                                                                 <p className="font-medium text-gray-700">Last Updated</p>
//                                                                 <p className="text-gray-600">{formatDate(po.updated_at)}</p>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     )}
//                                 </React.Fragment>
//                             ))}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Pagination */}
//             {
//                 !isLoading && mockPurchaseOrders.length > 0 && (
//                     <div className="flex flex-col md:flex-row items-center justify-between mt-6 bg-white p-4 rounded-lg shadow-md">
//                         <div className="flex items-center gap-2 mb-4 md:mb-0">
//                             <span>Show</span>
//                             <select
//                                 value={size}
//                                 onChange={(e) => handleSizeChange(parseInt(e.target.value))}
//                                 className="border rounded-lg px-3 py-1"
//                             >
//                                 <option value="5">5</option>
//                                 <option value="10">10</option>
//                                 <option value="20">20</option>
//                                 <option value="30">30</option>
//                                 <option value="50">50</option>
//                             </select>
//                             <span>per page</span>
//                         </div>
//                         <div className="flex items-center gap-4">
//                             <span>
//                                 {(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}
//                             </span>
//                             <div className="flex gap-2">
//                                 <button
//                                     disabled={page === 1}
//                                     onClick={() => handlePageChange(page - 1)}
//                                     className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
//                                 >
//                                     Previous
//                                 </button>
//                                 {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
//                                     const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
//                                     const currentPage = startPage + index;
//                                     return (
//                                         <button
//                                             key={currentPage}
//                                             onClick={() => handlePageChange(currentPage)}
//                                             className={`px-3 py-1 border rounded-lg ${page === currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
//                                                 }`}
//                                         >
//                                             {currentPage}
//                                         </button>
//                                     );
//                                 })}
//                                 <button
//                                     disabled={page === totalPages}
//                                     onClick={() => handlePageChange(page + 1)}
//                                     className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
//                                 >
//                                     Next
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )
//             }
//         </div>
//     )
// }
