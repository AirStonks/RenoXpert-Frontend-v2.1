import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useFetchOwnerOrder from '../../hook/useFetchOwnerOrder';
import { KTAccordion } from '../../metronic/core';
import { Order, Package } from '../../types';
import Loading from '../../components/Loading';
import { Slide, toast } from 'react-toastify';
import { updateOwnerOrderAddon } from '../../services/ownerApi';

function CustomAddonPackage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const orderId = id ? parseInt(id, 10) : null;

    const { orderDetail, loading, error } = useFetchOwnerOrder(orderId);

    const [order, setOrder] = useState<Order | null>(null);
    const [initialPackages, setInitialPackages] = useState<Package[]>([]);
    const [openAccordions, setOpenAccordions] = useState({});
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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
        });
    };

    useEffect(() => {
        if (orderDetail) {
            setOrder(orderDetail);
            const packages = JSON.parse(orderDetail.latest_quotation.metadata);
            setInitialPackages(packages);
        }
    }, [orderDetail]);

    useEffect(() => {
        if (order) {
            KTAccordion.init();
        }
    }, [order]);

    const toggleAccordion = (id: string) => {
        setOpenAccordions((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleToggleAddonPackage = (packageId: number) => {
        setOrder((prevOrder) => {
            if (!prevOrder) return prevOrder;
            const updatedOrder = { ...prevOrder };
            const packages: Package[] = JSON.parse(updatedOrder.latest_quotation.metadata);
            const updatedPackages = packages.map((packageItem) => {
                if (packageItem.id === packageId) {
                    return {
                        ...packageItem,
                        is_addon_included: !packageItem.is_addon_included,
                    };
                }
                return packageItem;
            });
            updatedOrder.latest_quotation = {
                ...updatedOrder.latest_quotation,
                metadata: JSON.stringify(updatedPackages),
            };
            return updatedOrder;
        });
    };

    const toggleDrawer = () => {
        setIsDrawerOpen((prev) => !prev);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const response = await updateOwnerOrderAddon(order!);

            if (response?.success) {
                notify('success', 'Changes saved successfully!');
                navigate(`/owner/order/overview/id/${orderId}`);
            }

        } catch (error) {
            console.log(error.message);
            notify('error', 'Failed to save changes.');
        } finally {
            setIsLoading(false);
        }

    };

    const handleCancel = () => {
        if (order) {
            const currentPackages: Package[] = JSON.parse(order.latest_quotation.metadata);
            const hasChanges = initialPackages.some((initialPkg, index) => {
                const currentPkg = currentPackages[index];
                return initialPkg.is_addon_included !== currentPkg.is_addon_included;
            });

            if (hasChanges) {
                const confirmDiscard = window.confirm(
                    'You have unsaved changes to the quotation packages. Are you sure you want to cancel and discard these changes?'
                );
                if (confirmDiscard) {
                    navigate(`/owner/order/overview/id/${orderId}`);
                }
            } else {
                navigate(`/owner/order/overview/id/${orderId}`);
            }
        }
    };

    if (loading) return <Loading />;
    if (error) return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center">
                <img alt="image" className="dark:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3.svg" />
                <img alt="image" className="light:hidden max-h-[160px] mb-12" src="/public/media/illustrations/3-dark.svg" />
                <h2 className="text-xl font-semibold text-gray-900">Order not found or invalid</h2>
            </div>
        </div>
    );
    if (!order) return <div>An unexpected error occurred</div>;

    const packages: Package[] = JSON.parse(order.latest_quotation.metadata);
    const basePackages = packages.filter((pkg) => !pkg.is_addon);
    const addonPackages = packages.filter((pkg) => pkg.is_addon);
    const selectedAddons = addonPackages.filter((pkg) => pkg.is_addon_included);
    const baseCost = basePackages.reduce((sum, pkg) => sum + pkg.total_price, 0);
    const totalAddonCost = selectedAddons.reduce((sum, pkg) => sum + pkg.total_price, 0);
    const totalCost = baseCost + totalAddonCost;

    return (
        <div className="flex w-full px-2 relative">
            <div className="card flex-auto w-full max-w-4xl">
                {/* Header */}
                <div className="card-header flex justify-between">
                    <div className="flex gap-4 justify-center">
                        <button
                            className="ki-solid ki-arrow-left items-center text-gray-900"
                            onClick={handleCancel}
                        ></button>
                        <span className="text-lg text-gray-900 font-semibold">Customize Add-on Packages</span>
                    </div>
                </div>
                {/* Body */}
                <div className="card-body pt-2 px-4 pb-32">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-center my-2">
                            <span className="text-2xs text-gray-500">Below are the available add-on packages</span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {(() => {
                                let packageCounter = 0;
                                let addonCounter = 0;
                                return packages.map((prodPackage) => {
                                    const isAddon = prodPackage.is_addon;
                                    const counter = isAddon ? addonCounter++ : packageCounter++;
                                    const accordionId = `content_${counter}`;
                                    const isOpen = !!openAccordions[accordionId];

                                    if (prodPackage.is_addon) {
                                        return (
                                            <div className="accordion-item border rounded-xl w-full shadow-sm" key={counter}>
                                                <button
                                                    className="flex items-center justify-between gap-4 w-full text-xs p-4 rounded-xl hover:bg-gray-50 transition duration-200 focus:outline-none"
                                                    onClick={() => toggleAccordion(accordionId)}
                                                >
                                                    <div className="flex items-center flex-grow">
                                                        <div className="flex flex-col text-left">
                                                            <span className="font-medium text-gray-700 text-xs">
                                                                Add-on Option {counter + 1}:
                                                            </span>
                                                            <span className="text-base font-semibold text-gray-900">
                                                                {prodPackage.name}
                                                            </span>
                                                            <span className="text-gray-500 mt-1 max-w-md">
                                                                {prodPackage.description}
                                                            </span>
                                                            <span className="mt-2 text-base font-bold text-gray-900">
                                                                RM {prodPackage.total_price.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <label className="switch switch-lg">
                                                            <input
                                                                className="checkbox"
                                                                name="isDraftMode"
                                                                type="checkbox"
                                                                checked={!!prodPackage.is_addon_included}
                                                                onChange={() => handleToggleAddonPackage(prodPackage.id)}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </label>
                                                        <div className="flex items-center space-x-1">
                                                            <i
                                                                className={`ki-outline ${isOpen ? 'ki-down' : 'ki-right'} text-gray-600 text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                                                            ></i>
                                                        </div>
                                                    </div>
                                                </button>
                                                <div
                                                    className={`border-t overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}
                                                >
                                                    <div className="p-4">
                                                        <h2 className="text-sm font-semibold text-gray-800 mb-3">
                                                            Products
                                                        </h2>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs text-left border-collapse">
                                                                <thead>
                                                                    <tr className="bg-gray-100 border-b">
                                                                        <th className="p-3 font-medium text-gray-700">
                                                                            Product
                                                                        </th>
                                                                        <th className="p-3 font-medium text-gray-700">
                                                                            Quantity
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {prodPackage.products.map((product, index) => (
                                                                        <tr
                                                                            key={index}
                                                                            className="border-b hover:bg-gray-100 transition duration-150"
                                                                        >
                                                                            <td className="p-3">
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-medium text-gray-900">
                                                                                        {product.name}
                                                                                    </span>
                                                                                    <span className="text-gray-600 text-xs mt-1">
                                                                                        {product.description || '-'}
                                                                                    </span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="p-3 text-gray-700">
                                                                                {product.pivot.quantity} {product.uom}
                                                                                {product.pivot.quantity > 1 ? 's' : ''}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                });
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Bottom Drawer */}
            <div
                className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out ${isDrawerOpen ? 'h-72' : 'h-16'} overflow-y-auto z-10`}
            >
                <div className="p-4 pb-6">
                    {/* Drawer Handle */}
                    <div
                        className="flex justify-center items-center cursor-pointer mb-2"
                        onClick={toggleDrawer}
                    >
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 hover:bg-gray-200 transition-colors duration-200">
                            <span className="text-sm font-medium text-gray-700">
                                {isDrawerOpen ? 'Hide Summary' : 'Show Summary'}
                            </span>
                            <i
                                className={`ki-solid ki-arrow-${isDrawerOpen ? 'down' : 'up'} text-gray-500 text-lg transition-transform duration-300`}
                            ></i>
                        </div>
                    </div>

                    {/* Summary Content (visible only when drawer is open) */}
                    {isDrawerOpen && (
                        <div className="mt-2">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Quotation Summary</h3>
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600 flex justify-between items-center">
                                    <span className="font-medium">Base Packages Cost</span>
                                    <span className="text-gray-800 font-semibold">
                                        RM {baseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </p>
                                <p className="text-sm text-gray-600 flex justify-between items-center">
                                    <span className="font-medium">Add-on Packages Cost</span>
                                    <span className="text-gray-800 font-semibold">
                                        RM {totalAddonCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </p>
                                <div className="border-t border-gray-200 pt-3">
                                    <p className="text-lg text-gray-900 flex justify-between items-center">
                                        <span className="font-semibold">Total Cost</span>
                                        <span className="font-bold text-blue-600">
                                            RM {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            {selectedAddons.length > 0 && (
                                <div className="mt-5">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Add-on Packages</p>
                                    <ul className="space-y-2">
                                        {selectedAddons.map((addon) => (
                                            <li
                                                key={addon.id}
                                                className="text-sm text-gray-800 bg-gray-50 rounded-md p-2 flex justify-between items-center"
                                            >
                                                <span>{addon.name}</span>
                                                <span className="font-medium text-gray-900">
                                                    RM {addon.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Save and Cancel Buttons */}
            <div
                className={`fixed left-1/2 transform -translate-x-1/2 flex gap-4 z-20 transition-all duration-300 ease-in-out ${isDrawerOpen ? 'bottom-80' : 'bottom-20'
                    }`}
            >
                <button
                    onClick={handleCancel}
                    className="btn btn-lg bg-gray-200 text-gray-700 rounded-3xl shadow-lg px-6 py-3 hover:bg-gray-300 transition-colors duration-200 font-medium"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="btn btn-lg bg-blue-600 text-white rounded-3xl shadow-lg px-6 py-3 hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                    Save
                </button>
            </div>
        </div>
    );
}

export default CustomAddonPackage;