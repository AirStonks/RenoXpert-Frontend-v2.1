import type { Order, Package, Product } from '../types';

/**
 * Per-package quotation price — the single source of truth shared by the Owner
 * "Summary Pricing" view and the public Campaign Package Detail page, so the two
 * can never disagree on a quotation total again.
 *
 * This mirrors the Owner computation in
 * `src/pages/OwnerPages/OrderOverview.tsx` (the `categoryTotal` calc, ~lines 152-173):
 *   - RenoNow PayLater (order.is_rnpl): markup_amount × package quantity
 *   - otherwise (Full Payment / Reno Subscription): recompute from each product's
 *     supply + install RETAIL price, honoring includeSupply/includeInstall,
 *     excluded_price, and the per-product pivot quantity, then × the package quantity.
 *
 * The public campaign page previously used the package's stored `total_price`
 * field instead, which can drift out of sync with the products' retail prices —
 * causing the campaign total to differ from the owner total. Recomputing from
 * products here keeps both pages identical.
 *
 * NOTE: if the Owner formula in OrderOverview.tsx changes, update this function too
 * (ideally route OrderOverview through this util as well).
 */
export function getQuotationPackagePrice(pkg: Package, order?: Order | null): number {
    const pkgQty = pkg.quantity || 1;

    // RenoNow PayLater uses the pre-marked-up amount directly (matches owner).
    if (order?.is_rnpl) {
        return (Number(pkg.markup_amount) || 0) * pkgQty;
    }

    // Recompute from the package's products (supply + install retail), matching owner.
    const products: Product[] = pkg.products || [];
    const perPackage = products.reduce((total, product) => {
        const supplyRetail = Number(product.provisioning?.supply?.retail_price);
        const supplyExcluded = Number(product.provisioning?.supply?.excluded_price);
        const installRetail = Number(product.provisioning?.install?.retail_price);
        const installExcluded = Number(product.provisioning?.install?.excluded_price);
        const unitQty = Number(product.pivot?.quantity);

        const supplyPrice = product.pivot?.includeSupply
            ? (supplyRetail * unitQty || 0)
            : (supplyRetail - supplyExcluded || 0);
        const installPrice = product.pivot?.includeInstall
            ? (installRetail * unitQty || 0)
            : (installRetail - installExcluded || 0);

        return total + supplyPrice + installPrice;
    }, 0) * pkgQty;

    return perPackage;
}
