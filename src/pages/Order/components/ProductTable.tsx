import React from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Product } from '../../../types';
import { SortableProductRow } from './SortableProductRow';

interface ProductTableProps {
    products: Product[];
    packageId: number;
    onProductsUpdate: (packageId: number, products: Product[]) => void;
    onToggleProperty: (productId: number, property: 'supply' | 'install') => void;
    onQuantityAdjust: (productId: number, action: 'increase' | 'decrease') => void;
    onRemoveProduct: (productId: number) => void;
    onToggleVisibility: (productId: number) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
    products,
    packageId,
    onProductsUpdate,
    onToggleProperty,
    onQuantityAdjust,
    onRemoveProduct,
    onToggleVisibility,
}) => {
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

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900">Package Products</h4>
                <p className="text-xs text-gray-500">Drag to reorder • Toggle supply/install • Adjust quantities</p>
            </div>

            <div className="overflow-x-hide">
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
                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Product</th>
                                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Supplier</th>
                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Qty</th>
                                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Unit Price</th>
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
                    </table>
                </DndContext>
            </div>
        </div>
    );
};