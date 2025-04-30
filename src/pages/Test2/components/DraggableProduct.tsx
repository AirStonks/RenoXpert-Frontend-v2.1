// import React from 'react';
// import { useDraggable } from '@dnd-kit/core';
// import { Product } from '../../../types';

// interface DraggableProductProps {
//     product: Product;
//     packageId: string;
// }

// export const DraggableProduct: React.FC<DraggableProductProps> = ({ product, packageId }) => {
//     const { attributes, listeners, setNodeRef, transform } = useDraggable({
//         id: product.id,
//         data: { packageId },
//     });

//     const style = {
//         transform: transform
//             ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
//             : undefined,
//     };

//     return (
//         <div
//             ref={setNodeRef}
//             style={style}
//             {...listeners}
//             {...attributes}
//             className="p-3 bg-white rounded-md shadow-sm border border-gray-100 hover:bg-gray-50 cursor-move"
//         >
//             <h3 className="font-medium">{product.name}</h3>
//             <p className="text-sm text-gray-600">{product.description}</p>
//         </div>
//     );
// };
