import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product } from '../../../types';
import { GripVertical, Eye, EyeOff, Trash2, Minus, Plus } from 'lucide-react';

interface SortableProductRowProps {
    number: number;
    product: Product;
    onToggleProperty: (productId: number, property: 'supply' | 'install') => void;
    onQuantityAdjust: (productId: number, action: 'increase' | 'decrease') => void;
    onRemoveProduct: (productId: number) => void;
    onToggleVisibility: (productId: number) => void;
}

export const SortableProductRow: React.FC<SortableProductRowProps> = ({
    number,
    product,
    onToggleProperty,
    onQuantityAdjust,
    onRemoveProduct,
    onToggleVisibility,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `product-${product.id}`,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    // Calculate prices
    const calculateUnitPrice = () => {
        const supplyPrice = product.provisioning?.supply?.retail_price || 0;
        const installPrice = product.provisioning?.install?.retail_price || 0;
        return supplyPrice + installPrice;
    };

    const calculateDiscount = () => {
        const supplyDiscount = !product.pivot?.includeSupply ?
            (product.provisioning?.supply?.excluded_price || 0) * (product.pivot?.quantity || 1) : 0;
        const installDiscount = !product.pivot?.includeInstall ?
            (product.provisioning?.install?.excluded_price || 0) * (product.pivot?.quantity || 1) : 0;
        return supplyDiscount + installDiscount;
    };

    const calculateTotal = () => {
        return calculateUnitPrice() - calculateDiscount();
    };

    const isExcluded = !product.pivot?.includeSupply && !product.pivot?.includeInstall;
    const displayQuantity = product.pivot?.included && !isExcluded ? (product.pivot?.quantity || 1) : 0;

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${isExcluded ? 'bg-orange-50' : ''
                } ${isDragging ? 'bg-blue-50' : ''}`}
        >
            {/* Drag Handle */}
            <td className="py-3 px-2">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 transition-colors"
                >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
            </td>

            {/* Number */}
            <td className="py-3 px-2 text-gray-600 font-medium">
                {number}.
            </td>

            {/* Supply Checkbox */}
            <td className="py-3 px-2 text-center">
                <input
                    type="checkbox"
                    checked={!!product.pivot?.includeSupply}
                    onChange={() => onToggleProperty(product.id!, 'supply')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
                />
            </td>

            {/* Install Checkbox */}
            <td className="py-3 px-2 text-center">
                <input
                    type="checkbox"
                    checked={!!product.pivot?.includeInstall}
                    onChange={() => onToggleProperty(product.id!, 'install')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-colors"
                />
            </td>

            {/* Product Name & Description */}
            <td className="py-3 px-2">
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{product.name}</span>
                    {product.description && (
                        <span className="text-xs text-gray-500 mt-1">{product.description}</span>
                    )}
                    {product.SKU && (
                        <span className="text-xs text-gray-400 mt-1">SKU: {product.SKU}</span>
                    )}
                </div>
            </td>

            {/* Supplier */}
            <td className="py-3 px-2 text-gray-600">
                {product.supplier_name || '-'}
            </td>

            {/* Quantity Controls */}
            <td className="py-3 px-2">
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => onQuantityAdjust(product.id!, 'decrease')}
                        disabled={!product.pivot?.included || displayQuantity <= 1}
                        className="h-6 w-6 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                        <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                        {displayQuantity}
                    </span>
                    <button
                        onClick={() => onQuantityAdjust(product.id!, 'increase')}
                        disabled={!product.pivot?.included}
                        className="h-6 w-6 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </div>
            </td>

            {/* Unit Price */}
            <td className="py-3 px-2 text-center text-sm font-medium">
                RM {calculateUnitPrice().toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}
            </td>

            {/* Discount */}
            <td className="py-3 px-2 text-center text-sm">
                {calculateDiscount() > 0 ? (
                    <span className="text-red-600">
                        - RM {calculateDiscount().toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>

            {/* Total */}
            <td className="py-3 px-2 text-center text-sm font-medium">
                <span className="text-gray-900">
                    RM {calculateTotal().toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </span>
            </td>

            {/* Visibility */}
            <td className="py-3 px-2 text-center">
                <button
                    onClick={() => onToggleVisibility(product.id!)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                >
                    {product.pivot?.visibility ? (
                        <Eye className="h-6 w-6 text-green-600" />
                    ) : (
                        <EyeOff className="h-6 w-6 text-gray-400" />
                    )}
                </button>
            </td>

            {/* Remove Action */}
            <td className="py-3 px-2 text-center">
                <button
                    onClick={() => onRemoveProduct(product.id!)}
                    className="p-1 rounded hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors"
                >
                    <Trash2 className="h-6 w-6" />
                </button>
            </td>
        </tr>
    );
};