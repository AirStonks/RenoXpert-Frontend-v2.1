import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Package, Product } from '../../../types';
import {
    GripVertical,
    Trash2,
    Plus,
    Eye,
    EyeOff,
    Package as PackageIcon,
    ChevronDown,
    ChevronRight,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { ProductTable } from './ProductTable';
import { motion, AnimatePresence } from 'framer-motion';

interface SortablePackageItemProps {
    package: Package;
    index: number;
    onRemove: (id: number) => void;
    onQuantityChange: (id: number, quantity: number) => void;
    onProductsUpdate: (packageId: number, products: Product[]) => void;
    onAddProduct: (packageId: number) => void;
    onAddonToggle?: (packageId: number, isIncluded: boolean) => void;
}

export const SortablePackageItem: React.FC<SortablePackageItemProps> = ({
    package: pkg,
    index,
    onRemove,
    onQuantityChange,
    onProductsUpdate,
    onAddProduct,
    onAddonToggle,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `package-${pkg.id}`,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const calculatePackageTotal = () => {
        // If it's an addon package that's not included, return 0
        // if (pkg.is_addon && pkg.is_addon_included === false) {
        //     return 0;
        // }

        // if (!pkg.products || pkg.products.length === 0) {
        //     return (pkg.total_price || 0) * (pkg.quantity || 1);
        // }

        const packageTotal = pkg.products.reduce((prodSum, product) => {
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

        return packageTotal * (pkg.quantity || 1);
    };

    const handleAddonToggleClick = () => {
        if (pkg.is_addon && onAddonToggle) {
            const newIncludedState = !pkg.is_addon_included;
            onAddonToggle(pkg.id!, newIncludedState);
        }
    };

    const handleProductToggle = (productId: number, property: 'supply' | 'install') => {
        if (!pkg.products) return;

        const updatedProducts = pkg.products.map(product => {
            if (product.id === productId) {
                const updatedPivot = {
                    ...product.pivot,
                    [`include${property.charAt(0).toUpperCase() + property.slice(1)}`]: !product.pivot?.[`include${property.charAt(0).toUpperCase() + property.slice(1)}` as keyof typeof product.pivot],
                };

                // Update included status based on supply and install
                updatedPivot.included = updatedPivot.includeSupply || updatedPivot.includeInstall;

                return {
                    ...product,
                    pivot: updatedPivot,
                };
            }
            return product;
        });

        onProductsUpdate(pkg.id!, updatedProducts);
    };

    const handleQuantityAdjustment = (productId: number, action: 'increase' | 'decrease') => {
        if (!pkg.products) return;

        const updatedProducts = pkg.products.map(product => {
            if (product.id === productId) {
                const currentQuantity = product.pivot?.quantity || 1;
                const newQuantity = action === 'increase'
                    ? currentQuantity + 1
                    : Math.max(1, currentQuantity - 1);

                return {
                    ...product,
                    pivot: {
                        ...product.pivot,
                        quantity: newQuantity,
                    },
                };
            }
            return product;
        });

        onProductsUpdate(pkg.id!, updatedProducts);
    };

    const handleRemoveProduct = (productId: number) => {
        if (!pkg.products) return;

        const updatedProducts = pkg.products.filter(product => product.id !== productId);
        onProductsUpdate(pkg.id!, updatedProducts);
    };

    const handleProductVisibilityToggle = (productId: number) => {
        if (!pkg.products) return;

        const updatedProducts = pkg.products.map(product => {
            if (product.id === productId) {
                return {
                    ...product,
                    pivot: {
                        ...product.pivot,
                        visibility: !product.pivot?.visibility,
                    },
                };
            }
            return product;
        });

        onProductsUpdate(pkg.id!, updatedProducts);
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleExpanded();
        }
    };

    const productCount = pkg.products?.length || 0;
    const packageTotal = calculatePackageTotal();
    const isAddonIncluded = pkg.is_addon_included !== false; // Default to true if undefined

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm transition-all duration-200 ${isDragging ? 'shadow-lg scale-105' : ''
                } ${pkg.is_addon && !isAddonIncluded ? 'opacity-60 bg-gray-50/80' : ''
                }`}
        >
            {/* Package Header - Always Visible */}
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                        {/* Drag Handle */}
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-grab active:cursor-grabbing transition-colors duration-200 mt-1"
                            aria-label={`Drag to reorder ${pkg.name}`}
                        >
                            <GripVertical className="h-4 w-4 text-gray-500" />
                        </div>

                        {/* Package Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <PackageIcon className="h-4 w-4 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                                <span className="text-sm text-gray-500">#{index + 1}</span>
                                {pkg.is_addon && (
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700`}>
                                        Add-on {isAddonIncluded ? '(Included)' : '(Excluded)'}
                                    </span>
                                )}
                                {pkg.category && (
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border">
                                        {pkg.category}
                                    </span>
                                )}
                            </div>

                            {/* Addon Toggle Control */}
                            {pkg.is_addon && (
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-sm text-gray-600">Include in quotation:</span>
                                    <button
                                        onClick={handleAddonToggleClick}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${isAddonIncluded ? 'bg-purple-500' : 'bg-gray-200'
                                            }`}
                                        aria-label={`${isAddonIncluded ? 'Exclude' : 'Include'} ${pkg.name} addon package`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${isAddonIncluded ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                    <span className={`text-sm font-medium ${isAddonIncluded ? 'text-purple-700' : 'text-gray-500'
                                        }`}>
                                        {isAddonIncluded ? 'Included' : 'Excluded'}
                                    </span>
                                </div>
                            )}

                            {/* Collapsed Summary Info */}
                            <div className="flex items-center gap-6 mb-4">
                                <span className="text-md text-gray-500 mt-1">{pkg.description}</span>
                            </div>


                        </div>
                    </div>

                    {/* Package Actions */}
                    <div className="flex flex-col justify-end items-end">
                        <div className="flex flex-col items-end">
                            <div className="flex gap-8 items-center mb-2">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span>Quantity: {pkg.quantity || 1}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span>Products: {productCount}</span>
                                    </div>
                                </div>
                                <div className={`text-lg font-semibold ${pkg.is_addon && !isAddonIncluded ? 'text-gray-400 line-through' : 'text-gray-900'
                                    }`}>
                                    RM {packageTotal.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </div>
                            </div>
                            {pkg.is_addon && !isAddonIncluded && (
                                <div className="text-xs text-amber-600 mb-2">
                                    ⚠ Not included in total
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => onRemove(pkg.id!)}
                                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                aria-label={`Remove ${pkg.name} package`}
                            >
                                <Trash2 className="h-3 w-3" />
                                Remove
                            </button>

                            {/* Expand/Collapse Button */}
                            <button
                                onClick={toggleExpanded}
                                onKeyDown={handleKeyDown}
                                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                aria-expanded={isExpanded}
                                aria-controls={`package-details-${pkg.id}`}
                                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} package details for ${pkg.name}`}
                            >
                                <motion.div
                                    animate={{ rotate: isExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </motion.div>
                                <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expandable Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        id={`package-details-${pkg.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: [0.4, 0.0, 0.2, 1]
                        }}
                        className="overflow-hidden border-t border-gray-200/50"
                    >
                        <motion.div
                            initial={{ y: -20 }}
                            animate={{ y: 0 }}
                            exit={{ y: -20 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="p-6"
                        >
                            {/* Addon Package Notice */}
                            {pkg.is_addon && !isAddonIncluded && (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-amber-800">
                                        <span className="text-sm font-medium">⚠ This addon package is excluded from the order</span>
                                    </div>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Toggle the switch above to include it in pricing calculations.
                                    </p>
                                </div>
                            )}

                            {/* Package Controls */}
                            <div className="flex justify-between items-center gap-6 mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">Quantity:</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onQuantityChange(pkg.id!, Math.max(1, (pkg.quantity || 1) - 1))}
                                            className={`h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                            aria-label="Decrease quantity"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium">{pkg.quantity || 1}</span>
                                        <button
                                            onClick={() => onQuantityChange(pkg.id!, (pkg.quantity || 1) + 1)}
                                            className={`h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                            aria-label="Increase quantity"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onAddProduct(pkg.id!)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg 
                                            bg-blue-500 text-white border border-blue-500 
                                            hover:bg-blue-600 hover:border-blue-600 
                                            transition-all duration-200 
                                            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                                    aria-label={`Add products to ${pkg.name}`}
                                >
                                    <Plus className="h-3 w-3" />
                                    Add Products
                                </button>

                            </div>

                            {/* Products Table */}
                            {pkg.products && pkg.products.length > 0 ? (
                                <ProductTable
                                    products={pkg.products}
                                    packageId={pkg.id!}
                                    onProductsUpdate={onProductsUpdate}
                                    onToggleProperty={handleProductToggle}
                                    onQuantityAdjust={handleQuantityAdjustment}
                                    onRemoveProduct={handleRemoveProduct}
                                    onToggleVisibility={handleProductVisibilityToggle}
                                />
                            ) : (
                                <div className="text-center py-8">
                                    <div className="p-4 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                                        <PackageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm mb-3">No products in this package</p>
                                    <button
                                        onClick={() => onAddProduct(pkg.id!)}
                                        disabled={pkg.is_addon && !isAddonIncluded}
                                        className={`text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 ${pkg.is_addon && !isAddonIncluded ? 'opacity-50 cursor-not-allowed text-gray-400' : ''
                                            }`}
                                    >
                                        Add your first product
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};