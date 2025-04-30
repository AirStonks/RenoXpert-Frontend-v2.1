// // components/DraggablePackage.tsx
// import React from 'react';
// import { useDraggable, useDroppable } from '@dnd-kit/core';
// import { DraggableProduct } from './DraggableProduct';
// import { Package } from '../../../types';

// interface DraggablePackageProps {
//     pkg: Package;
//     isDragging: boolean;
// }

// export const DraggablePackage: React.FC<DraggablePackageProps> = ({ pkg, isDragging }) => {
//     // Draggable setup
//     const {
//         attributes: dragAttributes,
//         listeners: dragListeners,
//         setNodeRef: dragRef,
//         transform
//     } = useDraggable({
//         id: pkg.id,
//     });

//     // Droppable setup
//     const {
//         isOver,
//         setNodeRef: dropRef
//     } = useDroppable({
//         id: pkg.id,
//     });

//     // Combine refs
//     const setRef = (element: HTMLElement | null) => {
//         dragRef(element);
//         dropRef(element);
//     };

//     const style = {
//         transform: transform
//             ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
//             : undefined,
//         opacity: isDragging ? 0.5 : 1,
//         cursor: 'move',
//     };

//     return (
//         <div
//             ref={setRef}
//             style={style}
//             {...dragAttributes}
//             {...dragListeners}
//             className={`p-4 rounded-lg border-2 transition-all ${isOver && !isDragging
//                     ? 'border-green-500 bg-green-50'
//                     : 'border-gray-200 hover:border-gray-300'
//                 }`}
//         >
//             <h2 className="text-lg font-semibold mb-3 flex items-center">
//                 <span className="mr-2 cursor-move">☰</span>
//                 {pkg.name}
//             </h2>
//             <div className="space-y-2 min-h-[100px]">
//                 {pkg.products.length === 0 && (
//                     <p className="text-gray-500 italic">Drop products here</p>
//                 )}
//                 {pkg.products.map((product) => (
//                     <DraggableProduct
//                         key={product.id}
//                         product={product}
//                         packageId={pkg.id}
//                     />
//                 ))}
//             </div>
//         </div>
//     );
// };