import React from 'react'
import { Link } from 'react-router-dom'
import useFetchOwnerOrders from '../../../../hook/useFetchOwnerOrders';
import { Order, Package } from '../../../../types';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

const MEDIA_URL =
    import.meta.env.VITE_APP_ENV === "local"
        ? '/public/media/'
        : '/media/';

function SkeletonLoader() {
    return (
        <div className="flex flex-wrap gap-4">
            {Array(5).fill(0).map((_, index) => (
                <div key={index} className="card w-full sm:w-[calc(50%-0.5rem)] animate-pulse">
                    <div className="card-body flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="relative size-[50px] shrink-0 bg-gray-200 rounded-full"></div>

                            <div className="flex flex-col gap-3 w-full">
                                <div className="h-4 bg-gray-200 rounded w-24"></div>

                                <div className="flex flex-col gap-1">
                                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                                    <div className="h-4 bg-gray-200 rounded w-32 mt-1"></div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                                    <div className="h-4 bg-gray-200 rounded w-24 mt-1"></div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                                    <div className="h-4 bg-gray-200 rounded w-28 mt-1"></div>
                                </div>
                            </div>
                        </div>
                        <div className="status">
                            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function QuotationContent({ orders, abort }: { orders: Order[], abort: () => void }) {

    const calculateTotalAmount = (order: Order) => {
        let addonCounter = 0; // To number each add-on uniquely

        const packages: Package[] = JSON.parse(JSON.parse(JSON.stringify(order?.latest_quotation?.metadata)));

        const categoryTotals = packages.reduce((acc, quotationPackage) => {
            let category;
            if (quotationPackage.is_addon === true) {
                addonCounter += 1;
                category = `Add-on Option ${addonCounter}`;
            } else {
                category = quotationPackage.category;
            }

            const categoryTotal = quotationPackage.products.reduce((total, product) => {
                let supplyPrice = 0;
                if (product.pivot.includeSupply) {
                    supplyPrice = (product.provisioning.supply.retail_price * product.pivot.quantity) || 0;
                } else {
                    supplyPrice = (product.provisioning.supply.retail_price - product.provisioning.supply.excluded_price) || 0;
                }

                let installPrice = 0;
                if (product.pivot.includeInstall) {
                    installPrice = (product.provisioning.install.retail_price * product.pivot.quantity) || 0;
                } else {
                    installPrice = (product.provisioning.install.retail_price - product.provisioning.install.excluded_price) || 0;
                }

                return total + supplyPrice + installPrice;
            }, 0) * (quotationPackage.quantity || 1);

            if (!(quotationPackage.is_addon === true && quotationPackage.is_addon_included === false)) {
                if (!acc[category]) {
                    acc[category] = { total_price: 0, quantity: 0 };
                }
                acc[category].total_price += categoryTotal;
                acc[category].quantity += quotationPackage.quantity;
            }

            return acc;
        }, {} as Record<string, { total_price: number, quantity: number }>);

        // Calculate filtered total_amount
        const filteredTotalAmount = Object.values(categoryTotals).reduce((sum, { total_price }) => sum + total_price, 0);

        return filteredTotalAmount;
    }

    return (
        orders.length === 0 ? (
            <div className="flex flex-col items-center">
                <img alt="image" className="dark:hidden max-h-[160px] mb-12" src={`${MEDIA_URL}illustrations/3.svg`} />
                <img alt="image" className="light:hidden max-h-[160px] mb-12" src={`${MEDIA_URL}illustrations/3-dark.svg`} />
                <h2 className="text-xl font-semibold text-gray-900">There is no Quotation here</h2>
            </div>
        ) : (
            <div className="flex flex-wrap gap-4">
                {orders.map((order, index) => (
                    <Link
                        to={LOCAL_PATH_PREFIX + 'order/overview/id/' + order.id}
                        state={{ fromUrl: LOCAL_PATH_PREFIX + 'quotations' }}
                        className="card w-full sm:w-[calc(50%-0.5rem)] cursor-pointer"
                        key={index}
                        onClick={abort} // Cancel fetch on click
                    >
                        <div className="card-body flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="relative size-[50px] shrink-0">
                                    <svg className="w-full h-full stroke-info-clarity fill-info-light" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill="#EFF6FF">
                                        </path>
                                        <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="#1B84FF" strokeOpacity="0.2">
                                        </path>
                                    </svg>
                                    <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                        <i className="ki-outline ki-tablet-text-down text-1.5xl ps-px text-info"></i>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <h3 className="text-gray-900 text-sm font-medium">
                                        {order.order_no}
                                    </h3>

                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-600">
                                            Property Name:
                                        </span>
                                        <span className="text-sm text-gray-900 font-medium">
                                            {order.property.name}
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-600">
                                            Unit:
                                        </span>
                                        <span className="text-sm text-gray-900 font-medium">
                                            {order.block}-{order.floor}-{order.unit_no}
                                        </span>
                                    </div>

                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-600">
                                            Amount:
                                        </span>
                                        <span className="text-sm text-gray-900 font-medium">
                                            RM {calculateTotalAmount(order).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="status">
                                <span className={`badge badge-pill badge-outline gap-1 items-center ${order.status === 'confirmed' ? 'badge-success' : ''} ${order.status === 'voided' ? 'badge-danger' : ''}`}>
                                    {(order.status === 'confirmed' ? 'sale' : order.status).charAt(0).toUpperCase() + (order.status === 'confirmed' ? 'sale' : order.status).slice(1)}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        )
    );
}

export default function QuotationPage() {
    const { orders, loading, error, abort } = useFetchOwnerOrders();

    if (error) return <div>{error}</div>;

    return (
        <div className="flex flex-col mx-4">
            <div className="flex justify-center items-center mb-4">
                <h1 className="text-2xl font-semibold text-gray-800 pb-2 tracking-tight">Quotations</h1>
            </div>

            {loading ? <SkeletonLoader /> : <QuotationContent orders={orders || []} abort={abort} />}

        </div>
    )
}