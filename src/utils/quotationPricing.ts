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

type OrderWithQuotation = Order & {
    latest_quotation?: { packages?: Package[]; bonus?: unknown } | null;
};

function parseBonusValue(bonus: unknown): number {
    if (!bonus) return 0;
    try {
        const obj = typeof bonus === 'string' ? JSON.parse(bonus) : bonus;
        return Number((obj as { value?: unknown })?.value) || 0;
    } catch {
        return 0;
    }
}

/**
 * Per-program "Initial Down Payment" (the "Start from RMxxx" figure), computed
 * from a template order at DEFAULT add-on inclusion. Mirrors CampaignPackageDetailPage's
 * originalInitialDownPayment so the landing/layout "Start from" matches the
 * Quotation Detail page's Original Initial Down Payment.
 */
export function getInitialDownPayment(order?: OrderWithQuotation | null): number {
    if (!order) return 0;
    const packages: Package[] = order.latest_quotation?.packages ?? [];
    const bonusValue = parseBonusValue(order.latest_quotation?.bonus ?? (order as { bonus?: unknown }).bonus);

    // Reno Subscription (bePowered): upfront (be_powered_base_price + one-off packages) − bonus.
    if (order.is_be_powered) {
        const upfront = packages.reduce((acc, pkg) => {
            const counts = pkg.payment_method === 'one-off' && (pkg.is_addon ? pkg.is_addon_included === true : true);
            const unit = Number(pkg.markup_amount) || Number(pkg.total_price) || 0;
            return acc + (counts ? unit * (pkg.quantity || 1) : 0);
        }, Number(order.be_powered_base_price) || 0);
        return upfront - bonusValue;
    }

    // RenoNow PayLater (rnpl): the RenoNow base price.
    if (order.is_rnpl) {
        return Number(order.rnpl_base_price) || 0;
    }

    // Full Payment / progressive: half of the total (recomputed from products, matching owner).
    if (order.f_1 && order.total_amount != null) {
        return Number(order.total_amount) / 2;
    }
    const total = packages.reduce((sum, pkg) => {
        if (pkg.is_addon === true && pkg.is_addon_included === false) return sum;
        return sum + getQuotationPackagePrice(pkg, order);
    }, 0);
    return total / 2;
}
