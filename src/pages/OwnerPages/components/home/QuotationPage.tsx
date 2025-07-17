import React from 'react';
import { Link } from 'react-router-dom';
import useFetchOwnerOrders from '../../../../hook/useFetchOwnerOrders';
import { Order, Package } from '../../../../types';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

function SkeletonLoader() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex-shrink-0" />
                        <div className="flex-grow space-y-3">
                            <div className="h-4 bg-gray-100 rounded-md w-24" />
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-100 rounded-md w-32" />
                                <div className="h-3 bg-gray-100 rounded-md w-40" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-100 rounded-md w-20" />
                                <div className="h-3 bg-gray-100 rounded-md w-28" />
                            </div>
                        </div>
                        <div className="w-20 h-6 bg-gray-100 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function calculateTotalAmount(order: Order) {
    let addonCounter = 0;
    const packages: Package[] = JSON.parse(JSON.parse(JSON.stringify(order?.latest_quotation?.metadata)));

    const categoryTotals = packages.reduce((acc, quotationPackage) => {
        const category = quotationPackage.is_addon ? `Add-on Option ${++addonCounter}` : quotationPackage.category;

        const categoryTotal = quotationPackage.products.reduce((total, product) => {
            const supplyPrice = product.pivot.includeSupply
                ? product.provisioning.supply.retail_price * product.pivot.quantity
                : product.provisioning.supply.retail_price - product.provisioning.supply.excluded_price;

            const installPrice = product.pivot.includeInstall
                ? product.provisioning.install.retail_price * product.pivot.quantity
                : product.provisioning.install.retail_price - product.provisioning.install.excluded_price;

            return total + supplyPrice + installPrice;
        }, 0) * (quotationPackage.quantity || 1);

        if (!(quotationPackage.is_addon && !quotationPackage.is_addon_included)) {
            if (!acc[category]) {
                acc[category] = { total_price: 0, quantity: 0 };
            }
            acc[category].total_price += categoryTotal;
            acc[category].quantity += quotationPackage.quantity;
        }

        return acc;
    }, {} as Record<string, { total_price: number; quantity: number }>);

    const bonus: { description?: string; value?: number | string; } = JSON.parse(JSON.parse(JSON.stringify(order?.latest_quotation?.bonus)));

    const total = Object.values(categoryTotals).reduce((sum, { total_price }) => sum + total_price, 0);

    // Deduct bonus value if available and is a number
    return bonus?.value && typeof bonus.value === 'number'
        ? total - bonus.value
        : total;
}

function QuotationContent({ orders, abort }: { orders: Order[]; abort: () => void }) {
    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Quotations Found</h2>
                <p className="text-gray-500 text-center">You don't have any quotations yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
                <Link
                    key={order.id}
                    to={`${LOCAL_PATH_PREFIX}order/overview/id/${order.id}`}
                    state={{ fromUrl: `${LOCAL_PATH_PREFIX}quotations` }}
                    onClick={abort}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900">{order.order_no}</h3>
                                <div className="space-y-1">
                                    <div>
                                        <p className="text-xs text-gray-500">Property Name</p>
                                        <p className="text-sm font-medium text-gray-900">{order.property.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Unit</p>
                                        <p className="text-sm font-medium text-gray-900">{`${order.block}-${order.floor}-${order.unit_no}`}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Amount</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            RM {calculateTotalAmount(order).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <span
                                className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${order.status === 'confirmed'
                                    ? 'bg-green-50 text-green-600'
                                    : order.status === 'voided'
                                        ? 'bg-red-50 text-red-600'
                                        : 'bg-gray-50 text-gray-600'
                                    }`}
                            >
                                {(order.status === 'confirmed' ? 'sale' : order.status).charAt(0).toUpperCase() +
                                    (order.status === 'confirmed' ? 'sale' : order.status).slice(1)}
                            </span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

export default function QuotationPage() {
    const { orders, loading, error, abort } = useFetchOwnerOrders();

    if (error) {
        return (
            <div className="flex items-center justify-center p-6 bg-red-50 rounded-xl">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <main className="w-full mx-auto px-4 py-4">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Quotations</h1>
                <p className="text-gray-500">View and manage your property quotations</p>
            </div>

            {loading ? <SkeletonLoader /> : <QuotationContent orders={orders || []} abort={abort} />}
        </main>
    );
}