// SortablePOItem.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { POItem } from "../../../types";

interface SortablePOItemRowProps {
    poItem: POItem;
    packId: number;
    adjustProductQty: (prodId: number, packId: number, action: "increase" | "decrease") => void;
    handleRemovePOProduct: (packId: number, prodId: number) => void;
    toggleProperty: (id: number, packId: number, property: "supply" | "install") => void;
    handleChangeQty: (e: React.ChangeEvent<HTMLInputElement>, packId: number, prodId: string) => void;
}

export const SortablePOItemRow: React.FC<SortablePOItemRowProps> = ({
    poItem,
    packId,
    adjustProductQty,
    handleRemovePOProduct,
    toggleProperty,
    handleChangeQty,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `item-${poItem.product_id}-${packId}`, // Ensure unique ID
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Prevent event propagation from buttons/inputs to drag listeners
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <tr
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`${!poItem.supply && !poItem.install ? "bg-orange-50" : ""
                }`}
        >
            <td className="p-3" onClick={stopPropagation}>
                <span {...listeners} style={{ cursor: "move", padding: "8px" }}>
                    ☰
                </span>
            </td>
            <td className="p-3">{poItem.product_name}</td>
            <td className="p-3 text-gray-600">{poItem.product_desc || "-"}</td>
            <td className="p-3 text-center">RM {poItem.supply_price.toFixed(2)}</td>
            <td className="p-3 text-center">RM {poItem.install_price.toFixed(2)}</td>
            <td className="p-3 text-center">
                <div className="flex items-center justify-center gap-2" onClick={stopPropagation}>
                    <button
                        className="btn btn-icon btn-sm hover:bg-gray-200 rounded-full transition-colors duration-200"
                        onClick={() => adjustProductQty(Number(poItem.product_id), packId, "decrease")}
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
                        onClick={() => adjustProductQty(Number(poItem.product_id), packId, "increase")}
                    >
                        <i className="ki-solid ki-plus-squared text-gray-600"></i>
                    </button>
                </div>
            </td>
            <td className="p-3 text-center">{poItem.uom || "-"}</td>
            <td className="p-3 text-center">
                {poItem.supply ? (
                    <span className="text-green-600">
                        RM {(poItem.supply_price * poItem.qty).toFixed(2)}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
            <td className="p-3 text-center">
                {poItem.install ? (
                    <span className="text-green-600">
                        RM {(poItem.install_price * poItem.qty).toFixed(2)}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
            <td className="p-3 text-center font-semibold">
                RM {(((poItem.supply ? poItem.supply_price : 0) + (poItem.install ? poItem.install_price : 0)) * poItem.qty).toFixed(2)}
            </td>
            <td className="p-3 text-center" onClick={stopPropagation}>
                <input
                    className="checkbox checkbox-sm rounded checked:bg-primary"
                    type="checkbox"
                    checked={!!poItem.supply}
                    onChange={() => toggleProperty(Number(poItem.product_id), packId, "supply")}
                />
            </td>
            <td className="p-3 text-center" onClick={stopPropagation}>
                <input
                    className="checkbox checkbox-sm rounded checked:bg-primary"
                    type="checkbox"
                    checked={!!poItem.install}
                    onChange={() => toggleProperty(Number(poItem.product_id), packId, "install")}
                />
            </td>
            <td className="p-3" onClick={stopPropagation}>
                <button
                    className="btn btn-icon btn-sm hover:bg-red-100 rounded-full transition-colors duration-200"
                    onClick={() => handleRemovePOProduct(Number(poItem.product_id), packId)}
                >
                    <i className="ki-filled ki-cross text-red-500"></i>
                </button>
            </td>
        </tr>
    );
};