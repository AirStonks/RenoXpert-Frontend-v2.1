import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Package as PackageIcon, Award, CreditCard } from 'lucide-react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import { getCampaign } from '../../services/publicApi';
import { Campaign, Order, OrderQuotation, Package, Product } from '../../types';
import { getRenoSubscriptionFixedOverrideNettAmount } from '../../utils/renoSubscription';

type TemplateOrderLike = Order & {
  latest_quotation?: OrderQuotation & { packages?: Package[] };
};

function currency(v: number | undefined) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));
}

function getProductQty(product: Product): number {
  return Number(product.pivot?.quantity || 0);
}

export default function CampaignQuotationDetailPage() {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPackageIds, setExpandedPackageIds] = useState<Record<string, boolean>>({});
  const [selectedPlan, setSelectedPlan] = useState<string>('60');

  useEffect(() => {
    const run = async () => {
      if (!campaignSlug) {
        setError('Campaign slug is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await getCampaign(campaignSlug);
        if (res?.success) {
          setCampaign(res.data);
          document.title = `${res.data?.title || 'Campaign'} | Detail`;
        } else {
          setError('Campaign not found');
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [campaignSlug]);

  const templateOrder: TemplateOrderLike | null = useMemo(() => {
    // Backend contract (expected): campaign.order (preferred) or campaign.order_id (with additional public fetch)
    // For now we render directly if campaign.order is present.
    return (campaign as unknown as { order?: TemplateOrderLike })?.order || null;
  }, [campaign]);

  const templateQuotation = templateOrder?.latest_quotation || null;

  const computedGrandTotal = useMemo(() => {
    const pkgs = templateQuotation?.packages || [];
    if (!pkgs.length) return 0;
    return pkgs.reduce((sum, pkg) => sum + Number(pkg.total_price || 0), 0);
  }, [templateQuotation]);


  const displayQuotationAmount = useMemo(() => {
    // For now we mirror the computedGrandTotal (sum of package totals)
    // so that we have a clear, package-derived quotation amount.
    return computedGrandTotal;
  }, [computedGrandTotal]);

  // Parse bonus from quotation or order
  const bonus = useMemo(() => {
    try {
      if (templateQuotation?.bonus) {
        if (typeof templateQuotation.bonus === 'string') {
          return JSON.parse(templateQuotation.bonus);
        }
        return templateQuotation.bonus;
      }
      if (templateOrder?.bonus) {
        if (typeof templateOrder.bonus === 'string') {
          return JSON.parse(templateOrder.bonus);
        }
        return templateOrder.bonus;
      }
      return null;
    } catch {
      return null;
    }
  }, [templateQuotation?.bonus, templateOrder?.bonus]);

  // Determine payment program
  const selectedProgram = useMemo(() => {
    if (templateOrder?.is_be_powered) return 'bePowered';
    if (templateOrder?.is_rnpl) return 'rnpl';
    return 'normal';
  }, [templateOrder?.is_be_powered, templateOrder?.is_rnpl]);

  // Calculate upfront amount (for bePowered)
  const upfrontAmount = useMemo(() => {
    if (!templateOrder?.is_be_powered) return 0;
    const pkgs = templateQuotation?.packages || [];
    return pkgs.reduce((acc, pkg) => acc + (
      templateOrder.is_be_powered &&
        pkg.payment_method === 'one-off' &&
        (pkg.is_addon ? pkg.is_addon_included === true : true)
        ? (pkg.markup_amount ? pkg.markup_amount : pkg.total_price) * (pkg.quantity || 1)
        : 0)
      , templateOrder.be_powered_base_price || 0);
  }, [templateOrder?.is_be_powered, templateOrder?.be_powered_base_price, templateQuotation?.packages]);

  // Calculate total excluded addon amount (for calculations)
  const totalExcludedAddonAmount = useMemo(() => {
    if (templateOrder?.f_1 && templateOrder?.total_amount != null) {
      return Number(templateOrder.total_amount);
    }
    const pkgs = templateQuotation?.packages || [];
    return pkgs.reduce((total, pkg) => {
      if (pkg.is_addon === true && pkg.is_addon_included === false) {
        return total;
      }
      const packagePrice = templateOrder?.is_rnpl && pkg.markup_amount
        ? pkg.markup_amount
        : (pkg.total_price || 0);
      return total + Number(packagePrice) * (pkg.quantity || 1);
    }, 0);
  }, [templateOrder?.f_1, templateOrder?.total_amount, templateOrder?.is_rnpl, templateQuotation?.packages]);

  // Calculate total RenoNow price (for rnpl)
  const totalRenoNowPrice = useMemo(() => {
    if (!templateOrder?.is_rnpl) return 0;
    return templateOrder.rnpl_base_price || 0;
  }, [templateOrder?.is_rnpl, templateOrder?.rnpl_base_price]);

  // Calculate bonus value
  const bonusValue = useMemo(() => {
    return Number(bonus?.value) || 0;
  }, [bonus?.value]);

  // Calculate override total quotation amount (for Reno Subscription fixed method)
  const overrideTotalQuotationAmount = useMemo(() => {
    return getRenoSubscriptionFixedOverrideNettAmount({
      isRenoSubscription: selectedProgram === 'bePowered' && Boolean(templateOrder?.is_be_powered),
      installmentMethod: templateOrder?.installment_method,
      upfrontAmount,
      installmentAmount: templateOrder?.installment_amount,
      tenure: templateOrder?.tenure,
      bonusValue,
    });
  }, [selectedProgram, templateOrder?.is_be_powered, templateOrder?.installment_method, upfrontAmount, templateOrder?.installment_amount, templateOrder?.tenure, bonusValue]);

  const displayTotalQuotationAmount = useMemo(() => {
    return overrideTotalQuotationAmount ?? (totalExcludedAddonAmount - bonusValue);
  }, [overrideTotalQuotationAmount, totalExcludedAddonAmount, bonusValue]);

  const headerThumbUrl = useMemo(() => {
    const thumb = campaign?.thumbnail as unknown as { file_url?: string } | string | undefined;
    if (!thumb) return null;
    if (typeof thumb === 'string') return thumb;
    return thumb.file_url || null;
  }, [campaign?.thumbnail]);

  const togglePackage = (pkgId: string) => {
    setExpandedPackageIds((prev) => ({ ...prev, [pkgId]: !prev[pkgId] }));
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-96 bg-gray-200 rounded" />
            <div className="h-40 w-full bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Unable to load details</h1>
          <p className="mt-3 text-gray-600">{error || 'Campaign not found'}</p>
          <div className="mt-8">
            <Link
              to=".."
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div>
              <div className="text-sm text-gray-500">Campaign detail</div>
              <div className="text-lg font-semibold text-gray-900">{campaign.title}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">

        {/* Template order-like section */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <PackageIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Campaign Details</h2>
                <p className="text-xs text-gray-600">Packages, items and pricing breakdown</p>
              </div>
            </div>
          </div>

          {!templateOrder || !templateQuotation ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <PackageIcon className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No template order configured</h3>
              <p className="mt-2 text-gray-600">
                This campaign doesn�t have a linked template order yet.
              </p>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-4">
              {/* Payment Summary */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-5 h-5 text-blue-600" aria-label="Payment Icon" />
                    <span className='text-sm font-bold text-blue-600'>
                      {templateOrder.is_be_powered ? (
                        "Reno Subscription"
                      ) : templateOrder.is_rnpl ? (
                        "RenoNow PayLater"
                      ) : (
                        "Full Payment"
                      )}
                    </span>
                  </div>

                  {selectedProgram !== 'rnpl' && (
                    <select
                      className="flex select select-sm w-fit pr-8 border border-gray-300 rounded-md bg-white py-0 px-2 text-2xs h-6 appearance-none"
                      id="payment_plan"
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      name="payment_plan"
                      disabled={selectedProgram === 'bePowered'}
                    >
                      {selectedProgram !== 'bePowered' && (
                        <option value="36">36 months</option>
                      )}
                      <option value="60">60 months</option>
                    </select>
                  )}
                </div>
                <div className="flex justify-between">
                  {selectedProgram === 'normal' ? (
                    <>
                      <div className="flex flex-col items-start w-full">
                        <p className="text-lg text-[#d71e42] font-bold">
                          RM{' '}
                          {(
                            ((totalExcludedAddonAmount - bonusValue) *
                              (selectedPlan === '60' ? 1.14 : 1.105)) /
                            Number(selectedPlan)
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                          <span className="text-sm text-gray-600">/month </span>
                          <span className="text-xs text-gray-600">for {selectedPlan === '60' ? '60' : '36'} months</span>
                        </p>

                        {!templateOrder.is_be_powered && (
                          <div className="flex justify-between w-full">
                            <p className="italic text-gray-600 text-xs flex items-center">
                              <span>(Terms & Conditions)</span>
                              <button className="mx-1" data-modal-toggle="#payment_info_modal">
                                <InformationCircleIcon className="w-4 h-4 text-yellow-500" aria-label="Payment Info" />
                              </button>
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : selectedProgram === 'bePowered' ? (
                    <div className="flex flex-col items-start w-full">
                      <p className="text-lg text-[#d71e42] font-bold">
                        <span className="text-sm text-gray-600">Total </span>
                        RM {(upfrontAmount - bonusValue).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                        <span className="text-sm text-gray-600"> Upfront</span>
                      </p>
                      <div className="flex w-full justify-between">
                        <p className="text-sm text-[#d71e42] font-bold">
                          <span className="text-sm text-gray-600">pay </span>
                          RM{' '}
                          {templateOrder.is_be_powered
                            ? (templateOrder.installment_method === 'fixed'
                              ? Number(templateOrder.installment_amount || 0)
                              : totalExcludedAddonAmount - bonusValue - upfrontAmount
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })
                            : (
                              ((totalExcludedAddonAmount - bonusValue) * (selectedPlan === '60' ? 1.14 : 1.105)) /
                              Number(selectedPlan)
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          <span className="text-xs text-gray-600"> for {templateOrder?.tenure || 60} months</span>
                        </p>
                      </div>
                      {!templateOrder.is_be_powered && (
                        <div className="flex justify-between w-full">
                          <p className="italic text-gray-600 text-xs flex items-center">
                            <span>(Terms & Conditions)</span>
                            <button className="mx-1" data-modal-toggle="#payment_info_modal">
                              <InformationCircleIcon className="w-4 h-4 text-yellow-500" aria-label="Payment Info" />
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : selectedProgram === 'rnpl' ? (
                    <div className="flex flex-col items-start w-full">
                      <p className="text-lg text-[#d71e42] font-bold">
                        <span className="text-sm text-gray-600">Kickstart <span className="text-lg text-[#d71e42] font-bold">NOW</span> by just paying </span>
                        RM{' '}
                        {totalRenoNowPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  ) : null}
                </div>
                {selectedProgram === 'normal' && (
                  <div className="flex items-start justify-between mt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-600">
                        <strong>Or</strong> pay one-time: RM{' '}
                        {(totalExcludedAddonAmount - bonusValue).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}
                {selectedProgram === 'rnpl' && (
                  <div className="flex items-start justify-between mt-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-600">
                        Remaining RM{' '}
                        {((totalExcludedAddonAmount - totalRenoNowPrice) - bonusValue).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        covered by tenants
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <hr className="my-2" />

              {/* Quotation summary - Pricing Section style */}
              <div className="space-y-4">
                {/* Discount */}
                {bonus && (
                  <div className="">
                    <h3 className="text-xs text-teal-600 font-bold">Discount:</h3>
                    <div className="text-2xs text-gray-600 font-semibold space-y-2 mt-1">
                      {(bonus.description?.split('\n') || ['No Details']).map((item: string, index: number) => (
                        <p key={index} className="mb-1 last:mb-0">
                          {item}
                        </p>
                      ))}
                    </div>
                    {Number(bonus?.value) !== 0 && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-2xs text-gray-600 font-semibold">Total Discount:</span>
                        <p className="text-sm text-teal-600 font-bold">
                          RM{' '}
                          {Number(bonus.value).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <hr className="my-2" />

                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-800">Total Quotation Amount: </span>
                  <span className="text-xs text-gray-800 font-semibold whitespace-nowrap">RM {displayTotalQuotationAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}</span>
                </div>

                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-800">Payment Terms: </span>
                    <span className="text-xs text-gray-800 font-semibold whitespace-nowrap">
                      {selectedProgram === 'bePowered'
                        ? 'Reno Subscription'
                        : selectedProgram === 'rnpl'
                          ? 'RenoNow PayLater'
                          : 'Full Payment'}
                    </span>
                  </div>
                </div>

                {!templateOrder?.is_progressive_payment && !templateOrder?.is_be_powered && !templateOrder?.is_rnpl ? null : (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-800">Initial Down Payment: </span>
                    {selectedProgram === 'bePowered' && (
                      <span className="text-xs text-gray-800 font-semibold whitespace-nowrap">
                        RM {(upfrontAmount - (Number(bonus?.value) || 0)).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    )}
                    {selectedProgram === 'rnpl' && (
                      <span className="text-xs text-gray-800 font-semibold whitespace-nowrap">
                        RM {totalRenoNowPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    )}
                    {selectedProgram !== 'rnpl' && selectedProgram !== 'bePowered' && (
                      <span className="text-xs text-gray-800 font-semibold whitespace-nowrap">
                        RM {(totalExcludedAddonAmount / 2).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </div>
                )}

                {!templateOrder?.is_progressive_payment && !templateOrder?.is_be_powered && !templateOrder?.is_rnpl ? null : (
                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-800">Balance Payment: </span>
                      {selectedProgram === 'bePowered' && (
                        templateOrder?.installment_method === 'fixed' ? (
                          <span className="text-xs text-gray-800 font-semibold whitespace-nowrap">
                            RM {Number(templateOrder.installment_amount || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}/mth
                          </span>
                        ) : (
                          <span className="text-xs text-gray-800 font-semibold whitespace-nowrap">
                            RM {(totalExcludedAddonAmount - (Number(bonus?.value) || 0) - upfrontAmount).toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        )
                      )}
                      {selectedProgram === 'rnpl' && (
                        <span className="text-xs text-gray-800 font-semibold whitespace-nowrap">
                          RM {(totalExcludedAddonAmount - (Number(bonus?.value) || 0) - totalRenoNowPrice).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      )}
                      {selectedProgram !== 'rnpl' && selectedProgram !== 'bePowered' && (
                        <span className="text-xs text-gray-800 font-semibold whitespace-nowrap">
                          RM {(totalExcludedAddonAmount / 2).toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </div>
                    {selectedProgram === 'bePowered' && (
                      <div className="flex justify-end">
                        <span className="text-2xs text-gray-600 italic">Pay in {templateOrder?.tenure || 60} mths</span>
                      </div>
                    )}
                    {selectedProgram === 'rnpl' && (
                      <div className="flex justify-end">
                        <span className="text-2xs text-gray-600 italic">Pay through RPM</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Packages */}
              <div className="space-y-4">
                {(() => {
                  const pkgs = templateQuotation.packages || [];
                  const regularPackages = pkgs.filter(pkg => !pkg.is_addon);
                  const addonPackages = pkgs.filter(pkg => pkg.is_addon === true);

                  const renderPackage = (pkg: Package, isAddon: boolean) => {
                    const pkgId = String(pkg.id ?? pkg.name ?? 'pkg');
                    const expanded = !!expandedPackageIds[pkgId];
                    const products = (pkg.products || []) as Product[];

                    return (
                      <div
                        key={pkgId}
                        className={`border rounded-2xl overflow-hidden ${isAddon ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                      >
                        <button
                          type="button"
                          onClick={() => togglePackage(pkgId)}
                          className={`w-full flex items-center justify-between p-4 sm:p-5 transition-colors ${isAddon ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                        >
                          <div className="text-left flex-1">
                            {isAddon && (
                              <div className="text-xs font-bold text-blue-700 mb-1">Optional Add-on Package</div>
                            )}
                            <div className={`text-sm font-semibold ${isAddon ? 'text-gray-900' : 'text-gray-900'}`}>
                              {pkg.name || 'Package'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {products.length} item(s)
                            </div>
                          </div>
                          {expanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-600 ml-4 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-600 ml-4 flex-shrink-0" />
                          )}
                        </button>

                        {expanded && (
                          <div className="p-4 sm:p-5 bg-white">
                            {pkg.description && (
                              <p className="text-xs text-gray-600 mb-4 whitespace-pre-line">
                                {pkg.description}
                              </p>
                            )}

                            {products.length === 0 ? (
                              <div className="text-sm text-gray-600">No items in this package.</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="text-gray-700">
                                    <tr className="border-b">
                                      <th className="text-sm py-2 pr-4 text-left min-w-[240px]">Item</th>
                                      <th className="text-sm py-2 px-3 text-center min-w-[80px]">Qty</th>
                                    </tr>
                                  </thead>
                                  <tbody className="text-gray-800">
                                    {products.map((p) => (
                                      <tr key={String(p.id)} className="border-b last:border-b-0">
                                        <td className="py-3 pr-4">
                                          <div className="text-xs font-medium text-gray-900">{p.name || '-'}</div>
                                          {p.description && (
                                            <div className="text-2xs text-gray-500 mt-1 line-clamp-2">{p.description}</div>
                                          )}
                                        </td>
                                        <td className="text-xs py-3 px-3 text-center">{getProductQty(p)} {p.uom}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <>
                      {regularPackages.map((pkg) => renderPackage(pkg, false))}
                      {addonPackages.length > 0 && (
                        <div className="mt-4 space-y-4 p-4 rounded-xl border bg-blue-50 border-blue-600">
                          <div className="font-bold flex items-center gap-2 mb-2">
                            <Award className="w-6 h-6 text-orange-500" aria-label="Award Icon" />
                            <h3 className="text-sm text-gray-900">OPTIONAL ADD-ON PACKAGES</h3>
                          </div>
                          {addonPackages.map((pkg) => renderPackage(pkg, true))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


