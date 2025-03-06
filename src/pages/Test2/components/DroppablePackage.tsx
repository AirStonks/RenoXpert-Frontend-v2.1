// components/DroppablePackage.tsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Package } from '../../../types';
import { DraggableProduct } from './DraggableProduct';

interface DroppablePackageProps {
    pkg: Package;
}

export const DroppablePackage: React.FC<DroppablePackageProps> = ({ pkg }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: pkg.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`p-4 rounded-lg border-2 ${isOver ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
        >
            <h2 className="text-lg font-semibold mb-3">{pkg.name}</h2>
            <div className="space-y-2 min-h-[100px]">
                {pkg.products.length === 0 && (
                    <p className="text-gray-500 italic">Drop products here</p>
                )}
                {pkg.products.map((product) => (
                    <DraggableProduct
                        key={product.id}
                        product={product}
                        packageId={pkg.id}
                    />
                ))}
            </div>
        </div>
    );
};