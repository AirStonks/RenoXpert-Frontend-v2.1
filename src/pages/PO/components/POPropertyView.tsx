import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KTSticky } from '../../../metronic/core';
import { POIndex } from '../../../services/api';
import Loading from '../../../components/Loading';
import { PurchaseOrder } from '../../../types';
import { Link } from 'react-router-dom';
import { useUser } from '../../../context/UserContext';

interface TableColumn {
    field: string;
    header: string;
    sortable?: boolean;
    groupable?: boolean;
}

type GroupBy = string | null;

const POPropertyView = () => {
    const navigate = useNavigate();
    const { currentUser, loading } = useUser();

    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [groupByProperty, setGroupByProperty] = useState<GroupBy>('property.id');
    const [groupByUnit, setGroupByUnit] = useState<GroupBy>('unit');
    const [expandedPropertyGroups, setExpandedPropertyGroups] = useState<Set<string>>(new Set());
    const [expandedUnitGroups, setExpandedUnitGroups] = useState<Set<string>>(new Set());

    let columns: TableColumn[] = [
        { field: 'po_no', header: 'PO No.', sortable: true },
        { field: 'sales_no', header: 'Sales No.', sortable: true },
        { field: 'owner', header: 'Owner', sortable: true },
        { field: 'unit', header: 'Unit', sortable: true, groupable: true },
        { field: 'property', header: 'Property', sortable: true, groupable: true },
        { field: 'vendor', header: 'Vendor', sortable: true },
        { field: 'total_amount', header: 'Total Amount', sortable: true },
        { field: 'order_status', header: 'Order Status', sortable: true },
        { field: 'payment_status', header: 'Payment Status', sortable: true },
        { field: 'delivery_status', header: 'Delivery/Fulfillment', sortable: true },
    ];

    if (currentUser && currentUser.type === 'backend-vendor') {
        columns = columns.filter(column => column.field !== 'sales_no');
    }

    const groupableColumns = columns.filter(col => col.groupable);

    useEffect(() => {
        document.title = "Purchase Orders Property View | RenoXpert";
        initPOTable(1, 100, '', null, '');
    }, []);

    useEffect(() => {
        if (purchaseOrders.length > 0) {
            KTSticky.init();
        }
    }, [purchaseOrders]);

    const initPOTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        setIsLoading(true);
        try {
            const response = await POIndex(size, page, searchTerm, order, field);
            const data = response?.data || [];
            setPurchaseOrders(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            setError('Failed to load purchase orders');
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
        initPOTable(page, size, searchTerm, sortDirection === 'asc' ? 'desc' : 'asc', field);
    };

    const toPODetail = (id: number) => {
        navigate(`/purchase-orders/${id}`, {
            state: { fromUrl: '/purchase-orders/property-view' }
        });
    };

    const groupedData = useMemo(() => {
        if (!groupByProperty) return null;

        const propertyGroups = new Map<string, { name: string; units: Map<string, PurchaseOrder[]> }>();
        purchaseOrders.forEach(item => {
            const propertyId = item.sale?.order.property?.id || 'Unassigned';
            const propertyName = item.sale?.order.property?.name || 'Unassigned Property';
            const unitKey = item.sale ? `${item.sale.order.block}-${item.sale.order.floor}-${item.sale.order.unit_no}` : 'Unassigned Unit';

            if (!propertyGroups.has(propertyId)) {
                propertyGroups.set(propertyId, { name: propertyName, units: new Map() });
            }

            const unitMap = propertyGroups.get(propertyId)!.units;
            if (!unitMap.has(unitKey)) {
                unitMap.set(unitKey, []);
            }
            unitMap.get(unitKey)!.push(item);
        });

        return Array.from(propertyGroups.entries()).map(([propertyId, { name, units }]) => ({
            key: propertyId,
            name,
            units: Array.from(units.entries()).map(([unitKey, items]) => ({
                key: unitKey,
                items,
                count: items.length,
            })),
            count: Array.from(units.values()).reduce((sum, items) => sum + items.length, 0),
        }));
    }, [purchaseOrders, groupByProperty, groupByUnit]);

    const toggleGroup = (groupType: 'property' | 'unit', groupValue: string, parentKey?: string) => {
        if (groupType === 'property') {
            setExpandedPropertyGroups(prev => {
                const next = new Set(prev);
                if (next.has(groupValue)) {
                    next.delete(groupValue);
                    // Collapse all unit groups within this property when property is collapsed
                    setExpandedUnitGroups(prevUnits => {
                        const nextUnits = new Set(prevUnits);
                        groupedData?.find(g => g.key === groupValue)?.units.forEach(u => nextUnits.delete(`${groupValue}-${u.key}`));
                        return nextUnits;
                    });
                } else {
                    next.add(groupValue);
                }
                return next;
            });
        } else if (groupType === 'unit' && parentKey) {
            setExpandedUnitGroups(prev => {
                const compositeKey = `${parentKey}-${groupValue}`;
                const next = new Set(prev);
                if (next.has(compositeKey)) {
                    next.delete(compositeKey);
                } else {
                    next.add(compositeKey);
                }
                return next;
            });
        }
    };

    const renderTableRow = (item: PurchaseOrder, propertyKey?: string, unitKey?: string) => {
        const isPropertyExpanded = !propertyKey || expandedPropertyGroups.has(propertyKey);
        const isUnitExpanded = !unitKey || expandedUnitGroups.has(`${propertyKey}-${unitKey}`);

        const handleRowClick = (e: React.MouseEvent) => {
            if (!isPropertyExpanded || !isUnitExpanded) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            toPODetail(Number(item.id));
        };

        return (
            <div
                key={item.id}
                className={`bg-white dark:bg-coal-100 rounded-lg p-4 shadow-sm transition-shadow duration-200 mb-4 
                    ${isPropertyExpanded && isUnitExpanded
                        ? 'hover:shadow-md dark:hover:bg-slate-900'
                        : 'opacity-50 cursor-default'}`}
            // onClick={handleRowClick}
            >
                <div className="grid grid-cols-[repeat(10,minmax(0,1fr))] gap-4">
                    <div>
                        <Link
                            to={`/purchase-orders/${item.id}`}
                            state={{ fromUrl: '/purchase-orders/property/view' }}
                            className="font-semibold cursor-pointer text-orange-500"
                        >
                            {item.po_no}
                        </Link>
                    </div>
                    {currentUser?.type !== 'backend-vendor' &&
                        <div>
                            {item.sale ?
                                <Link
                                    to={`/sales/${item.sale_id}`}
                                    state={{ fromUrl: '/purchase-orders/property/view' }}
                                    className="font-semibold cursor-pointer text-orange-500"
                                >
                                    {item.sale.sales_no}
                                </Link>
                                :
                                '-'
                            }
                        </div>
                    }
                    <div>
                        <div className="flex flex-col gap-1">
                            {item.sale ? (
                                <>
                                    <span>{item.sale.order.user.name}</span>
                                    <span className="text-xs text-slate-400">{item.sale.order.user.email}</span>
                                    <span className="text-xs text-slate-700">
                                        +{item.sale.order.user.country_code} {item.sale.order.user.phone_no}
                                    </span>
                                </>
                            ) : '-'}
                        </div>
                    </div>
                    <div className="text-center">
                        {item.sale ? `${item.sale.order.block}-${item.sale.order.floor}-${item.sale.order.unit_no}` : '-'}
                    </div>
                    <div className="text-center">
                        {item.sale?.order.property?.name || '-'}
                    </div>
                    <div>
                        <div className="flex flex-col gap-1">
                            {item.vendor ? (
                                <>
                                    <span>{item.vendor.name}</span>
                                    <span className="text-xs text-slate-400">{item.vendor.email}</span>
                                    <span className="text-xs text-slate-700">
                                        +{item.vendor.country_code} {item.vendor.phone_no}
                                    </span>
                                </>
                            ) : '-'}
                        </div>
                    </div>
                    <div>
                        <span>RM {item.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="text-center">
                        <span className={`badge badge-pill p-2 cursor-default capitalize
                            ${item.order_status === 'released' ? 'badge-primary' : ''} 
                            ${item.order_status === 'accepted' ? 'badge-success' : ''} 
                            ${item.order_status === 'rejected' ? 'badge-danger' : ''} 
                            badge-outline`}>
                            {item.order_status}
                        </span>
                    </div>
                    <div className="text-center">
                        <span className={`badge badge-pill p-2 cursor-default capitalize
                            ${item.payment_status === 'confirmed' ? 'badge-success' : ''} 
                            ${item.payment_status === 'revoked' ? 'badge-danger' : ''} 
                            badge-outline`}>
                            {item.payment_status}
                        </span>
                    </div>
                    <div className="text-center">
                        <Link
                            to={`/purchase-orders/fulfillment/${item.id}`}
                            state={{ fromUrl: '/purchase-orders/property/view' }}
                            className="btn btn-sm btn-outline btn-primary"
                        >
                            View Status
                        </Link>
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-coal-500 p-6 w-full rounded-md">
            <div className="relative">
                {/* <div className="bg-white dark:bg-coal-100 rounded-xl shadow-sm p-6 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <select
                                    value={groupByProperty || ''}
                                    onChange={(e) => setGroupByProperty(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 
                                    focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-700 shadow-sm"
                                >
                                    <option value="">No Property Grouping</option>
                                    {groupableColumns.filter(col => col.field === 'property').map(col => (
                                        <option key={col.field} value={col.field}>{col.header}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <select
                                    value={groupByUnit || ''}
                                    onChange={(e) => setGroupByUnit(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 
                                    focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-700 shadow-sm"
                                >
                                    <option value="">No Unit Grouping</option>
                                    {groupableColumns.filter(col => col.field === 'unit').map(col => (
                                        <option key={col.field} value={col.field}>{col.header}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search purchase orders..."
                                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 
                                focus:ring-blue-500 focus:border-transparent shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div> */}

                <div className="relative">
                    <div className="sticky top-0 z-10 mb-4 bg-white dark:bg-coal-100 rounded-xl shadow-sm">
                        <div className="grid grid-cols-[repeat(10,minmax(0,1fr))] gap-4 px-6 py-4">
                            {columns.map((column) => (
                                <div
                                    key={column.field}
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                    onClick={() => column.sortable && handleSort(column.field)}
                                >
                                    {column.header}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {groupedData ? (
                            groupedData.map((propertyGroup) => (
                                <div key={propertyGroup.key} className="relative mb-4">
                                    <div className="sticky top-[calc(3rem+0.1rem)] z-10">
                                        <button
                                            className="w-full px-6 py-4 flex items-center justify-between bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900 dark:hover:bg-indigo-700 transition-colors duration-200 rounded-xl shadow-sm"
                                            onClick={() => toggleGroup('property', propertyGroup.key)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <i className={`ki-filled ki-right transform transition-transform duration-200 ${expandedPropertyGroups.has(propertyGroup.key) ? 'rotate-90' : ''}`}></i>
                                                <span className="font-semibold text-gray-700 dark:text-gray-50">{propertyGroup.name}</span>
                                                <span className="bg-white dark:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full text-sm">
                                                    {propertyGroup.count} orders
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                    <div className={`transition-all duration-200 ease-in-out bg-white dark:bg-coal-100 rounded-xl shadow-sm mt-1
                                        ${expandedPropertyGroups.has(propertyGroup.key) ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                        <div className="p-4 space-y-4">
                                            {groupByUnit && propertyGroup.units.map((unitGroup) => (
                                                <div key={unitGroup.key} className="relative">
                                                    <div className="sticky top-[calc(6rem+0.8rem)] z-5">
                                                        <button
                                                            className="w-full px-4 py-3 flex items-center justify-between bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200 rounded-lg"
                                                            onClick={() => toggleGroup('unit', unitGroup.key, propertyGroup.key)}
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <i className={`ki-filled ki-right transform transition-transform duration-200 ${expandedUnitGroups.has(`${propertyGroup.key}-${unitGroup.key}`) ? 'rotate-90' : ''}`}></i>
                                                                <span className="font-medium text-gray-700 dark:text-gray-50">{unitGroup.key}</span>
                                                                <span className="bg-white dark:bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                                                                    {unitGroup.count} orders
                                                                </span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                    <div className={`transition-all duration-200 ease-in-out mt-1
                                                        ${expandedUnitGroups.has(`${propertyGroup.key}-${unitGroup.key}`) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                                        <div className="space-y-2">
                                                            {unitGroup.items.map(item => renderTableRow(item, propertyGroup.key, unitGroup.key))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {!groupByUnit && propertyGroup.units.flatMap(u => u.items).map(item => renderTableRow(item, propertyGroup.key))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="space-y-2">
                                {purchaseOrders.map(item => renderTableRow(item))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 bg-white dark:bg-coal-100 rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {totalItems} results
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POPropertyView;