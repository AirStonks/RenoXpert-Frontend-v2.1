import React from "react";
import { POItem, POPackage } from "../../../types";
import { SortablePOItemRow } from "./SortablePOItemRow";
import { Trash2 } from "lucide-react";

interface SortablePOPackageProps {
    poPackage: POPackage;
    existingPoPackages: POPackage[];
    handleOpenProductModal: (packageId: string) => void;
    updateProductSupplyQuantity: (productId: number, packageId: number, newSupplyQuantity: number) => void;
    updateProductInstallQuantity: (productId: number, packageId: number, newInstallQuantity: number) => void;
    removeProduct?: (productId: number, packageId: number) => void;
    removePackage?: (packageId: number) => void;
    handleChangeQty: (e: React.ChangeEvent<HTMLInputElement>, packId: number, prodId: string) => void;
    openAccordions: { [key: string]: boolean };
    toggleAccordion: (packageId: string) => void;
    getDeductionPONumbers?: (packageId: number, productId: number, deductionType: 'supply' | 'install') => { po_no: string; qty: number }[];
    getMaxSupplyQuantity?: (productId: number, packageId: number) => number;
    getMaxInstallQuantity?: (productId: number, packageId: number) => number;
    isDisabled?: boolean;
    isFilteredPackage?: boolean;
}

export const SortablePOPackage: React.FC<SortablePOPackageProps> = ({
    poPackage,
    existingPoPackages,
    handleOpenProductModal,
    updateProductSupplyQuantity,
    updateProductInstallQuantity,
    removeProduct,
    removePackage,
    handleChangeQty,
    openAccordions,
    toggleAccordion,
    getDeductionPONumbers,
    getMaxSupplyQuantity,
    getMaxInstallQuantity,
    isDisabled = false,
    isFilteredPackage = false,
}) => {
    return (
        <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border shadow-sm overflow-hidden ${
            isFilteredPackage 
                ? 'border-gray-300 bg-gray-50/80' 
                : 'border-gray-200/50'
        }`}>
            <div
                className={`p-4 cursor-pointer ${
                    isFilteredPackage 
                        ? 'bg-gradient-to-r from-gray-100/50 to-gray-200/50' 
                        : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50'
                }`}
                onClick={() => toggleAccordion(poPackage.package_id)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <i className="ki-solid ki-package text-blue-600 text-lg"></i>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-semibold ${isFilteredPackage ? 'text-gray-500' : 'text-gray-900'}`}>
                                    {poPackage.name}
                                </h4>
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full capitalize">
                                    {poPackage.category?.replace("_", " ") || "Package"}
                                </span>
                                {isFilteredPackage && (
                                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                        Fully Issued
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{poPackage.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-500">{poPackage.po_items.length} items</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-lg font-semibold">RM {poPackage.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {removePackage && !isFilteredPackage && (
                            <button
                                onClick={() => removePackage(Number(poPackage.package_id))}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors duration-200"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            onClick={() => toggleAccordion(poPackage.package_id)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                        >
                            <i className={`ki-solid ${openAccordions[poPackage.package_id] ? 'ki-chevron-down' : 'ki-chevron-right'} text-gray-500 text-lg`}></i>
                        </button>
                    </div>
                </div>
            </div>

            {openAccordions[poPackage.package_id] && (
                <div className="border-t border-gray-200/50">
                    <div className="p-4">
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
                        <div className="space-y-2">
                            {poPackage.po_items.map((poProd: POItem) => (
                                <SortablePOItemRow
                                    key={poProd.product_id}
                                    poItem={poProd}
                                    packId={Number(poPackage.package_id)}
                                    updateProductSupplyQuantity={updateProductSupplyQuantity}
                                    updateProductInstallQuantity={updateProductInstallQuantity}
                                    removeProduct={removeProduct}
                                    getDeductionPONumbers={getDeductionPONumbers}
                                    getMaxSupplyQuantity={getMaxSupplyQuantity}
                                    getMaxInstallQuantity={getMaxInstallQuantity}
                                    isDisabled={isDisabled || isFilteredPackage}
                                    isFilteredItem={isFilteredPackage || (poProd.supply_qty === 0 && poProd.install_qty === 0)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};