import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { Product } from "../../../types";

interface SortableProductRowForPackageProps {
    number: number;
    product: Product;
    packId: number;
    toggleProperty: (id: number, packId: number, property: "supply" | "install") => void;
    adjustQuantity: (prodId: number, packId: number, action: "increase" | "decrease") => void;
    handleRemoveProduct: (packId: number, prodId: number) => void;
}

export const SortableProductRowForPackage: React.FC<SortableProductRowForPackageProps> = ({
    number,
    product,
    packId,
    toggleProperty,
    adjustQuantity,
    handleRemoveProduct,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `product-${product.id}-${packId}`,
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`hover:bg-gray-50 ${!product.pivot.includeSupply && !product.pivot.includeInstall ? "light:bg-orange-50 dark:bg-orange-950" : ""}`}
        >
            <td>
                <span {...listeners} style={{ cursor: "move" }}>☰</span>
            </td>
            <td>
                <span>{number}.</span>
            </td>
            <td>
                <div className="flex flex-col items-center">
                    <input
                        className="checkbox"
                        name="supply"
                        type="checkbox"
                        checked={!!product.pivot.includeSupply}
                        onChange={() => toggleProperty(product.id, packId, "supply")}
                    />
                </div>
            </td>
            <td>
                <div className="flex flex-col items-center">
                    <input
                        className="checkbox"
                        name="install"
                        type="checkbox"
                        checked={!!product.pivot.includeInstall}
                        onChange={() => toggleProperty(product.id, packId, "install")}
                    />
                </div>
            </td>
            <td>
                <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-xs text-slate-400">{product.description}</span>
                </div>
            </td>
            <td>
                <span>{product.supplier_name ? product.supplier_name : "-"}</span>
            </td>
            <td className="text-center text-lg">
                <button
                    data-action="decrease"
                    onClick={product.pivot.included ? () => adjustQuantity(product.id, packId, "decrease") : null}
                    disabled={!product.pivot.included}
                >
                    <i className="ki-solid ki-minus-squared"></i>
                </button>
                <span className="mx-2 text-base">
                    {product.pivot.included
                        ? !product.pivot.includeSupply && !product.pivot.includeInstall
                            ? 0
                            : product.pivot.quantity
                        : "0"}
                </span>
                <button
                    data-action="increase"
                    onClick={product.pivot.included ? () => adjustQuantity(product.id, packId, "increase") : null}
                    disabled={!product.pivot.included}
                >
                    <i className="ki-solid ki-plus-squared"></i>
                </button>
            </td>
            <td className="text-center">
                RM {(product.provisioning.supply.retail_price + product.provisioning.install.retail_price).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
            </td>
            <td className="text-center">
                {!product.pivot.includeSupply || !product.pivot.includeInstall
                    ? `- RM ${(
                        (!product.pivot.includeSupply ? product.provisioning.supply.excluded_price * product.pivot.quantity : 0) +
                        (!product.pivot.includeInstall ? product.provisioning.install.excluded_price * product.pivot.quantity : 0)
                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : null}
            </td>
            <td className="text-center">
                {!product.pivot.included
                    ? null
                    : `RM ${(
                        (product.provisioning.supply.retail_price * product.pivot.quantity -
                            (!product.pivot.includeSupply
                                ? product.provisioning.supply.excluded_price * product.pivot.quantity
                                : 0)) +
                        (product.provisioning.install.retail_price * product.pivot.quantity -
                            (!product.pivot.includeInstall
                                ? product.provisioning.install.excluded_price * product.pivot.quantity
                                : 0))
                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </td>
            <td className="text-center">
                {!product.pivot.visibility && <i className="ki-solid ki-eye-slash text-2xl"></i>}
            </td>
            <td className="text-center">
                <button
                    className="btn-revoke btn btn-sm btn-danger"
                    data-tooltip="#remove_tooltip"
                    data-action="remove"
                    data-id={product.id}
                    onClick={() => handleRemoveProduct(packId, product.id)}
                >
                    Remove
                </button>
            </td>
        </tr>
    );
};

