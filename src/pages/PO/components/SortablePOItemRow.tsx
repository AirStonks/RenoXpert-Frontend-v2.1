import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { POItem } from "../../../types";

interface SortablePOItemRowProps {
    poItem: POItem;
    packId: number;
    adjustProductQty: (prodId: number, packId: number, action: "increase" | "decrease") => void;
    handleRemovePOProduct: (packId: number, prodId: number) => void;
    handleChangeQty: (e: React.ChangeEvent<HTMLInputElement>, packId: number, prodId: string) => void;
}

export const SortablePOItemRow: React.FC<SortablePOItemRowProps> = ({
    poItem,
    packId,
    adjustProductQty,
    handleRemovePOProduct,
    handleChangeQty,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `item-${poItem.product_id}-${packId}`, // Unique ID for each item
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition: isDragging ? "none" : transition, // Disable transition during drag for smoothness
        opacity: isDragging ? 0.7 : 1, // Slightly higher opacity for visibility
        border: isDragging ? "2px dashed #ccc" : "none", // Visual feedback during drag
    };

    // Stop event propagation for interactive elements
    const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="grid grid-cols-11 gap-2 items-center bg-white rounded-xl p-3 border border-gray-200/50 hover:shadow-sm transition-all duration-200"
        >
            <div className="col-span-4">
                <div className="flex items-center gap-2 mb-1">
                    <span {...listeners} style={{ cursor: "move" }}>
                        ☰
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Item
                    </span>
                </div>
                <h5 className="font-medium text-gray-900 text-sm mb-1 leading-tight">
                    {poItem.product_name}
                </h5>
                <div className="space-y-0.5 text-xs text-gray-500">
                    <span>{poItem.product_desc || "-"}</span>
                </div>
            </div>
            <div className="col-span-1 flex items-center justify-center">
                <div className="flex items-center gap-1" onClick={stopPropagation}>
                    <button
                        className="btn btn-icon btn-sm hover:bg-gray-200 rounded-full transition-colors duration-200"
                        onClick={(e) => {
                            stopPropagation(e);
                            adjustProductQty(Number(poItem.product_id), packId, "decrease");
                        }}
                    >
                        <i className="ki-solid ki-minus-squared text-gray-600"></i>
                    </button>
                    <input
                        type="text"
                        className="input input-sm text-center px-2 w-12 border-gray-200 focus:border-primary focus:ring focus:ring-primary/20 transition-all duration-200"
                        value={poItem.qty}
                        onChange={(e) => handleChangeQty(e, packId, poItem.product_id)}
                        onClick={stopPropagation}
                    />
                    <button
                        className="btn btn-icon btn-sm hover:bg-gray-200 rounded-full transition-colors duration-200"
                        onClick={(e) => {
                            stopPropagation(e);
                            adjustProductQty(Number(poItem.product_id), packId, "increase");
                        }}
                    >
                        <i className="ki-solid ki-plus-squared text-gray-600"></i>
                    </button>
                </div>
            </div>
            <div className="col-span-1 flex items-center justify-center">
                <span className="w-8 text-center text-sm font-medium">
                    {poItem.supply_qty || 0}
                </span>
            </div>
            <div className="col-span-1 flex items-center justify-center">
                <span className="w-8 text-center text-sm font-medium">
                    {poItem.install_qty || 0}
                </span>
            </div>
            <div className="col-span-1 text-right">
                <div className="text-sm font-medium text-gray-900">
                    RM{" "}
                    {(
                        (poItem.supply_price || 0) *
                        (poItem.supply_qty || 0)
                    ).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                    {poItem.supply_qty || 0} × RM {(poItem.supply_price || 0).toLocaleString()}
                </div>
            </div>
            <div className="col-span-1 text-right">
                <div className="text-sm font-medium text-gray-900">
                    RM{" "}
                    {(
                        (poItem.install_price || 0) *
                        (poItem.install_qty || 0)
                    ).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                    {poItem.install_qty || 0} × RM {(poItem.install_price || 0).toLocaleString()}
                </div>
            </div>
            <div className="col-span-1 text-right">
                <div className="text-lg font-semibold text-blue-600">
                    RM{" "}
                    {(
                        ((poItem.supply_price || 0) * (poItem.supply_qty || 0)) +
                        ((poItem.install_price || 0) * (poItem.install_qty || 0))
                    ).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="col-span-1 flex justify-center" onClick={stopPropagation}>
                <button
                    className="btn btn-icon btn-sm hover:bg-red-100 rounded-full transition-colors duration-200"
                    onClick={(e) => {
                        stopPropagation(e);
                        handleRemovePOProduct(packId, Number(poItem.product_id));
                    }}
                >
                    <i className="ki-filled ki-cross text-red-500"></i>
                </button>
            </div>
        </div>
    );
};