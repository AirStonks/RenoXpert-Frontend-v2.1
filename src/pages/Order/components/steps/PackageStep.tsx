import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortablePackageItem } from "../SortablePackageItem";
import { Package, Product } from "../../../../types";
import { useEffect, useState } from "react";
import { PackageIcon, Plus } from "lucide-react";
import { useUser } from "../../../../context/UserContext";
import { canSeeDetailedPricing } from "../../../../utils/userPermissions";

interface FormData {
    unitType: string;
    block: string;
    floor: string;
    unitNo: string;
    queenBedrooms: number;
    singleBedrooms: number;
    studios: number;
    bathrooms: number;
    includePartition: boolean;
    completionDays: number;
    isProgressivePayment: boolean;
    isRnpl: boolean;
    rnpl_base_price: number;
    isDraftMode: boolean;
    isBePowered: boolean;
    tenure: number;
    finalAmount: number;
    bonusDescription: string;
    bonusValue: number;
    internalRemark: string;
}

interface PackagesStepProps {
    formData: FormData;
    selectedPackages: Package[];
    setSelectedPackages: React.Dispatch<React.SetStateAction<Package[]>>;
    onAddPackage: () => void;
    onAddProduct: (packageId: number) => void;
    onPackageDragEnd: (event: DragEndEvent) => void;
    onProductsUpdate: (packageId: number, products: Product[]) => void;
    onAddonToggle: (packageId: number, isIncluded: boolean) => void;
    onQuoBePoweredToggle: (isIncluded: boolean) => void;
    onPaymentMethodChange: (packageId: number, paymentMethod: string, customMonthlyAmount?: number) => void;
    onCustomMonthlyAmountChange: (packageId: number, customMonthlyAmount: number) => void;
    onTenureChange: (newTenuew: number) => void;
    onRnplToggle: (isIncluded: boolean) => void;
    onRnplMethodChange: (packageId: number, method: string) => void;
}

export default function PackagesStep({
    formData,
    selectedPackages,
    setSelectedPackages,
    onAddPackage,
    onAddProduct,
    onPackageDragEnd,
    onProductsUpdate,
    onAddonToggle,
    onQuoBePoweredToggle,
    onPaymentMethodChange,
    onCustomMonthlyAmountChange,
    onTenureChange,
    onRnplToggle,
    onRnplMethodChange,
}: PackagesStepProps) {
    const { currentUser } = useUser();
    const [packageCategories, setPackageCategories] = useState<{ category: string; total_price: number; cogs: number; quantity: number }[]>([]);

    const categoryOptions = [
        { value: "renovation", label: "Renovation" },
        { value: "partition", label: "Partition" },
        { value: "smart_iot", label: "Smart IoT" },
        { value: "project_management", label: "Project Management" },
        { value: "electrical_appliances", label: "Electrical Appliances" },
        { value: "air_conditioning", label: "Air Conditioning" },
        { value: "others", label: "Others" },
    ];

    useEffect(() => {
        if (!selectedPackages || selectedPackages.length === 0) {
            setPackageCategories([]);
            return;
        }

        let addonCounter = 0;
        const categoryTotals = selectedPackages.reduce((acc, pkg) => {
            if (pkg.is_addon === true && pkg.is_addon_included === false) {
                return acc;
            }

            let category;
            if (pkg.is_addon === true) {
                addonCounter += 1;
                category = `Add-on Option ${addonCounter} (${pkg.name})`;
            } else {
                category = pkg.category || 'others';
            }

            const categoryData = pkg.products?.reduce(
                (data, product) => {
                    let supplyPrice = 0;
                    let installPrice = 0;
                    let supplyCogs = 0;
                    let installCogs = 0;

                    if (product.provisioning?.supply) {
                        if (product.pivot?.includeSupply) {
                            supplyPrice = (product.provisioning.supply.retail_price || 0) * (product.pivot.quantity || 1);
                            supplyCogs = (product.provisioning.supply.cogs || 0) * (product.pivot.quantity || 1);
                        } else {
                            supplyPrice = Math.max(0,
                                (product.provisioning.supply.retail_price || 0) -
                                (product.provisioning.supply.excluded_price || 0)
                            ) * (product.pivot?.quantity || 1);
                        }
                    }

                    if (product.provisioning?.install) {
                        if (product.pivot?.includeInstall) {
                            installPrice = (product.provisioning.install.retail_price || 0) * (product.pivot?.quantity || 1);
                            installCogs = (product.provisioning.install.cogs || 0) * (product.pivot?.quantity || 1);
                        } else {
                            installPrice = Math.max(0,
                                (product.provisioning.install.retail_price || 0) -
                                (product.provisioning.install.excluded_price || 0)
                            ) * (product.pivot?.quantity || 1);
                        }
                    }

                    return {
                        total_price: data.total_price + supplyPrice + installPrice,
                        cogs: data.cogs + supplyCogs + installCogs,
                    };
                },
                { total_price: 0, cogs: 0 }
            ) || { total_price: pkg.total_price || 0, cogs: 0 };

            const categoryTotalPrice = (formData.isBePowered || formData.isRnpl) ? (pkg.markup_amount * (pkg.quantity || 1)) : (categoryData.total_price * (pkg.quantity || 1));
            const categoryCogs = categoryData.cogs * (pkg.quantity || 1);

            if (!acc[category]) {
                acc[category] = { total_price: 0, cogs: 0, quantity: 0 };
            }
            acc[category].total_price += categoryTotalPrice;
            acc[category].cogs += categoryCogs;
            acc[category].quantity += pkg.quantity || 1;

            return acc;
        }, {} as Record<string, { total_price: number; cogs: number; quantity: number }>);

        const categoriesArray = Object.entries(categoryTotals).map(([category, { total_price, cogs, quantity }]) => ({
            category: category.startsWith('Add-on Option')
                ? category
                : categoryOptions.find(option => option.value === category)?.label || category,
            total_price,
            cogs,
            quantity,
        }));

        const sortedCategories = [
            ...categoriesArray.filter(item => !item.category.startsWith('Add-on Option')),
            ...categoriesArray.filter(item => item.category.startsWith('Add-on Option')),
        ];

        setPackageCategories(sortedCategories);
    }, [selectedPackages, formData.isBePowered]);

    const removePackage = (id: number) => {
        setSelectedPackages((prev: Package[]) => prev.filter((pkg) => pkg.id !== id));
    };

    const updateQuantity = (id: number, quantity: number) => {
        setSelectedPackages((prev: Package[]) =>
            prev.map((pkg) => (pkg.id === id ? { ...pkg, quantity: Math.max(1, quantity) } : pkg))
        );
    };

    const handleQuoBePoweredToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onQuoBePoweredToggle) {
            const newIncludedState = !formData.isBePowered;
            onQuoBePoweredToggle(newIncludedState);
        }
    };

    const handleMarkupUpdate = (packageId: number, markupAmount: number, markupPercentage: number) => {
        setSelectedPackages((prev: Package[]) =>
            prev.map((pkg) =>
                pkg.id === packageId
                    ? {
                        ...pkg,
                        markup_amount: markupAmount,
                        markup_percentage: markupPercentage / 100,
                        monthly_amount: pkg.payment_method === 'dynamic-installation' ? markupAmount / formData.tenure : pkg.monthly_amount,
                    }
                    : pkg
            )
        );
    };

    const handleTenureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onTenureChange(Number(e.target.value));
        setSelectedPackages((prev: Package[]) =>
            prev.map((pkg) => ({
                ...pkg,
                tenure: Number(e.target.value),
                monthly_amount: pkg.payment_method === 'dynamic-installation' ? pkg.markup_amount / Number(e.target.value) : pkg.monthly_amount,
            }))
        );
    };

    const handleRnplToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRnplToggle) {
            const newIncludedState = !formData.isRnpl;
            onRnplToggle(newIncludedState);
        }
    };

    const calculateSummaryTotals = (totalAmount: number) => {
        const totalCogs = packageCategories.reduce((sum, cat) => sum + cat.cogs, 0);
        const marginInAmount = totalAmount - totalCogs;
        const marginInPercentage = totalAmount > 0 ? (marginInAmount / totalAmount) * 100 : 0;

        const discount = Number(formData.bonusValue) || 0;
        const nettAmount = totalAmount - discount;
        const nettMargin = nettAmount - totalCogs;
        const nettMarginPercentage = nettAmount > 0 ? (nettMargin / nettAmount) * 100 : 0;

        return {
            totalCogs,
            marginInAmount,
            marginInPercentage,
            discount,
            nettAmount,
            nettMargin,
            nettMarginPercentage,
        };
    };

    const calculatedTotalAmount = packageCategories.reduce((sum, cat) => sum + cat.total_price, 0);
    const summaryTotals = calculateSummaryTotals(calculatedTotalAmount);

    return (
        <div className="p-8 backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-3xl">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Packages & Products</h2>
                        <p className="text-gray-600">Add packages and customize products for this order</p>
                    </div>
                    <button
                        onClick={onAddPackage}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-200"
                    >
                        <Plus className="h-4 w-4" />
                        Add Package
                    </button>
                </div>

                {selectedPackages.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Summary Pricing</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-sm text-gray-600 pb-3 text-left">Category</th>
                                            <th className="text-sm text-gray-600 pb-3 text-right">Total Price</th>
                                            {canSeeDetailedPricing(currentUser) && (
                                                <>
                                                    <th className="text-sm text-gray-600 pb-3 text-right">COGS</th>
                                                    <th className="text-sm text-gray-600 pb-3 text-right">Gross Margin</th>
                                                    <th className="text-sm text-gray-600 pb-3 text-right">Margin %</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packageCategories.map((category, index) => {
                                            const categoryMargin = category.total_price - category.cogs;
                                            const categoryMarginPercentage = category.total_price > 0
                                                ? (categoryMargin / category.total_price) * 100
                                                : 0;

                                            return (
                                                <tr key={index}>
                                                    <td className="text-sm text-gray-600 pb-3 pe-4">{category.category}</td>
                                                    <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                        RM {category.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    {canSeeDetailedPricing(currentUser) && (
                                                        <>
                                                            <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                                RM {category.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                                RM {categoryMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="text-sm text-gray-700 font-medium pb-3 text-right whitespace-nowrap">
                                                                {categoryMarginPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            );
                                        })}

                                        <tr className="border-t border-gray-200">
                                            <td className="text-sm text-gray-600 font-bold pt-3 pe-4">
                                                {formData.isBePowered ? 'Override Amount' : 'Total'}
                                            </td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {calculatedTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            {canSeeDetailedPricing(currentUser) && (
                                                <>
                                                    <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                        RM {summaryTotals.totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                        RM {summaryTotals.marginInAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                        {summaryTotals.marginInPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                    </td>
                                                </>
                                            )}
                                        </tr>

                                        {summaryTotals.discount > 0 && (
                                            <tr>
                                                <td className="text-sm text-gray-600 pt-3">Bonus/Discount</td>
                                                <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                    - RM {summaryTotals.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                {canSeeDetailedPricing(currentUser) && (
                                                    <>
                                                        <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">-</td>
                                                        <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                            - RM {summaryTotals.discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="text-sm text-gray-900 pt-3 text-right whitespace-nowrap">
                                                            - {(summaryTotals.marginInPercentage - summaryTotals.nettMarginPercentage).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        )}

                                        <tr>
                                            <td className="text-sm text-gray-600 font-bold pt-3 pe-4">Nett Amount</td>
                                            <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                RM {summaryTotals.nettAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            {canSeeDetailedPricing(currentUser) && (
                                                <>
                                                    <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                        RM {summaryTotals.totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                        RM {summaryTotals.nettMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-sm text-gray-900 font-bold pt-3 text-right whitespace-nowrap">
                                                        {summaryTotals.nettMarginPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {selectedPackages.length > 0 && (
                    <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm space-y-4">
                        <div className="flex gap-4 items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Installment Configuration</h2>
                            <button
                                onClick={handleQuoBePoweredToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${formData.isBePowered ? 'bg-purple-500' : 'bg-gray-200'}`}
                                aria-label={`${formData.isBePowered ? 'Active' : 'Inactive'} BePowered`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${formData.isBePowered ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                            <span className={`text-sm font-medium ${formData.isBePowered ? 'text-purple-700' : 'text-gray-500'}`}>
                                {formData.isBePowered ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        {formData.isBePowered && (
                            <div className="flex items-center gap-2">
                                <span>Tenure (in month)</span>
                                <input
                                    type="number"
                                    value={formData.tenure}
                                    onChange={handleTenureChange}
                                    className="input w-20 px-2 py-1 border border-gray-300 rounded-md"
                                />
                            </div>
                        )}
                        <div className="flex gap-4 items-center">
                            <h2 className="text-lg font-semibold text-gray-900">RenoNow PayLater</h2>
                            <button
                                onClick={handleRnplToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${formData.isRnpl ? 'bg-purple-500' : 'bg-gray-200'}`}
                                aria-label={`${formData.isRnpl ? 'Active' : 'Inactive'} RenoNow PayLater`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${formData.isRnpl ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                            <span className={`text-sm font-medium ${formData.isRnpl ? 'text-purple-700' : 'text-gray-500'}`}>
                                {formData.isRnpl ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                )}

                {selectedPackages.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <PackageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No packages selected</h3>
                        <p className="text-gray-500 mb-4">Add packages to start building your quotation</p>
                        <button
                            onClick={onAddPackage}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                        >
                            <Plus className="h-4 w-4" />
                            Add Your First Package
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <DndContext
                            collisionDetection={closestCenter}
                            onDragEnd={onPackageDragEnd}
                        >
                            <SortableContext
                                items={selectedPackages.map(pkg => `package-${pkg.id}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                {selectedPackages.map((pkg: Package, index: number) => (
                                    <SortablePackageItem
                                        key={`package-${pkg.id}`}
                                        package={pkg}
                                        index={index}
                                        tenure={formData.tenure}
                                        quoBePowered={formData.isBePowered}
                                        isRnpl={formData.isRnpl}
                                        onRemove={removePackage}
                                        onQuantityChange={updateQuantity}
                                        onProductsUpdate={onProductsUpdate}
                                        onAddProduct={() => onAddProduct(pkg.id)}
                                        onAddonToggle={onAddonToggle}
                                        onPaymentMethodChange={onPaymentMethodChange}
                                        onCustomMonthlyAmountChange={onCustomMonthlyAmountChange}
                                        onMarkupUpdate={handleMarkupUpdate}
                                        onRnplMethodChange={onRnplMethodChange}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                )}
            </div>
        </div >
    );
}