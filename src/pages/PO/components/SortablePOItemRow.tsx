import React from "react";
import { POItem } from "../../../types";
import { Trash2 } from "lucide-react";

interface SortablePOItemRowProps {
    poItem: POItem;
    packId: number;
    updateProductSupplyQuantity: (productId: number, packageId: number, newSupplyQuantity: number) => void;
    updateProductInstallQuantity: (productId: number, packageId: number, newInstallQuantity: number) => void;
    removeProduct?: (productId: number, packageId: number) => void;
    getDeductionPONumbers?: (packageId: number, productId: number, deductionType: 'supply' | 'install') => { po_no: string; qty: number }[];
    getMaxSupplyQuantity?: (productId: number, packageId: number) => number;
    getMaxInstallQuantity?: (productId: number, packageId: number) => number;
    isDisabled?: boolean;
    isFilteredItem?: boolean;
}

export const SortablePOItemRow: React.FC<SortablePOItemRowProps> = ({
    poItem,
    packId,
    updateProductSupplyQuantity,
    updateProductInstallQuantity,
    removeProduct,
    getDeductionPONumbers,
    getMaxSupplyQuantity,
    getMaxInstallQuantity,
    isDisabled = false,
    isFilteredItem = false,
}) => {

    return (
        <div className={`grid grid-cols-11 gap-2 items-center rounded-xl p-3 border transition-all duration-200 ${
            isFilteredItem 
                ? 'bg-gray-50 border-gray-300' 
                : 'bg-white border-gray-200/50 hover:shadow-sm'
        }`}>
            <div className="col-span-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Item
                    </span>
                    {isFilteredItem && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Fully Issued
                        </span>
                    )}
                </div>
                <h5 className="font-medium text-gray-900 text-sm mb-1 leading-tight">
                    {poItem.product_name}
                </h5>
                <div className="space-y-0.5 text-xs text-gray-500">
                    <span>{poItem.product_desc || "-"}</span>
                </div>
            </div>
            <div className="col-span-1 flex items-center justify-center">
                <span className="w-8 text-center text-sm font-medium">
                    {poItem.qty || 0}
                </span>
            </div>
            <div className="col-span-1 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    {(() => {
                        const deductions = getDeductionPONumbers ? getDeductionPONumbers(packId, Number(poItem.product_id), 'supply') : [];
                        const maxAllowed = getMaxSupplyQuantity ? getMaxSupplyQuantity(Number(poItem.product_id), packId) : Infinity;
                        const currentQty = poItem.supply_qty || 0;

                        // If remaining quantity is 0, only show deduction info
                        if (maxAllowed === 0) {
                            return (
                                <div className="text-xs text-orange-600 flex flex-col gap-1">
                                    {deductions.map((d, index) => (
                                        <span key={index}>
                                            {d.qty} from {d.po_no}
                                        </span>
                                    ))}
                                </div>
                            );
                        }

                        // Otherwise show controls and deduction info
                        return (
                            <>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() =>
                                            updateProductSupplyQuantity(Number(poItem.product_id), packId, currentQty - 1)
                                        }
                                        disabled={isDisabled || isFilteredItem}
                                        className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-colors duration-200 ${
                                            isDisabled || isFilteredItem
                                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                                        }`}
                                    >
                                        <i className="ki-solid ki-minus-squared text-gray-600"></i>
                                    </button>
                                    <span className={`w-8 text-center text-sm font-medium ${
                                        isFilteredItem ? 'text-gray-500' : currentQty >= maxAllowed ? 'text-blue-600' : ''
                                    }`}>
                                        {currentQty}
                                    </span>
                                    <button
                                        onClick={() =>
                                            updateProductSupplyQuantity(Number(poItem.product_id), packId, currentQty + 1)
                                        }
                                        disabled={currentQty >= maxAllowed || isDisabled || isFilteredItem}
                                        className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-colors duration-200 ${
                                            currentQty >= maxAllowed || isDisabled || isFilteredItem
                                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                                        }`}
                                    >
                                        <i className="ki-solid ki-plus-squared text-gray-600"></i>
                                    </button>
                                </div>
                                {/* Show deduction info if quantities were reduced */}
                                {deductions.length > 0 && (
                                    <div className="text-xs text-orange-600 flex flex-col gap-1">
                                        {deductions.map((d, index) => (
                                            <span key={index}>
                                                {d.qty} from {d.po_no}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>
            <div className="col-span-1 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    {(() => {
                        const deductions = getDeductionPONumbers ? getDeductionPONumbers(packId, Number(poItem.product_id), 'install') : [];
                        const maxAllowed = getMaxInstallQuantity ? getMaxInstallQuantity(Number(poItem.product_id), packId) : Infinity;
                        const currentQty = poItem.install_qty || 0;

                        // If remaining quantity is 0, only show deduction info
                        if (maxAllowed === 0) {
                            return (
                                <div className="text-xs text-orange-600 flex flex-col gap-1">
                                    {deductions.map((d, index) => (
                                        <span key={index}>
                                            {d.qty} from {d.po_no}
                                        </span>
                                    ))}
                                </div>
                            );
                        }

                        // Otherwise show controls and deduction info
                        return (
                            <>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() =>
                                            updateProductInstallQuantity(Number(poItem.product_id), packId, currentQty - 1)
                                        }
                                        className="h-6 w-6 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors duration-200"
                                    >
                                        <i className="ki-solid ki-minus-squared text-gray-600"></i>
                                    </button>
                                    <span className={`w-8 text-center text-sm font-medium ${currentQty >= maxAllowed ? 'text-blue-600' : ''}`}>
                                        {currentQty}
                                    </span>
                                    <button
                                        onClick={() =>
                                            updateProductInstallQuantity(Number(poItem.product_id), packId, currentQty + 1)
                                        }
                                        disabled={currentQty >= maxAllowed}
                                        className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-colors duration-200 ${currentQty >= maxAllowed
                                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                                            }`}
                                    >
                                        <i className="ki-solid ki-plus-squared text-gray-600"></i>
                                    </button>
                                </div>
                                {/* Show deduction info if quantities were reduced */}
                                {deductions.length > 0 && (
                                    <div className="text-xs text-orange-600 flex flex-col gap-1">
                                        {deductions.map((d, index) => (
                                            <span key={index}>
                                                {d.qty} from {d.po_no}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
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
            <div className="col-span-1 flex justify-center">
                {removeProduct && (
                    <button
                        onClick={() => removeProduct(Number(poItem.product_id), packId)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors duration-200"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
};