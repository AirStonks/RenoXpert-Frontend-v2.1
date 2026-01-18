import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Package as PackageIcon } from 'lucide-react';
import { getCampaign } from '../../services/publicApi';
import { Campaign, Order, OrderQuotation, Package, Product } from '../../types';

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

function getProductUnitPrice(product: Product): number {
  const supply = (product.provisioning?.supply?.retail_price || 0);
  const install = (product.provisioning?.install?.retail_price || 0);
  return supply + install;
}

function getProductQty(product: Product): number {
  return Number(product.pivot?.quantity || 0);
}

function getProductTotalPrice(product: Product): number {
  return getProductUnitPrice(product) * getProductQty(product);
}

export default function CampaignQuotationDetailPage() {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPackageIds, setExpandedPackageIds] = useState<Record<string, boolean>>({});

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
            <Link
              to=".."
              className="p-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <div>
              <div className="text-sm text-gray-500">Campaign detail</div>
              <div className="text-lg font-semibold text-gray-900">{campaign.title}</div>
            </div>
          </div>
          <Link
            to="..#booking-section"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Back to booking
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{campaign.title}</h1>
              {campaign.description && (
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {campaign.description.split('\n').map((line, idx) => (
                    <span key={idx}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="text-sm font-semibold text-gray-700 mb-3">Campaign Thumbnail</div>
              {headerThumbUrl ? (
                <img
                  src={headerThumbUrl}
                  alt={campaign.title || 'Campaign thumbnail'}
                  className="w-full h-44 object-contain bg-gray-50 rounded-2xl border border-gray-200"
                />
              ) : (
                <div className="w-full h-44 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500">
                  No image
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Template order-like section */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <PackageIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Template Order Details</h2>
                <p className="text-sm text-gray-600">Packages, items and pricing breakdown</p>
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
                This campaign doesn’t have a linked template order yet.
              </p>
            </div>
          ) : (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="text-sm text-gray-500">Order no</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {templateOrder.order_no || `Order #${templateOrder.id || '-'}`}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="mt-1 font-semibold text-gray-900">
                    {templateQuotation.total_amount != null
                      ? currency(templateQuotation.total_amount)
                      : (templateOrder.total_amount != null ? currency(templateOrder.total_amount) : currency(computedGrandTotal))}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="text-sm text-gray-500">Packages</div>
                  <div className="mt-1 font-semibold text-gray-900">{templateQuotation.packages?.length || 0}</div>
                </div>
              </div>

              {/* Packages */}
              <div className="space-y-4">
                {(templateQuotation.packages || []).map((pkg) => {
                  const pkgId = String(pkg.id ?? pkg.name ?? 'pkg');
                  const expanded = !!expandedPackageIds[pkgId];
                  const products = (pkg.products || []) as Product[];

                  return (
                    <div key={pkgId} className="border border-gray-200 rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => togglePackage(pkgId)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{pkg.name || 'Package'}</div>
                          <div className="text-sm text-gray-600">
                            {products.length} item(s) · {currency(Number(pkg.total_price || 0))}
                          </div>
                        </div>
                        {expanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-600" />
                        )}
                      </button>

                      {expanded && (
                        <div className="p-4 sm:p-5 bg-white">
                          {pkg.description && (
                            <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">
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
                                    <th className="py-2 pr-4 text-left min-w-[240px]">Item</th>
                                    <th className="py-2 px-3 text-center min-w-[80px]">Qty</th>
                                    <th className="py-2 px-3 text-right min-w-[140px]">Unit Price</th>
                                    <th className="py-2 pl-3 text-right min-w-[140px]">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="text-gray-800">
                                  {products.map((p) => (
                                    <tr key={String(p.id)} className="border-b last:border-b-0">
                                      <td className="py-3 pr-4">
                                        <div className="font-medium text-gray-900">{p.name || '-'}</div>
                                        {p.description && (
                                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</div>
                                        )}
                                      </td>
                                      <td className="py-3 px-3 text-center">{getProductQty(p)}</td>
                                      <td className="py-3 px-3 text-right">{currency(getProductUnitPrice(p))}</td>
                                      <td className="py-3 pl-3 text-right">{currency(getProductTotalPrice(p))}</td>
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
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


