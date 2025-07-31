import { Package } from "../../../../types";

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
    isDraftMode: boolean;
    isBePowered: boolean;
    tenure: number
    finalAmount: number;
    bonusDescription: string;
    bonusValue: number;
    internalRemark: string;
}

interface PricingStepProps {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    totalAmount: number;
    netAmount: number;
    selectedPackages: Package[];
    addonPackages: Package[];
    onToggleQuoBePowered: (isIncluded: boolean) => void;
    includedAddonPackages: Package[];
}

export default function PricingStep({ formData, setFormData, totalAmount, netAmount, selectedPackages, addonPackages, onToggleQuoBePowered, includedAddonPackages }: PricingStepProps) {

    // PricingStep.tsx
    const calculatePackageTotal = (pkg: Package) => {
        if (pkg.is_addon && pkg.is_addon_included === false) {
            return 0;
        }

        let packageTotal = 0;

        if (pkg.products && pkg.products.length > 0) {
            packageTotal = pkg.products.reduce((prodSum, product) => {
                let supplyPrice = 0;
                let installPrice = 0;

                if (product.provisioning?.supply) {
                    if (product.pivot?.includeSupply) {
                        supplyPrice = (product.provisioning.supply.retail_price || 0) * (product.pivot.quantity || 1);
                    } else {
                        supplyPrice = Math.max(
                            0,
                            (product.provisioning.supply.retail_price || 0) -
                            (product.provisioning.supply.excluded_price || 0)
                        ) * (product.pivot?.quantity || 1);
                    }
                }

                if (product.provisioning?.install) {
                    if (product.pivot?.includeInstall) {
                        installPrice = (product.provisioning.install.retail_price || 0) * (product.pivot.quantity || 1);
                    } else {
                        installPrice = Math.max(
                            0,
                            (product.provisioning.install.retail_price || 0) -
                            (product.provisioning.install.excluded_price || 0)
                        ) * (product.pivot?.quantity || 1);
                    }
                }

                return prodSum + supplyPrice + installPrice;
            }, 0);
        } else {
            packageTotal = pkg.total_price || 0;
        }

        // Apply markup
        const markupAmount = pkg.markup_amount || 0;
        const markupPercentage = pkg.markup_percentage || 0;
        const baseTotal = packageTotal * (pkg.quantity || 1);
        return markupAmount > 0 ? markupAmount : baseTotal * (1 + markupPercentage);
    };

    const upfrontAmount = selectedPackages.reduce((acc, pkg) => acc + (
        formData.isBePowered &&
            pkg.payment_method === "one-off" &&
            (pkg.is_addon ? pkg.is_addon_included === true : true)
            ? (pkg.markup_amount ? pkg.markup_amount : pkg.total_price) * (pkg.quantity || 1)
            : 0)
        , 25000);

    const monthlySum = selectedPackages.reduce((acc, pkg) => acc + (
        formData.isBePowered &&
            pkg.payment_method !== 'one-off' &&
            (pkg.is_addon ? pkg.is_addon_included === true : true)
            ? pkg.monthly_amount * (pkg.quantity || 1)
            : 0)
        , 0);

    const handleQuoBePoweredChange = () => {
        onToggleQuoBePowered(!formData.isBePowered);
    };


    return (
        <div className="space-y-8">
            <div className="p-8 backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-3xl">
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pricing & Terms</h2>
                        <p className="text-gray-600">Configure pricing, bonuses, and payment terms</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Completion Days</label>
                                <input
                                    type="number"
                                    value={formData.completionDays}
                                    onChange={(e) => setFormData({ ...formData, completionDays: Number.parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                />
                                <p className="text-xs text-gray-500 mt-1">Working days for completion</p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-sm font-medium text-gray-700">Final Pricing Override</label>
                                    <button
                                        onClick={() =>
                                            setFormData({ ...formData, finalAmount: formData.finalAmount > 0 ? 0 : totalAmount })
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.finalAmount > 0 ? "bg-blue-500" : "bg-gray-200"}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${formData.finalAmount > 0 ? "translate-x-6" : "translate-x-1"}`}
                                        />
                                    </button>
                                </div>
                                {formData.finalAmount > 0 && (
                                    <input
                                        type="number"
                                        value={formData.finalAmount}
                                        onChange={(e) => setFormData({ ...formData, finalAmount: Number.parseFloat(e.target.value) })}
                                        className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                    />
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">Progressive Payment</label>
                                    <button
                                        onClick={() => setFormData({ ...formData, isProgressivePayment: !formData.isProgressivePayment })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.isProgressivePayment ? "bg-blue-500" : "bg-gray-200"}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${formData.isProgressivePayment ? "translate-x-6" : "translate-x-1"}`}
                                        />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 font-semibold">
                                    {formData.isProgressivePayment ? "Payment in stages" : "Full payment upfront"}
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">BePowered 2.0</label>
                                    <button
                                        onClick={handleQuoBePoweredChange}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.isBePowered ? "bg-blue-500" : "bg-gray-200"}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${formData.isBePowered ? "translate-x-6" : "translate-x-1"}`}
                                        />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 font-semibold">
                                    {formData.isBePowered ? "Active" : "Inactive"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Bonus Description</label>
                                <textarea
                                    placeholder="Describe the bonus or discount..."
                                    value={formData.bonusDescription}
                                    onChange={(e) => setFormData({ ...formData, bonusDescription: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Bonus Value (RM)</label>
                                <input
                                    type="number"
                                    value={formData.bonusValue}
                                    onChange={(e) => setFormData({ ...formData, bonusValue: Number.parseFloat(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>

                    {addonPackages && addonPackages.length > 0 && (
                        <div className="border-t border-gray-200 pt-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Add-On Packages Summary</h4>
                            <div className="space-y-2">
                                <div className="text-sm text-gray-600">
                                    Total Add-On Packages: {addonPackages.length}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Included Add-On Packages: {includedAddonPackages ? includedAddonPackages.length : 0}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Excluded Add-On Packages: {addonPackages.length - (includedAddonPackages ? includedAddonPackages.length : 0)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {formData.isBePowered &&
                <div className="p-8 backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-3xl">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">BePowered 2.0 Pricing</h2>
                            {/* <p className="text-gray-600"></p> */}
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-medium text-gray-900">Original Nett Amount</span>
                            </div>
                            <span className="font-medium">RM {netAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                            </span>
                        </div>

                        <div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">Upfront Payment</span>
                                <span className="font-medium">RM {upfrontAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-600 mt-2">
                                <span>Base Price</span>
                                <span>RM 25,000</span>
                            </div>

                            {selectedPackages.filter(pkg =>
                                formData.isBePowered &&
                                pkg.payment_method === 'one-off' &&
                                (pkg.is_addon ? pkg.is_addon_included === true : true)
                            ).map((pkg, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center text-gray-600 mt-2"
                                >
                                    <div className="flex items-center">
                                        <span>{pkg.name} x{(pkg.quantity || 1)}</span>
                                        {pkg.is_addon && (
                                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                Add-On
                                            </span>
                                        )}
                                    </div>
                                    <span>RM {(pkg.markup_amount * (pkg.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">Installment ({formData.tenure} months)</span>
                                <span className="font-medium">RM {monthlySum.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}/mth</span>
                            </div>

                            {selectedPackages.filter(pkg =>
                                formData.isBePowered &&
                                pkg.payment_method !== 'one-off' &&
                                (pkg.is_addon ? pkg.is_addon_included === true : true)
                            ).map((pkg, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center text-gray-600 mt-2"
                                >
                                    <div className="flex items-center">
                                        <span>{pkg.name} x{(pkg.quantity || 1)}</span>
                                        {pkg.is_addon && (
                                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                Add-On
                                            </span>
                                        )}
                                    </div>
                                    <span>RM {(pkg.monthly_amount * (pkg.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mth</span>
                                </div>
                            ))}
                        </div>

                        {/* BePowered 2.0 Total Pricing */}
                        <div className="flex flex-col mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                                <span>Total</span>
                                <span>RM {upfrontAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })} + (RM {monthlySum.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })} / month)</span>
                            </div>

                            <div className="flex justify-between items-center text-green-600 mt-2">
                                <span>EPP (36 months)</span>
                                <span>RM {((upfrontAmount * 1.105) / 36).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}/mth</span>
                            </div>

                            <div className="flex justify-between items-center text-green-600 mt-2">
                                <span>EPP (60 months)</span>
                                <span>RM {((upfrontAmount * 1.14) / 60).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}/mth</span>
                            </div>
                        </div>
                    </div>
                </div>
            }

            {!formData.isBePowered &&
                <div className="p-8 backdrop-blur-xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-white/20 shadow-xl rounded-3xl">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Pricing Summary</h3>

                    <div className="space-y-4">
                        {selectedPackages.map((pkg: Package) => {
                            if (pkg.is_addon === true && pkg.is_addon_included === false) {
                                return null;
                            }

                            return (
                                <div key={pkg.id} className="flex justify-between items-center py-2">
                                    <div>
                                        <span className="font-medium text-gray-900">{pkg.name}</span>
                                        <span className="text-gray-500 ml-2">× {pkg.quantity || 1}</span>
                                        {pkg.is_addon && (
                                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                Add-On
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-medium">RM {((pkg.total_price || 0) * (pkg.quantity || 1)).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                    </span>
                                </div>
                            );
                        })}

                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold text-gray-900">Subtotal</span>
                                <span className="font-semibold">RM {totalAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</span>
                            </div>

                            {formData.bonusValue > 0 && (
                                <div className="flex justify-between items-center text-green-600 mt-2">
                                    <span>Bonus/Discount</span>
                                    <span>- RM {formData.bonusValue.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-xl font-bold text-gray-900 mt-4 pt-4 border-t border-gray-200">
                                <span>Total Amount</span>
                                <span>RM {netAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}