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
    isRnpl: boolean;
    rnpl_base_price: number;
    tenure: number;
    finalAmount: number;
    bonusDescription: string;
    bonusValue: number;
    internalRemark: string;
    installment_method?: 'fixed' | 'dynamic' | string
    installment_amount?: number;
    be_powered_base_price?: number;
}

interface PricingStepProps {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    totalAmount: number;
    netAmount: number;
    selectedPackages: Package[];
    addonPackages: Package[];
    onToggleQuoBePowered: (isIncluded: boolean) => void;
    onToggleRnpl: (isIncluded: boolean) => void;
    includedAddonPackages: Package[];
}

export default function PricingStep({ formData, setFormData, totalAmount, netAmount, selectedPackages, addonPackages, onToggleQuoBePowered, onToggleRnpl, includedAddonPackages }: PricingStepProps) {
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
        , formData.be_powered_base_price || 25000);

    const monthlySum = formData.installment_method === 'fixed'
        ? (formData.installment_amount || 0)
        : selectedPackages.reduce((acc, pkg) => acc + (
            formData.isBePowered &&
                pkg.payment_method !== 'one-off' &&
                (pkg.is_addon ? pkg.is_addon_included === true : true)
                ? pkg.monthly_amount * (pkg.quantity || 1)
                : 0)
            , 0);

    const handleQuoBePoweredChange = () => {
        onToggleQuoBePowered(!formData.isBePowered);
    };

    const totalMarkupAmount = selectedPackages.reduce((sum, pkg) => {
        if (pkg.is_addon === true && pkg.is_addon_included === false) {
            return sum;
        }
        return sum + ((pkg.markup_amount || 0) * (pkg.quantity || 1));
    }, 0);

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

                            {(!formData.isBePowered && !formData.isRnpl) && (
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
                            )}

                            {!formData.isBePowered && (
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">RenoNow PayLater</label>
                                    <button
                                        onClick={() => onToggleRnpl(!formData.isRnpl)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.isRnpl ? "bg-blue-500" : "bg-gray-200"}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${formData.isRnpl ? "translate-x-6" : "translate-x-1"}`}
                                        />
                                    </button>
                                </div>
                            )}

                            {(!formData.isBePowered && formData.isRnpl) && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">RenoNow Price (RM)</label>
                                    <input
                                        type="number"
                                        value={formData.rnpl_base_price || 0}
                                        onChange={(e) => setFormData({ ...formData, rnpl_base_price: Number.parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Base price for RenoNow PayLater</p>
                                </div>
                            )}

                            {!formData.isRnpl && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">Installment Plan</label>
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
                            )}

                            {formData.isBePowered && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Installment Method</label>
                                    <select
                                        value={formData.installment_method || 'dynamic'}
                                        onChange={(e) => setFormData({ ...formData, installment_method: e.target.value as 'fixed' | 'dynamic' })}
                                        className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                    >
                                        <option value="dynamic">Dynamic</option>
                                        <option value="fixed">Fixed</option>
                                    </select>
                                </div>
                            )}

                            {formData.isBePowered && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Base Price (RM)</label>
                                    <input
                                        type="number"
                                        value={formData.be_powered_base_price || 25000}
                                        onChange={(e) => setFormData({ ...formData, be_powered_base_price: Number.parseFloat(e.target.value) || 25000 })}
                                        className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Base price for installment plan</p>
                                </div>
                            )}

                            {formData.isBePowered && formData.installment_method === 'fixed' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Fixed Installment Amount (RM)</label>
                                    <input
                                        type="number"
                                        value={formData.installment_amount || ''}
                                        onChange={(e) => setFormData({ ...formData, installment_amount: Number.parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 h-12 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
                                    />
                                    <span className="text-sm text-red-600">* Note: Fixed installment will hide the packages from Installment section</span>
                                </div>
                            )}
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
                </div>
            </div>

            {(formData.isBePowered && !formData.isRnpl) &&
                <div className="p-8 backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-3xl">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Installment Plan Detail</h2>
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
                                <span>RM {(formData.be_powered_base_price || 25000).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}</span>
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
                                {/* <span className="font-medium text-gray-900">Installment ({formData.tenure} months)</span>
                                <span className="font-medium">RM {formData.installment_method === 'fixed' ? formData.installment_amount : monthlySum.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}/mth</span> */}
                                <span className="font-medium text-gray-900">Balance Amount</span>
                                <span className="font-medium">RM {formData.installment_method === 'fixed' ? `${formData.installment_amount}/mth` : (netAmount - (formData.be_powered_base_price || 25000)).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}</span>
                            </div>

                            {/* {formData.installment_method === 'fixed'
                                ? (
                                    <div className="flex justify-between items-center text-gray-600 mt-1">
                                        <div className="flex items-center">
                                            <span>Installment method fixed</span>
                                        </div>
                                        <span>Fixed</span>
                                    </div>
                                ) : selectedPackages.filter(pkg =>
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
                                ))} */}
                        </div>

                        {formData.bonusValue > 0 &&
                            <div>
                                <div className="flex justify-between items-center text-red-600">
                                    <span className="font-medium">Bonus</span>
                                    <span className="font-medium">- RM {formData.bonusValue.toLocaleString(undefined, {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    })}</span>
                                </div>
                            </div>
                        }

                        <div className="flex flex-col mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                                <span>Total</span>
                                <span>RM {(upfrontAmount - (formData.bonusValue || 0)).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })} + (RM {formData.installment_method === 'fixed' ? formData.installment_amount : monthlySum.toLocaleString(undefined, {
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

            {(formData.isRnpl && !formData.isBePowered) &&
                <div className="p-8 backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl rounded-3xl">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">RenoNow PayLater Detail</h2>
                        </div>

                        {/* <div className="flex justify-between items-center">
                            <div>
                                <span className="font-medium text-gray-900">Original Nett Amount</span>
                            </div>
                            <span className="font-medium">RM {netAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                            </span>
                        </div> */}

                        <div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">Packages</span>
                                {totalMarkupAmount > 0 ? (
                                    <span className="font-medium">RM {totalMarkupAmount.toLocaleString(undefined, {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    })}</span>
                                ) : null
                                }
                            </div>



                            {selectedPackages.map((pkg: Package, index: number) => {
                                if (pkg.is_addon === true && pkg.is_addon_included === false) {
                                    return null;
                                }

                                return (
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
                                        <div className="text-right">
                                            <span>RM {(pkg.markup_amount * (pkg.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">RenoNow Price</span>
                            <span className="font-medium">RM {(formData.rnpl_base_price || 0).toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            })}</span>
                        </div>

                        <div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">PayLater Price (Original)</span>
                                <span className="font-medium">RM {(totalAmount - (formData.rnpl_base_price || 0)).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}</span>
                            </div>
                        </div> */}
                        {formData.bonusValue > 0 &&
                            <div>
                                <div className="flex justify-between items-center text-red-600">
                                    <span className="font-medium">Bonus</span>
                                    <span className="font-medium">- RM {formData.bonusValue.toLocaleString(undefined, {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    })}</span>
                                </div>
                            </div>
                        }

                        <div className="flex flex-col mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                                <span>Subtotal</span>
                                <span className="font-medium text-lg">RM {(totalMarkupAmount - formData.bonusValue).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}</span>
                            </div>
                        </div>

                        {(() => {
                            // Find all packages with rnpl_method === 'reno-now'
                            const renoNowPackages = selectedPackages.filter((pkg: Package) => pkg.rnpl_method === 'reno-now' && (pkg.is_addon === true && pkg.is_addon_included === true));
                            // Calculate the sum of total_price for these packages
                            const renoNowPackagesTotal = renoNowPackages.reduce(
                                (sum, pkg) => sum + ((pkg.markup_amount || 0) * (pkg.quantity || 1)),
                                0
                            );
                            // The RenoNow Price is the base price plus the sum of the returned packages' total_price
                            const renoNowPrice = (formData.rnpl_base_price || 0) + renoNowPackagesTotal;

                            return (
                                <div className="flex flex-col mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                                        <span>RenoNow Price</span>
                                        <span>
                                            RM {renoNowPrice.toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0
                                            })}
                                        </span>
                                    </div>

                                    {renoNowPackages &&
                                        <div className="flex justify-between items-center text-gray-600 mt-2">
                                            <div className="flex items-center">
                                                <span>RenoNow Base Price</span>
                                            </div>
                                            <span>
                                                RM {((formData.rnpl_base_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                    }

                                    {renoNowPackages.map((pkg: Package, index: number) => (
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
                                            <span>
                                                RM {((pkg.markup_amount || 0) * (pkg.quantity || 1)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                    ))}

                                    <div className="flex justify-between items-center text-xl font-bold text-gray-900 mt-4">
                                        <span>PayLater Price</span>
                                        <span className="font-medium text-lg">
                                            RM {((totalMarkupAmount - renoNowPrice) - formData.bonusValue).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0
                                            })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            }

            {!formData.isBePowered && !formData.isRnpl &&
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
                                    <span className="font-medium">RM {(calculatePackageTotal(pkg) * (pkg.quantity || 1)).toLocaleString(undefined, {
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
        </div >
    )
}