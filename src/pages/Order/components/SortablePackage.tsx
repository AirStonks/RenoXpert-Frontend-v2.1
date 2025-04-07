import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableProductRowForPackage } from "./SortableProductRowForPackage"; // Adjust path as needed
import { Package } from "../../../types";

interface SortablePackageProps {
    prodPackage: Package;
    categoryOptions: { value: string; label: string }[];
    adjustPackageQuantity: (packId: number, action: "increase" | "decrease") => void;
    handleRemovePackage: (packId: number) => void;
    openAddProductModal: (event: React.MouseEvent<HTMLButtonElement>) => void;
    toggleProperty: (id: number, packId: number, property: "supply" | "install") => void;
    adjustQuantity: (prodId: number, packId: number, action: "increase" | "decrease") => void;
    handleRemoveProduct: (packId: number, prodId: number) => void;
    toggleIsAddonIncluded: (packId: number) => void;
}

export const SortablePackage: React.FC<SortablePackageProps> = ({
    prodPackage,
    categoryOptions,
    adjustPackageQuantity,
    handleRemovePackage,
    openAddProductModal,
    toggleProperty,
    adjustQuantity,
    handleRemoveProduct,
    toggleIsAddonIncluded,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `package-${prodPackage.id}`,
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className="package flex items-center" data-id={prodPackage.id}>
            <div
                className="accordion-item border rounded-xl w-full"
                data-accordion-item="true"
                id={`package_item_${prodPackage.id}`}
            >
                <button
                    className="accordion-toggle p-4 flex justify-between items-center w-full"
                    data-accordion-toggle={`#package_content_${prodPackage.id}`}
                >
                    <div className="flex items-center gap-4 w-full">
                        <span {...listeners} style={{ cursor: "move" }}>☰</span>
                        <div className="flex flex-col items-start">
                            <span className="text-base text-gray-900 font-medium">{prodPackage.name}</span>
                            <span className="text-sm text-gray-700 font-medium">{prodPackage.description_internal}</span>
                            <span className="text-base text-gray-700">
                                RM {(prodPackage.total_price * (prodPackage.quantity || 1)).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                            {prodPackage.category && (
                                <div className="badge text-sm">
                                    {categoryOptions.find((option) => option.value === prodPackage.category)?.label}
                                </div>
                            )}
                            <span className="text-sm text-slate-400 text-start">{prodPackage.description}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        {prodPackage.is_addon && (
                            <span className="text-gray-700 font-semibold py-2 px-4 bg-slate-200 rounded-md whitespace-nowrap">
                                {`Add-on Included: ${prodPackage.is_addon_included ? 'Yes' : 'No'}`}
                            </span>
                        )}
                        <span className="text-gray-600 font-semibold py-2 px-4 bg-gray-200 rounded-md whitespace-nowrap">
                            {`Quantity: ${prodPackage.quantity || 1}`}
                        </span>
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemovePackage(prodPackage.id)}
                        >
                            Remove
                        </button>
                        <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                        <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                    </div>
                </button>
                <div className="accordion-content hidden border-t" id={`package_content_${prodPackage.id}`}>
                    <div className="flex justify-between my-2 mx-3">
                        <div className="flex items-center text-gray-700 gap-2 p-2 rounded-md bg-blue-50 dark:bg-sky-950">
                            <span>Package Quantity: </span>
                            <div className="flex text-center">
                                <button
                                    data-action="decrease"
                                    onClick={() => adjustPackageQuantity(prodPackage.id, "decrease")}
                                >
                                    <i className="ki-solid ki-minus-squared"></i>
                                </button>
                                <span className="mx-2 text-base">{prodPackage.quantity || 1}</span>
                                <button
                                    data-action="increase"
                                    onClick={() => adjustPackageQuantity(prodPackage.id, "increase")}
                                >
                                    <i className="ki-solid ki-plus-squared"></i>
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-8">
                            {prodPackage.is_addon && (
                                <label className="switch switch-lg">
                                    <span className="switch-label">
                                        Add-on Included
                                    </span>
                                    <input
                                        className="checkbox"
                                        name="is_ready"
                                        type="checkbox"
                                        checked={!!prodPackage.is_addon_included}
                                        onChange={() => toggleIsAddonIncluded(prodPackage.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </label>
                            )}
                            <button
                                className="btn btn-primary"
                                data-id={prodPackage.id}
                                data-modal-toggle="#include_pack_prod_modal"
                                onClick={openAddProductModal}
                            >
                                Add Product
                            </button>
                        </div>
                    </div>
                    <div className="product-list flex flex-col">
                        <table className="table align-middle text-gray-700 font-medium text-sm">
                            <thead>
                                <tr>
                                    <th className="w-[30px]"></th> {/* Drag handle column */}
                                    <th className="w-[10px] text-center">Supply</th>
                                    <th className="w-[10px] text-center">Install</th>
                                    <th className="w-[250px]">Product</th>
                                    <th className="w-[100px] text-center">Quantity</th>
                                    <th className="w-[100px] text-center">Unit Price</th>
                                    <th className="w-[100px] text-center">Discount</th>
                                    <th className="w-[100px] text-center">Total Price</th>
                                    <th className="w-[100px] text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <SortableContext
                                    items={prodPackage.products.map((prod) => `product-${prod.id}-${prodPackage.id}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {prodPackage.products.map((product) => (
                                        <SortableProductRowForPackage
                                            key={product.id}
                                            product={product}
                                            packId={prodPackage.id}
                                            toggleProperty={toggleProperty}
                                            adjustQuantity={adjustQuantity}
                                            handleRemoveProduct={handleRemoveProduct}
                                        />
                                    ))}
                                </SortableContext>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};