import React, { useEffect, useMemo, useState } from 'react';
import Quotation from './Quotation';
import { renoProgressIndex } from '../../services/api';
import { RenoProgress } from '../../types';

// function Test2() {
//     // Create styles

//     // Sample data - replace with your actual data
//     const company = {
//         name: "Tech Solutions Inc.",
//         address: "123 Business Street\nNew York, NY 10001",
//         mobile: "+1 (555) 123-4567",
//         email: "info@techsolutions.com",
//         logo: "https://via.placeholder.com/150" // Replace with your actual image URL or Base64 string
//     };

//     const attn = {
//         name: "Mr. John Doe",
//         address: "456 Client Avenue\nSuite 789\nLos Angeles, CA 90001",
//         mobile: "+1 (555) 987-6543",
//         email: "john.doe@clientcompany.com"
//     };

//     const items = [
//         { id: 1, description: "Web Development Service", quantity: 20, price: 75 },
//         { id: 2, description: "Technical Consulting", quantity: 10, price: 100 },
//         { id: 3, description: "Cloud Hosting", quantity: 12, price: 50 },
//         { id: 4, description: "Cloud Hosting", quantity: 12, price: 50 },
//         { id: 5, description: "Cloud Hosting", quantity: 12, price: 50 },
//         { id: 6, description: "Cloud Hosting", quantity: 12, price: 50 },
//     ];

//     const quotationDetails = {
//         number: "QT-2023-001",
//         date: new Date().toLocaleDateString()
//     };

//     // Calculate totals
//     const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
//     const tax = subtotal * 0.10; // Assuming 10% tax
//     const total = subtotal + tax;

//     // Helper function to convert an image URL to a Base64 string

//     return (
//         <div className='flex flex-col w-full'>
//             <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
//                 {/* Download PDF Button */}
//                 <div className="mb-4 w-max">
//                     <button
//                         // onClick={downloadPDF}
//                         className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
//                     >
//                         Download PDF
//                     </button>
//                 </div>

//                 {/* Quotation Content Rendered on the Page */}
//                 <div className='w-max'>
//                     {/* Company Header */}
//                     <div className="flex justify-between items-start mb-8">
//                         <div>
//                             <h1 className="text-2xl font-bold text-gray-800">{company.name}</h1>
//                             <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{company.address}</p>
//                             <p className="text-sm text-gray-600 mt-1">Mobile: {company.mobile}</p>
//                             <p className="text-sm text-gray-600">Email: {company.email}</p>
//                         </div>
//                         <div className="flex self-start">
//                             <img
//                                 src={'/app/RenoExpert_logo-01.jpg'}
//                                 alt="Company Logo"
//                                 className="w-32 h-32 object-contain rounded-lg"
//                             />
//                         </div>
//                     </div>

//                     {/* Quotation Header */}
//                     <div className="flex justify-between mb-8">
//                         <div>
//                             <h2 className="text-xl font-semibold text-gray-800">Quotation</h2>
//                             <p className="text-sm text-gray-600">Number: {quotationDetails.number}</p>
//                         </div>
//                         <p className="text-sm text-gray-600">Date: {quotationDetails.date}</p>
//                     </div>

//                     {/* Attn Section */}
//                     <div className="mb-8">
//                         <h3 className="text-sm font-semibold text-gray-800 mb-2">Attn:</h3>
//                         <p className="text-sm text-gray-600 whitespace-pre-wrap">{attn.name}</p>
//                         <p className="text-sm text-gray-600 whitespace-pre-wrap">{attn.address}</p>
//                         <p className="text-sm text-gray-600 mt-1">Mobile: {attn.mobile}</p>
//                         <p className="text-sm text-gray-600">Email: {attn.email}</p>
//                     </div>

//                     {/* Items Table */}
//                     <table className="w-full mb-8">
//                         <thead>
//                             <tr className="bg-gray-50">
//                                 <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Description</th>
//                                 <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Quantity</th>
//                                 <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Price</th>
//                                 <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {items.map((item) => (
//                                 <tr key={item.id} className="border-t border-gray-100">
//                                     <td className="py-3 px-4 text-sm text-gray-600">{item.description}</td>
//                                     <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.quantity}</td>
//                                     <td className="py-3 px-4 text-sm text-gray-600 text-right">${item.price.toFixed(2)}</td>
//                                     <td className="py-3 px-4 text-sm text-gray-600 text-right">${(item.quantity * item.price).toFixed(2)}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>

//                     {/* Totals */}
//                     <div className="text-right">
//                         <div className="inline-block text-sm">
//                             <p className="mb-2">
//                                 <span className="mr-4">Subtotal:</span>
//                                 <span>${subtotal.toFixed(2)}</span>
//                             </p>
//                             <p className="mb-2">
//                                 <span className="mr-4">Tax (10%):</span>
//                                 <span>${tax.toFixed(2)}</span>
//                             </p>
//                             <p className="text-lg font-semibold">
//                                 <span className="mr-4">Total:</span>
//                                 <span>${total.toFixed(2)}</span>
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//             <Quotation />
//         </div>
//     );
// }

interface TableColumn {
    field: keyof RenoProgress;
    header: string;
    sortable?: boolean;
    groupable?: boolean;
}

type GroupBy = string | null;

function Test2() {
    const [renoProgress, setRenoProgress] = useState<RenoProgress[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [groupBy, setGroupBy] = useState<GroupBy>('property.id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    // const [groupBy, setGroupBy] = useState<GroupBy>('property.id');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const columns: TableColumn[] = [
        { field: 'property.unit_no', header: 'Unit', sortable: true },
        { field: 'phase[0].jobs[0].status', header: 'VP', sortable: true },
        { field: 'phase[0].jobs[1].status', header: 'Key Handover', sortable: true },
        { field: 'phase[0].jobs[2].status', header: 'Key Mgnt', sortable: true },
        { field: 'phase[0].jobs[3].status', header: 'TNB', sortable: true },
        { field: 'phase[0].jobs[4].status', header: 'Water Sply', sortable: true },
    ];

    const groupableColumns = columns.filter(col => col.groupable);

    useEffect(() => {
        document.title = "TEST";
        initRenoProgressTable(1, 10, '', null, '');
    }, []);

    const initRenoProgressTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        setIsLoading(true);
        try {
            const response = await renoProgressIndex(size, page, searchTerm, order, field, false);
            const data = response?.data || [];
            setRenoProgress(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching renoProgress:', error);
            setError('Failed to load renoProgress');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const renderSortIcon = (field: string) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? '<ChevronUp size={16} />' : '<ChevronDown size={16} />';
    };

    const toggleGroup = (groupValue: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupValue)) {
                next.delete(groupValue);
            } else {
                next.add(groupValue);
            }
            return next;
        });
    };

    const groupedData = useMemo(() => {
        if (!groupBy) return null;

        const groups = new Map<string, RenoProgress[]>();
        renoProgress.forEach(item => {
            const groupValue = item.property?.id || 'Unassigned';
            const propertyName = item.property?.name || 'Unassigned Property';
            if (!groups.has(groupValue)) {
                groups.set(groupValue, []);
            }
            groups.get(groupValue)!.push(item);
        });

        return Array.from(groups.entries()).map(([key, items]) => ({
            key,
            name: items[0].property?.name || 'Unassigned Property',
            items,
            count: items.length
        }));
    }, [renoProgress, groupBy]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    // Add this header row right after opening the group content div
    const renderGroupContent = (group) => (
        <div className="p-4 space-y-2">
            {/* Column Headers */}
            <div className="grid grid-cols-6 gap-4 px-4 py-2 bg-gray-50 rounded-lg mb-2">
                {columns.map((column, index) => (
                    <div key={index} className="text-xs font-medium text-gray-200 uppercase tracking-wider">
                        {column.header}
                    </div>
                ))}
            </div>

            {/* Group Items */}
            {group.items.map(renderTableRow)}
        </div>
    );

    const getBadgeColorClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'not_started':
                return 'bg-gray-200 text-gray-700';
            case 'started':
                return 'bg-blue-100 text-blue-700';
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-700';
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'not available':
            case 'not_available':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-500';
        }
    };

    const renderTableRow = (item: RenoProgress) => (
        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 mb-2">
            <div className="grid grid-cols-6 gap-4">
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        {item.property?.block}-{item.property?.floor}-{item.property?.unit_no}
                    </div>
                </div>
                {[0, 1, 2, 3, 4].map((taskIndex) => {
                    const status = item.phases?.[0]?.jobs?.[0]?.tasks?.[taskIndex].status || '-';
                    return (
                        <div key={taskIndex}>
                            <div className={`badge badge-xs ${getBadgeColorClass(status)} px-2 py-1 rounded-full text-xs font-bold`}>
                                {status.replace('_', ' ').toUpperCase()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );  

    return (
        <div className="min-h-screen bg-gray-200 p-6 w-full">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-2xl font-bold text-gray-800">Renovation Projects</h2>
                            <div className="relative">
                                <select
                                    value={groupBy || ''}
                                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-700 shadow-sm"
                                >
                                    <option value="">No Grouping</option>
                                    {groupableColumns.map(col => (
                                        <option key={col.field} value={col.field}>{col.header}</option>
                                    ))}
                                </select>
                                {/* <Group className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /> */}
                            </div>
                        </div>
                        <div className="relative">
                            {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} /> */}
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Add table header here - before all groups */}
                    <div className="bg-white rounded-xl shadow-sm">
                        <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-gray-100 rounded-xl">
                            {columns.map((column, index) => (
                                <div key={index} className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    {column.header}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Groups content */}
                    {groupedData ? (
                        groupedData.map(group => (
                            <div key={group.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <button
                                    className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                                    onClick={() => toggleGroup(group.key)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <i className={`ki-filled ki-right transform transition-transform duration-200 ${expandedGroups.has(group.key) ? 'rotate-90' : ''}`}></i>
                                        <span className="font-semibold text-gray-700">{group.name}</span>
                                        <span className="bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full text-sm">
                                            {group.count} units
                                        </span>
                                    </div>
                                </button>
                                <div className={`transition-all duration-200 ease-in-out
          ${expandedGroups.has(group.key) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 space-y-2">
                                        {group.items.map(renderTableRow)}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="space-y-2">
                            {renoProgress.map(renderTableRow)}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {((page - 1) * size) + 1} to {Math.min(page * size, totalItems)} of {totalItems} results
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors duration-200"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page * size >= totalItems}
                                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors duration-200"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Test2;
