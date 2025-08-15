import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { POItem, POPackage } from "../../../types";
import { SortablePOItemRow } from "./SortablePOItemRow";

interface SortablePOPackageProps {
    poPackage: POPackage;
    adjustPackageQty: (id: number, action: "increase" | "decrease") => void;
    handleRemovePOPackage: (id: number) => void;
    handleOpenProductModal: (packageId: string) => void;
    adjustProductQty: (prodId: number, packId: number, action: "increase" | "decrease") => void;
    handleRemovePOProduct: (packId: number, prodId: number) => void;
    handleChangeQty: (e: React.ChangeEvent<HTMLInputElement>, packId: number, prodId: string) => void;
    openAccordions: { [key: string]: boolean };
    toggleAccordion: (packageId: string) => void;
}

export const SortablePOPackage: React.FC<SortablePOPackageProps> = ({
    poPackage,
    adjustPackageQty,
    handleRemovePOPackage,
    handleOpenProductModal,
    adjustProductQty,
    handleRemovePOProduct,
    handleChangeQty,
    openAccordions,
    toggleAccordion,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `package-${poPackage.package_id}`,
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition: isDragging ? "none" : transition, // Disable transition during drag for smoothness
        opacity: isDragging ? 0.7 : 1, // Slightly higher opacity for better visibility
        border: isDragging ? "2px dashed #ccc" : "none", // Visual feedback during drag
    };

    // Stop event propagation for interactive elements
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="accordion rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white"
        >
            <div
                className="accordion-header flex items-center justify-between w-full p-5 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                onClick={() => toggleAccordion(poPackage.package_id)}
            >
                <div className="flex items-center gap-3">
                    <span {...listeners} style={{ cursor: "move" }}>
                        ☰
                    </span>
                    <button
                        className="btn btn-icon btn-sm hover:bg-red-100 rounded-full transition-colors duration-200"
                        onClick={(e) => {
                            stopPropagation(e);
                            handleRemovePOPackage(Number(poPackage.package_id));
                        }}
                    >
                        <i className="ki-filled ki-cross text-red-500 text-lg"></i>
                    </button>
                    <div className="flex flex-col">
                        <span className="text-gray-800 font-semibold text-sm">{poPackage.name}</span>
                        <span className="text-gray-600 text-sm">
                            RM{" "}
                            {(poPackage.total_price * (poPackage.quantity || 1)).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center gap-2" onClick={stopPropagation}>
                        <button
                            className="btn btn-icon btn-sm hover:bg-gray-200 rounded-full transition-colors duration-200"
                            onClick={(e) => {
                                stopPropagation(e);
                                adjustPackageQty(Number(poPackage.package_id), "decrease");
                            }}
                        >
                            <i className="ki-solid ki-minus-squared text-gray-600"></i>
                        </button>
                        <input
                            type="text"
                            className="input input-sm text-center px-2 w-12 border-gray-200 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200 disabled"
                            value={poPackage.quantity || 1}
                            onClick={stopPropagation}
                            readOnly // Assuming this is display-only; remove if editable
                        />
                        <button
                            className="btn btn-icon btn-sm hover:bg-gray-200 rounded-full transition-colors duration-200"
                            onClick={(e) => {
                                stopPropagation(e);
                                adjustPackageQty(Number(poPackage.package_id), "increase");
                            }}
                        >
                            <i className="ki-solid ki-plus-squared text-gray-600"></i>
                        </button>
                    </div>
                    <i
                        className={`ki-solid ki-down text-gray-600 transition-transform duration-300 ease-in-out ${openAccordions[poPackage.package_id] ? "rotate-180" : ""
                            }`}
                    ></i>
                </div>
            </div>

            <div
                className={`accordion-content overflow-hidden transition-all duration-300 ease-in-out ${openAccordions[poPackage.package_id] ? "opacity-100" : "max-h-0 opacity-0 p-0"
                    }`}
            >
                <div className="flex justify-end mb-2 p-4">
                    <button
                        className="btn btn-success btn-sm"
                        data-modal-toggle="#add_item_modal"
                        onClick={(e) => {
                            stopPropagation(e);
                            handleOpenProductModal(poPackage.package_id);
                        }}
                    >
                        Add Product
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <div className="grid grid-cols-11 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 px-2">
                        <div className="col-span-4">Item Details</div>
                        <div className="col-span-1 text-center">BASE QTY</div>
                        <div className="col-span-1 text-center">SUPPLY QTY</div>
                        <div className="col-span-1 text-center">INSTALL QTY</div>
                        <div className="col-span-1 text-right">Supply Total</div>
                        <div className="col-span-1 text-right">Install Total</div>
                        <div className="col-span-1 text-right">Item Total</div>
                        <div className="col-span-1"></div>
                    </div>
                    <SortableContext
                        items={poPackage.po_items.map(
                            (item) => `item-${item.product_id}-${poPackage.package_id}`
                        )}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {poPackage.po_items.map((poProd: POItem) => (
                                <SortablePOItemRow
                                    key={poProd.product_id}
                                    poItem={poProd}
                                    packId={Number(poPackage.package_id)}
                                    adjustProductQty={adjustProductQty}
                                    handleRemovePOProduct={handleRemovePOProduct}
                                    handleChangeQty={handleChangeQty}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>
            </div>
        </div>
    );
};