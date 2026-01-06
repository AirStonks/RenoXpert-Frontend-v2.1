import { useLocation, useNavigate, useParams } from "react-router-dom";
import useFetchInventory from "../../hook/useFetchInventory";
import useFetchInventoryVariants from "../../hook/useFetchInventoryVariants";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { removeInventory, removeInventoryVariant } from "../../services/api";
import DeleteModal from "../../components/Modals/DeleteModal";
import { InventoryVariant } from "../../types";
import CreateVariantModal from "./components/CreateVariantModal";
import EditVariantModal from "./components/EditVariantModal";
import UpdateStockModal from "./components/UpdateStockModal";
import { notify } from "../../utils/notifications";
import { handleApiError, logError } from "../../utils/errorHandling";
import { displayValue } from "../../utils/display";
import { 
    ArrowLeft, 
    Package, 
    MapPin, 
    Edit, 
    Trash2, 
    Plus,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Printer,
    Info
} from "lucide-react";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

function InventoryDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const inventoryId = id ? parseInt(id, 10) : null;
    const { inventory, loading, error, refetch } = useFetchInventory(inventoryId);
    const { variants, loading: variantsLoading, error: variantsError, refetch: refetchVariants } = useFetchInventoryVariants(inventoryId);

    const [isLoading, setIsLoading] = useState(false);
    const [selectedInventory, setSelectedInventory] = useState<{ id: number | string, name: string } | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<InventoryVariant | null>(null);
    const [selectedVariantForUpdateStock, setSelectedVariantForUpdateStock] = useState<InventoryVariant | null>(null);
    const [selectedVariantForDelete, setSelectedVariantForDelete] = useState<{ id: number | string, name: string } | null>(null);
    const [isCreateVariantModalOpen, setIsCreateVariantModalOpen] = useState(false);
    const [isEditVariantModalOpen, setIsEditVariantModalOpen] = useState(false);
    const [isUpdateStockModalOpen, setIsUpdateStockModalOpen] = useState(false);


    useEffect(() => {
        document.title = 'Inventory Detail | RenoXpert';
    }, []);

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate(LOCAL_PATH_PREFIX + 'inventory');
        }
    };

    const handleRemoveInventory = async (inventoryId: number) => {
        try {
            const response = await removeInventory(inventoryId);
            if (response?.success) {
                notify('success', 'Inventory item deleted successfully');
                navigate(LOCAL_PATH_PREFIX + 'inventory');
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            logError('removing inventory', error);
            notify('error', handleApiError(error, 'Inventory removal failed'));
            return { success: false, message: handleApiError(error, 'Inventory removal failed') };
        }
    };

    const handleRemoveVariant = async (variantId: number) => {
        try {
            const response = await removeInventoryVariant(variantId);
            if (response?.success) {
                notify('success', 'Variant deleted successfully');
                refetchVariants();
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            logError('removing variant', error);
            notify('error', handleApiError(error, 'Variant removal failed'));
            return { success: false, message: handleApiError(error, 'Variant removal failed') };
        }
    };

    const handleCreateVariantSuccess = () => {
        setIsCreateVariantModalOpen(false);
        refetchVariants();
        notify('success', 'Variant created successfully');
    };

    const handleEditVariantSuccess = () => {
        // Refetch variants to show updated data
        refetchVariants();
        // Close the modal
        setIsEditVariantModalOpen(false);
        // Clear selected variant after modal closes
        setTimeout(() => {
            setSelectedVariant(null);
        }, 300);
    };

    const handleUpdateStockSuccess = () => {
        setIsUpdateStockModalOpen(false);
        setSelectedVariantForUpdateStock(null);
        refetchVariants();
    };

    const handleEditVariant = (variant: InventoryVariant) => {
        setSelectedVariant(variant);
        setIsEditVariantModalOpen(true);
    };


    const getFirstVariantLocation = () => {
        if (variants && variants.length > 0) {
            const firstVariant = variants[0];
            return {
                rack: firstVariant.rack_no || '—',
                shelf: firstVariant.shelf_level || '—'
            };
        }
        return { rack: '—', shelf: '—' };
    };

    type StockHealthStatus = 'critical' | 'low_stock' | 'healthy';
    
    const getVariantStockHealth = (
        totalBalance: number | null | undefined, 
        alertLevel: number | null | undefined
    ): StockHealthStatus => {
        if (!alertLevel || alertLevel === 0) return 'healthy';
        
        const balance = totalBalance ?? 0;
        
        if (balance < alertLevel) return 'critical';
        if (balance === alertLevel) return 'low_stock';
        return 'healthy';
    };

    // Returns true if stock is critical or low
    const isVariantCritical = (totalBalance: number | null | undefined, alertLevel: number | null | undefined): boolean => {
        const health = getVariantStockHealth(totalBalance, alertLevel);
        return health === 'critical' || health === 'low_stock';
    };
    const getInventoryItemStockHealth = (variants: InventoryVariant[]): 'critical' | 'low_stock' | 'healthy' => {
        if (!variants || variants.length === 0) return 'healthy';
        
        const hasCriticalVariant = variants.some(variant => {
            const health = getVariantStockHealth(variant.total_balance, variant.alert_level);
            return health === 'critical';
        });
        if (hasCriticalVariant) return 'critical';
        
        const hasLowStockVariant = variants.some(variant => {
            const health = getVariantStockHealth(variant.total_balance, variant.alert_level);
            return health === 'low_stock';
        });
        if (hasLowStockVariant) return 'low_stock';
        
        return 'healthy';
    };

    const stockHealth = useMemo(() => {
        const stockHealthStatus = getInventoryItemStockHealth(variants || []);
        
        if (stockHealthStatus === 'critical') {
            return { status: 'Critical', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertCircle };
        } else if (stockHealthStatus === 'low_stock') {
            return { status: 'Low Stock', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: TrendingDown };
        } else {
            return { status: 'Healthy', color: 'text-green-600', bgColor: 'bg-green-50', icon: TrendingUp };
        }
    }, [variants]);

    if (!inventoryId) return null;

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    }

    if (!inventory) {
        return <div>Inventory item not found</div>;
    }

    const locationData = getFirstVariantLocation();

    return (
        <>
            {isLoading && <Loading />}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBackClick}
                                className="btn btn-sm btn-light hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold text-slate-900">{inventory.name || '—'}</h1>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                        inventory.status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {inventory.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-slate-500">#{inventory.id || '—'}</p>
                                    {inventory.sku && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <p className="text-sm text-slate-500">SKU: {inventory.sku}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                to={LOCAL_PATH_PREFIX + `inventory/edit/${inventoryId}`}
                                className="btn btn-sm btn-outline hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </Link>
                            <button
                                className="btn btn-sm btn-danger hover:bg-red-600 transition-colors flex items-center gap-2"
                                onClick={() => setSelectedInventory({ 
                                    id: inventoryId, 
                                    name: inventory.name || 'Inventory Item' 
                                })}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    {/* Total Physical Stock Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Package className="w-5 h-5 text-indigo-600" />
                            </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Physical Stock</p>
                        <p className="text-2xl font-bold text-slate-900">{inventory.total_stock ?? inventory.total_balance ?? 0}</p>
                    </div>

                    {/* Stock Health Card */}
                    {(() => {
                        const isCritical = stockHealth.status === 'Critical';
                        const isLowStock = stockHealth.status === 'Low Stock';
                        const isHealthy = stockHealth.status === 'Healthy';
                        const criticalVariantsCount = variants?.filter(v =>
                            getVariantStockHealth(v.total_balance, v.alert_level) === 'critical'
                        ).length || 0;
                        const lowStockVariantsCount = variants?.filter(v =>
                            getVariantStockHealth(v.total_balance, v.alert_level) === 'low_stock'
                        ).length || 0;

                        const borderColor = isCritical ? 'border-red-400' : isLowStock ? 'border-orange-400' : 'border-green-400';
                        const bgColor = isCritical ? 'bg-red-50' : isLowStock ? 'bg-orange-50' : 'bg-green-50';
                        const iconBgColor = isCritical ? 'bg-red-100' : isLowStock ? 'bg-orange-100' : 'bg-green-100';
                        const iconColor = isCritical ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600';
                        const badgeBgColor = isCritical ? 'bg-red-100' : isLowStock ? 'bg-orange-100' : 'bg-green-100';
                        const badgeTextColor = isCritical ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600';
                        const badgeDotColor = isCritical ? 'bg-red-500' : isLowStock ? 'bg-orange-500' : 'bg-green-500';

                        return (
                            <div className={`rounded-xl border-2 shadow-sm p-5 transition-all ${borderColor} ${bgColor}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-lg ${iconBgColor} flex items-center justify-center`}>
                                        <stockHealth.icon className={`w-5 h-5 ${iconColor}`} />
                                    </div>
                                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeBgColor} ${badgeTextColor}`}>
                                        <span className={`w-2 h-2 rounded-full ${badgeDotColor}`}></span>
                                        {stockHealth.status}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Overall Stock Health</p>
                                <p className={`text-2xl font-bold ${stockHealth.color}`}>{stockHealth.status}</p>
                                {isCritical && variants && variants.length > 0 && (
                                    <p className="text-red-600 text-sm mt-2">
                                        {criticalVariantsCount} of {variants.length} variant{variants.length !== 1 ? 's' : ''} have critical stock
                                    </p>
                                )}
                                {isLowStock && variants && variants.length > 0 && (
                                    <p className="text-orange-600 text-sm mt-2">
                                        {lowStockVariantsCount} of {variants.length} variant{variants.length !== 1 ? 's' : ''} have low stock
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                    {/* Primary Zone Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Primary Zone</p>
                        <p className="text-2xl font-bold text-slate-900">{displayValue(inventory.zone)}</p>
                    </div>

                    {/* Rack/Shelf Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Rack / Shelf</p>
                        <p className="text-lg font-bold text-slate-900">
                            R:{locationData.rack} S:{locationData.shelf}
                        </p>
                    </div>
                </div>

                {/* Item Properties Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Item Properties</h2>
                    <div className="space-y-6">
                        {/* Category & Description */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</p>
                                <p className="text-sm font-medium text-slate-900">
                                    {inventory.type ? inventory.type.split('/').map((part: string) => part.trim()).join(' / ') : '—'}
                                </p>
                            </div>
                            <div className="md:col-span-3">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                                <p className="text-sm font-medium text-slate-900">
                                    {displayValue(inventory.description) || 'No description provided.'}
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100" />

                        {/* Stock Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">In Stock</p>
                                <p className="text-2xl font-bold text-slate-900">{inventory.current_stock ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Projected Stock</p>
                                <p className="text-2xl font-bold text-slate-900">{inventory.projected_stock ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Utilised</p>
                                <p className="text-2xl font-bold text-slate-900">{inventory.utilised_stock ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Incoming Stock</p>
                                <p className="text-2xl font-bold text-slate-900">{inventory.incoming_stock ?? 0}</p>
                            </div>
                        </div>

                        {/* Total Balance Highlight */}
                        <div className="pt-2">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 md:px-5 md:py-4">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    Total Balance
                                    <span className="relative group inline-flex items-center">
                                        <Info className="w-3 h-3 text-slate-400 cursor-help" />
                                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1.5 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 whitespace-nowrap shadow-lg">
                                            Calculated as In Stock + Projected Stock
                                            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></span>
                                        </span>
                                    </span>
                                </p>
                                <p className="text-2xl font-extrabold text-indigo-600">{inventory.total_balance ?? 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variants Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Variants</h2>
                        <button
                            className="btn btn-sm btn-primary flex items-center gap-2"
                            onClick={() => setIsCreateVariantModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Add Variant
                        </button>
                    </div>
                    {variantsLoading ? (
                        <div className="text-center py-8">
                            <Loading />
                        </div>
                    ) : variantsError ? (
                        <div className="text-red-600 text-center py-8">Error loading variants: {variantsError}</div>
                    ) : variants.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs font-semibold text-slate-400 border-b border-slate-100 bg-gray-50/50">
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Variant Name</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Zone</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Shelf Level</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider">Rack No</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Current Stock</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Projected Stock</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Status</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Stock Health</th>
                                        <th className="px-6 py-3 font-medium uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-gray-50">
                                    {variants.map((variant, index) => {
                                        const variantStockHealth = getVariantStockHealth(variant.total_balance, variant.alert_level);
                                        const isCritical = variantStockHealth === 'critical';
                                        
                                        return (
                                        <tr 
                                            key={variant.id || index} 
                                            className={`group transition-colors ${
                                                isCritical 
                                                    ? 'bg-red-100 border-l-4 border-red-500 hover:bg-red-200' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner ${
                                                        isCritical ? 'bg-red-200' : 'bg-gray-100'
                                                    }`}>
                                                        📦
                                                    </div>
                                                    <div>
                                                        <Link
                                                            to={LOCAL_PATH_PREFIX + `inventory/${inventoryId}/variant/${variant.id}`}
                                                            state={{ fromUrl: window.location.pathname }}
                                                            className={`font-bold hover:text-indigo-600 transition-colors ${
                                                                isCritical ? 'text-slate-900' : 'text-slate-800'
                                                            }`}
                                                        >
                                                            {variant.variant_name || '—'}
                                                        </Link>
                                                        <p className={`text-xs font-mono ${
                                                            isCritical ? 'text-slate-600' : 'text-slate-400'
                                                        }`}>
                                                            {variant.sku || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-600 shadow-sm">
                                                    {displayValue(variant.zone || inventory.zone)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-500">
                                                    {displayValue(variant.shelf_level)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-500">
                                                    {displayValue(variant.rack_no)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-medium ${
                                                    isCritical ? 'text-slate-900' : 'text-slate-700'
                                                }`}>
                                                    {variant.in_stock ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-medium ${
                                                    isCritical ? 'text-slate-900' : 'text-slate-700'
                                                }`}>
                                                    {variant.projected_stock ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    variant.status === 'active' || variant.alert_status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {(variant.status || variant.alert_status) === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    variantStockHealth === 'critical'
                                                        ? 'bg-red-100 text-red-700 border border-red-200'
                                                        : variantStockHealth === 'low_stock'
                                                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                                            : 'bg-green-100 text-green-700 border border-green-200'
                                                }`}>
                                                    {variantStockHealth === 'critical' 
                                                        ? 'Critical' 
                                                        : variantStockHealth === 'low_stock' 
                                                            ? 'Low Stock' 
                                                            : 'Healthy'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedVariantForUpdateStock(variant);
                                                            setIsUpdateStockModalOpen(true);
                                                        }}
                                                        className="text-slate-500 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded"
                                                        title="Update Stock"
                                                    >
                                                        <Package className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditVariant(variant)}
                                                        className="text-slate-500 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded"
                                                        title="Edit Variant"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedVariantForDelete({ 
                                                            id: variant.id || 0, 
                                                            name: variant.variant_name || 'Variant' 
                                                        })}
                                                        className="text-slate-500 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded"
                                                        title="Delete Variant"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">No variants available</div>
                    )}
                </div>
            </div>

            {/* Delete Inventory Modal */}
            {selectedInventory && (
                <DeleteModal
                    item={selectedInventory}
                    modalTitle='Remove Inventory Item'
                    modalPrompt='Are you sure to permanently remove this inventory item:'
                    notifySuccess='Inventory Item Removed Successfully!'
                    notifyError='Inventory Item removal failed'
                    navigateUrl={LOCAL_PATH_PREFIX + 'inventory'}
                    deleteFunction={handleRemoveInventory}
                    onClose={() => setSelectedInventory(null)}
                />
            )}

            {/* Delete Variant Modal */}
            {selectedVariantForDelete && (
                <DeleteModal
                    item={selectedVariantForDelete}
                    modalTitle='Remove Variant'
                    modalPrompt='Are you sure to permanently remove this variant:'
                    notifySuccess='Variant Removed Successfully!'
                    notifyError='Variant removal failed'
                    deleteFunction={handleRemoveVariant}
                    onClose={() => setSelectedVariantForDelete(null)}
                />
            )}

            {/* Create Variant Modal */}
            {inventoryId && (
                <CreateVariantModal
                    isOpen={isCreateVariantModalOpen}
                    onClose={() => setIsCreateVariantModalOpen(false)}
                    inventoryItemId={inventoryId}
                    inventoryItem={inventory}
                    onSuccess={handleCreateVariantSuccess}
                />
            )}

            {/* Edit Variant Modal */}
            {selectedVariant && (
                <EditVariantModal
                    isOpen={isEditVariantModalOpen}
                    onClose={() => {
                        setIsEditVariantModalOpen(false);
                        setTimeout(() => {
                            setSelectedVariant(null);
                        }, 200);
                    }}
                    variant={selectedVariant}
                    inventoryItem={inventory}
                    onSuccess={handleEditVariantSuccess}
                />
            )}

            {/* Update Stock Modal */}
            {selectedVariantForUpdateStock && (
                <UpdateStockModal
                    isOpen={isUpdateStockModalOpen}
                    onClose={() => {
                        setIsUpdateStockModalOpen(false);
                        setTimeout(() => {
                            setSelectedVariantForUpdateStock(null);
                        }, 200);
                    }}
                    variant={selectedVariantForUpdateStock}
                    onSuccess={handleUpdateStockSuccess}
                />
            )}
        </>
    );
}

export default InventoryDetail;
