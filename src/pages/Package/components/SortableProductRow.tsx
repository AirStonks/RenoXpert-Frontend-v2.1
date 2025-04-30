import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { Product } from '../../../types';

interface SortableProductRowProps {
    product: Product;
    adjustQuantity: (id: number, action: 'increase' | 'decrease') => void;
    handleVisibilityToggle: (id: number) => void;
    handleRemoveProduct: (id: number) => void;
}

export const SortableProductRow: React.FC<SortableProductRowProps> = ({
    product,
    adjustQuantity,
    handleVisibilityToggle,
    handleRemoveProduct,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `product-${product.id}`,
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Ensure pivot exists before accessing its properties
    const pivot = product.pivot || { quantity: 0, visibility: false, included: false, isOriginal: false };

    return (
        <tr ref={setNodeRef} style={style} {...attributes}>
            <td>
                <span {...listeners} className='cursor-move text-xl'>☰</span>
            </td>
            <td>
                <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-xs text-slate-400 font-semibold">SKU: {product.SKU || '-'}</span>
                    <span className="text-xs text-slate-400">{product.description}</span>
                </div>
            </td>
            <td className="text-center text-lg">
                <button onClick={() => adjustQuantity(product.id!, 'decrease')}>
                    <i className="ki-solid ki-minus-squared"></i>
                </button>
                <span className="mx-2 text-base">{pivot.quantity}</span>
                <button onClick={() => adjustQuantity(product.id!, 'increase')}>
                    <i className="ki-solid ki-plus-squared"></i>
                </button>
            </td>
            <td>
                RM {(product.provisioning?.supply?.retail_price || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
            </td>
            <td>
                RM {((product.provisioning?.supply?.retail_price || 0) * pivot.quantity).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
            </td>
            <td className="text-center">
                <label className="switch flex justify-center">
                    <input
                        type="checkbox"
                        checked={pivot.visibility}
                        onChange={() => handleVisibilityToggle(product.id!)}
                    />
                </label>
            </td>
            <td className="text-center">
                <button className="btn btn-sm btn-danger" onClick={() => handleRemoveProduct(product.id!)}>
                    Remove
                </button>
            </td>
        </tr>
    );
};