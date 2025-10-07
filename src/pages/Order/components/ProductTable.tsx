import React from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Product } from '../../../types';
import { SortableProductRow } from './SortableProductRow';
import { useUser } from '../../../context/UserContext';
import { canSeeDetailedPricing } from '../../../utils/userPermissions';

interface ProductTableProps {
    products: Product[];
    packageId: number;
    packageQty: number;
    onProductsUpdate: (packageId: number, products: Product[]) => void;
    onToggleProperty: (productId: number, property: 'supply' | 'install') => void;
    onQuantityAdjust: (productId: number, action: 'increase' | 'decrease') => void;
    onRemoveProduct: (productId: number) => void;
    onToggleVisibility: (productId: number) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
    products,
    packageId,
    packageQty,
    onProductsUpdate,
    onToggleProperty,
    onQuantityAdjust,
    onRemoveProduct,
    onToggleVisibility,
}) => {
    const { currentUser } = useUser();
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = products.findIndex(product => `product-${product.id}` === active.id);
        const newIndex = products.findIndex(product => `product-${product.id}` === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedProducts = arrayMove(products, oldIndex, newIndex);
            onProductsUpdate(packageId, reorderedProducts);
        }
    };

    const calculatePackageTotal = () => {
        // If it's an addon package that's not included, return 0
        // if (pkg.is_addon && pkg.is_addon_included === false) {
        //     return 0;
        // }

        // if (!pkg.products || pkg.products.length === 0) {
        //     return (pkg.total_price || 0) * (pkg.quantity || 1);
        // }

        const packageTotal = products.reduce((prodSum, product) => {
            let supplyPrice = 0;
            let installPrice = 0;

            // Calculate supply price
            if (product.provisioning?.supply) {
                if (product.pivot?.includeSupply) {
                    supplyPrice = (product.provisioning.supply.retail_price || 0) * (product.pivot.quantity || 1);
                } else {
                    supplyPrice = Math.max(0,
                        (product.provisioning.supply.retail_price || 0) -
                        (product.provisioning.supply.excluded_price || 0)
                    ) * (product.pivot?.quantity || 1);
                }
            }

            // Calculate install price
            if (product.provisioning?.install) {
                if (product.pivot?.includeInstall) {
                    installPrice = (product.provisioning.install.retail_price || 0) * (product.pivot?.quantity || 1);
                } else {
                    installPrice = Math.max(0,
                        (product.provisioning.install.retail_price || 0) -
                        (product.provisioning.install.excluded_price || 0)
                    ) * (product.pivot?.quantity || 1);
                }
            }

            return prodSum + supplyPrice + installPrice;
        }, 0);

        return packageTotal * packageQty;
    };

    if (!products || products.length === 0) {
        return null;
    }

    const totals = products.reduce(
        (acc, product) => {
            if (!product.pivot.included) return acc;
            const supplyRRP = product.pivot.includeSupply
                ? product.provisioning.supply.retail_price * product.pivot.quantity
                : 0;
            const installRRP = product.pivot.includeInstall
                ? product.provisioning.install.retail_price * product.pivot.quantity
                : 0;
            const supplyCOGS = product.pivot.includeSupply
                ? product.provisioning.supply.cogs * product.pivot.quantity
                : 0;
            const installCOGS = product.pivot.includeInstall
                ? product.provisioning.install.cogs * product.pivot.quantity
                : 0;

            return {
                supplyRRP: acc.supplyRRP + supplyRRP,
                installRRP: acc.installRRP + installRRP,
                totalRRP: acc.totalRRP + supplyRRP + installRRP,
                supplyCOGS: acc.supplyCOGS + supplyCOGS,
                installCOGS: acc.installCOGS + installCOGS,
                totalCOGS: acc.totalCOGS + supplyCOGS + installCOGS,
            };
        },
        {
            supplyRRP: 0,
            installRRP: 0,
            totalRRP: 0,
            supplyCOGS: 0,
            installCOGS: 0,
            totalCOGS: 0,
        }
    );

    const marginPercent =
        totals.totalRRP !== 0
            ? (((totals.totalRRP - totals.totalCOGS) / totals.totalRRP) * 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }) + "%"
            : totals.totalCOGS > 0
                ? "-100.00%"
                : "0.00%";
    const marginAmount = (totals.totalRRP - totals.totalCOGS).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900">Package Products</h4>
                <p className="text-xs text-gray-500">Drag to reorder • Toggle supply/install • Adjust quantities</p>
            </div>

            <div className="overflow-x-auto">
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Supply</th>
                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Install</th>
                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">Product</th>
                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Supplier</th>
                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Qty</th>
                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">Total RRP</th>
                                {canSeeDetailedPricing(currentUser) && (
                                    <>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">Supply RRP</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">Install RRP</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">Supply COGS</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">Install COGS</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">Total COGS</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">Margin %</th>
                                        <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">Margin Amount</th>
                                    </>
                                )}
                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Discount</th>
                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Total</th>
                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Vis</th>
                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <SortableContext
                                items={products.map(product => `product-${product.id}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                {products.map((product, index) => (
                                    <SortableProductRow
                                        key={`product-${product.id}`}
                                        number={index + 1}
                                        product={product}
                                        onToggleProperty={onToggleProperty}
                                        onQuantityAdjust={onQuantityAdjust}
                                        onRemoveProduct={onRemoveProduct}
                                        onToggleVisibility={onToggleVisibility}
                                    />
                                ))}
                            </SortableContext>
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-200">
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td className="text-center py-3">
                                    <span className="text-lg font-bold">
                                        Total
                                    </span>
                                </td>
                                <td className="py-3 px-2 text-center text-sm font-medium whitespace-nowrap">
                                    <span className="text-sm font-bold text-green-600">
                                        {totals.totalRRP >= 0 &&
                                            `RM ${totals.totalRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </span>
                                </td>
                                {canSeeDetailedPricing(currentUser) && (
                                    <>
                                        <td className="py-3 px-2 text-center text-sm font-medium whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {calculatePackageTotal() >= 0 &&
                                                    `RM ${calculatePackageTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-center text-sm font-medium whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {totals.installRRP >= 0 &&
                                                    `RM ${totals.installRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-center text-sm font-medium whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {totals.supplyCOGS >= 0 &&
                                                    `RM ${totals.supplyCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-center text-sm font-medium whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {totals.installCOGS >= 0 &&
                                                    `RM ${totals.installCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-center text-sm font-medium whitespace-nowrap">
                                            <span className="text-sm font-bold text-red-600">
                                                {totals.totalCOGS >= 0 &&
                                                    `RM ${totals.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-center text-sm font-medium whitespace-nowrap">
                                            <span className="text-sm font-bold">
                                                {marginPercent}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-center text-sm font-medium whitespace-nowrap">
                                            <span className="text-sm font-bold">
                                                {`RM ${marginAmount}`}
                                            </span>
                                        </td>
                                    </>
                                )}
                                <td></td>
                                <td className="py-3 px-2 text-center text-sm font-medium whitespace-nowrap">
                                    {`RM ${totals.totalRRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </DndContext>
            </div>
        </div>
    );
};