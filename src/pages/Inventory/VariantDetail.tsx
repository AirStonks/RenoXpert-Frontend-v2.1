import { useLocation, useNavigate, useParams } from "react-router-dom";
import useFetchInventoryVariant from "../../hook/useFetchInventoryVariant";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { removeInventoryVariant } from "../../services/api";
import DeleteModal from "../../components/Modals/DeleteModal";
import EditVariantModal from "./components/EditVariantModal";
import useFetchInventory from "../../hook/useFetchInventory";
import { InventoryVariant } from "../../types";
import { ArrowLeft, Info, Package, MapPin, Ruler, DollarSign, FileText, AlertCircle, Edit, Trash2, AlertTriangle } from "lucide-react";
import { notify } from "../../utils/notifications";
import { handleApiError, logError } from "../../utils/errorHandling";
import { displayValue, formatPrice } from "../../utils/display";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

function VariantDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { variantId, inventoryId } = useParams<{ variantId: string; inventoryId: string }>();
    const parsedVariantId = variantId ? parseInt(variantId, 10) : null;
    const parsedInventoryId = inventoryId ? parseInt(inventoryId, 10) : null;
    
    const { variant, loading, error, refetch } = useFetchInventoryVariant(parsedVariantId);
    const { inventory } = useFetchInventory(parsedInventoryId);

    const [isLoading, setIsLoading] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<InventoryVariant | null>(null);
    const [selectedVariantForDelete, setSelectedVariantForDelete] = useState<{ id: number | string, name: string } | null>(null);
    const [isEditVariantModalOpen, setIsEditVariantModalOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);


    useEffect(() => {
        document.title = 'Variant Detail | RenoXpert';
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else if (parsedInventoryId) {
            navigate(LOCAL_PATH_PREFIX + `inventory/${parsedInventoryId}`);
        } else {
            navigate(LOCAL_PATH_PREFIX + 'inventory');
        }
    };

    const handleRemoveVariant = async (variantId: number) => {
        setIsLoading(true);
        try {
            const response = await removeInventoryVariant(variantId);
            if (response?.success) {
                notify('success', 'Variant deleted successfully');
                handleBackClick();
            } else {
                notify('error', response?.message || 'Failed to delete variant');
            }
        } catch (error: unknown) {
            logError('deleting variant', error);
            notify('error', handleApiError(error, 'Failed to delete variant'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditVariantSuccess = () => {
        // Refetch variant data to show updated values
        refetch();
        // Close the modal
        setIsEditVariantModalOpen(false);
        // Clear selected variant after modal closes
        setTimeout(() => {
            setSelectedVariant(null);
        }, 300);
    };

    const getPriceValue = (variant: InventoryVariant, fieldName: 'supply_price' | 'install_price'): number | undefined => {
        const snakeCaseValue = variant[fieldName];
        if (snakeCaseValue !== undefined && snakeCaseValue !== null) {
            const numValue = typeof snakeCaseValue === 'string' ? parseFloat(snakeCaseValue) : snakeCaseValue;
            if (!isNaN(numValue) && typeof numValue === 'number') {
                return numValue;
            }
        }
        return undefined;
    };


    if (!parsedVariantId) return null;

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
                    <div className="text-red-600 text-lg font-medium mb-2">
                        {error}
                    </div>
                    <p className="text-gray-500 text-sm mb-6">
                        The item you're looking for may have been deleted or doesn't exist.
                    </p>
                    <button
                        onClick={handleBackClick}
                        className="btn btn-primary"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!variant) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
                    <div className="text-red-600 text-lg font-medium mb-2">
                        Item is not found
                    </div>
                    <p className="text-gray-500 text-sm mb-6">
                        The item you're looking for may have been deleted or doesn't exist.
                    </p>
                    <button
                        onClick={handleBackClick}
                        className="btn btn-primary"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const getZoneValue = (): string => {
        if (variant.zone) {
            return variant.zone;
        }
        if (inventory?.zone) {
            return inventory.zone;
        }
        return '—';
    };

    const getStatusDisplay = () => {
        const statusValue = variant.status || variant.alert_status;
        if (!statusValue) {
            return { text: '—', className: 'badge-secondary' };
        }
        const displayStatus = statusValue.charAt(0).toUpperCase() + statusValue.slice(1).toLowerCase();
        return {
            text: displayStatus,
            className: statusValue === 'active' ? 'badge-success' : 'badge-secondary'
        };
    };

    const getStockHealthStatus = (totalBalance: number | null | undefined, alertLevel: number | null | undefined): 'critical' | 'low_stock' | 'healthy' => {
        if (!alertLevel || alertLevel === 0) return 'healthy';
        
        const balance = totalBalance ?? 0;
        
        if (balance < alertLevel) return 'critical';
        if (balance === alertLevel) return 'low_stock';
        return 'healthy';
    };

    const statusDisplay = getStatusDisplay();

    return (
        <>
            {isLoading && <Loading />}

            <div className="max-w-5xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Sticky Header */}
                <div className={`sticky top-0 z-50 transition-all duration-200 ${
                    isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-white'
                } border-b border-gray-200 mb-6`}>
                    <div className="flex justify-between items-start py-4 px-6 gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <button
                                onClick={handleBackClick}
                                className="btn btn-sm btn-light hover:bg-gray-100 transition-colors shrink-0"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold text-gray-900">Variant Detail</h1>
                                {variant.sku && (
                                    <p className="text-sm text-gray-500 mt-1 break-all font-mono">{variant.sku}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                className="btn btn-sm btn-outline hover:bg-gray-50 transition-colors flex items-center gap-2"
                                onClick={() => {
                                    setSelectedVariant(variant);
                                    setIsEditVariantModalOpen(true);
                                }}
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                className="btn btn-sm btn-danger hover:bg-red-600 transition-colors flex items-center gap-2"
                                onClick={() => setSelectedVariantForDelete({ 
                                    id: variant.id || 0, 
                                    name: variant.variant_name || 'Variant' 
                                })}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-6 px-6 pb-6">
                    {/* Basic Information Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Info className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="md:col-span-2 lg:col-span-1">
                                <label className="text-sm font-medium text-gray-500 mb-1 block">Variant Name</label>
                                <div className="text-base font-medium text-gray-900 break-words">
                                    {(() => {
                                        const parentName = variant?.inventory_item?.name || inventory?.name;
                                        const variantName = variant.variant_name;
                                        if (parentName && variantName) {
                                            return `${parentName}-${variantName}`;
                                        }
                                        return displayValue(variantName);
                                    })()}
                                </div>
                            </div>
                            <div className="md:col-span-2 lg:col-span-1">
                                <label className="text-sm font-medium text-gray-500 mb-1 block">SKU</label>
                                <div className="text-base font-medium text-gray-900 break-all font-mono">
                                    {displayValue(variant.sku)}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 mb-1 block">Type</label>
                                <div className="text-base font-medium text-gray-900 capitalize">{displayValue(variant.type || inventory?.type)}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 mb-1 block">Product ID</label>
                                <div className="text-base font-medium text-gray-900">{displayValue(variant.product_id)}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 mb-1 block">Status</label>
                                <div>
                                    <span className={`badge badge-sm ${statusDisplay.className}`}>
                                        {statusDisplay.text}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock & Location Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Stock Information Card */}
                        {(() => {
                            const stockHealth = getStockHealthStatus(variant.total_balance, variant.alert_level);
                            const isCritical = stockHealth === 'critical';
                            const isLowStock = stockHealth === 'low_stock';
                            const isHealthy = stockHealth === 'healthy';
                            
                            // Determine colors based on status
                            const borderColor = isCritical ? 'border-red-400' : isLowStock ? 'border-orange-400' : 'border-green-400';
                            const bgColor = isCritical ? 'bg-red-50' : isLowStock ? 'bg-orange-50' : 'bg-green-50';
                            const iconBgColor = isCritical ? 'bg-red-100' : isLowStock ? 'bg-orange-100' : 'bg-green-100';
                            const iconColor = isCritical ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600';
                            const textColor = isCritical ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600';
                            const badgeBgColor = isCritical ? 'bg-red-100' : isLowStock ? 'bg-orange-100' : 'bg-green-100';
                            const badgeTextColor = isCritical ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600';
                            const badgeDotColor = isCritical ? 'bg-red-500' : isLowStock ? 'bg-orange-500' : 'bg-green-500';
                            const statusText = isCritical ? 'Critical' : isLowStock ? 'Low Stock' : 'Healthy';
                            
                            return (
                                <div className={`rounded-xl border-2 shadow-sm p-5 transition-all ${borderColor} ${bgColor}`}>
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgColor}`}>
                                                <Package className={`w-5 h-5 ${iconColor}`} />
                                            </div>
                                            <h2 className="text-lg font-semibold text-gray-900">Stock Information</h2>
                                        </div>
                                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badgeBgColor} ${badgeTextColor}`}>
                                            <span className={`w-2 h-2 rounded-full ${badgeDotColor}`}></span>
                                            {statusText}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">In Stock</label>
                                            <div className="text-base font-medium text-gray-900">{variant.in_stock ?? 0}</div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">Projected Stock</label>
                                            <div className="text-base font-medium text-gray-900">{variant.projected_stock ?? 0}</div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">Utilised Stock</label>
                                            <div className="text-base font-medium text-gray-900">{variant.utilised_stock ?? 0}</div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">Incoming Stock</label>
                                            <div className="text-base font-medium text-gray-900">{variant.incoming_stock ?? 0}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">Total Balance</label>
                                            <div className={`text-base font-semibold ${textColor}`}>
                                                {variant.total_balance ?? 0}
                                            </div>
                                            {(isCritical || isLowStock) && variant.alert_level && (
                                                <div className={`flex items-center gap-2 text-sm mt-2 ${textColor}`}>
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span>Stock is {isCritical ? 'below' : 'at'} alert level ({variant.alert_level})</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Location Card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Location</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                                        Zone
                                        <div className="relative group">
                                            <Info className="w-3 h-3 text-gray-400 cursor-help" />
                                            <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1.5 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 whitespace-nowrap shadow-lg">
                                                Zone is inherited from the parent inventory item
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                            </div>
                                        </div>
                                    </label>
                                    <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                                        {getZoneValue()}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-1 block">Shelf Level</label>
                                    <div className="text-base font-medium text-gray-900">{displayValue(variant.shelf_level)}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-1 block">Rack No</label>
                                    <div className="text-base font-medium text-gray-900">{displayValue(variant.rack_no)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dimensions & Material Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Ruler className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Dimensions & Material</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500 mb-1 block">Width</label>
                                <div className="text-base font-medium text-gray-900">{variant.width !== undefined ? `${variant.width}` : '—'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 mb-1 block">Height</label>
                                <div className="text-base font-medium text-gray-900">{variant.height !== undefined ? `${variant.height}` : '—'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 mb-1 block">Depth</label>
                                <div className="text-base font-medium text-gray-900">{variant.depth !== undefined ? `${variant.depth}` : '—'}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 mb-1 block">Color</label>
                                <div className="text-base font-medium text-gray-900">{displayValue(variant.color)}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 mb-1 block">Material</label>
                                <div className="text-base font-medium text-gray-900">{displayValue(variant.material)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Pricing</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <label className="text-sm font-medium text-gray-500 mb-2 block">Supply Price</label>
                                <div className="text-2xl font-semibold text-gray-900">
                                    {formatPrice(getPriceValue(variant, 'supply_price'))}
                                </div>
                            </div>
                            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                                <label className="text-sm font-medium text-gray-500 mb-2 block">Install Price</label>
                                <div className="text-2xl font-semibold text-primary">
                                    {formatPrice(getPriceValue(variant, 'install_price'))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                        </div>
                        <div className="text-base text-gray-900 whitespace-pre-wrap">
                            {variant.description ? variant.description : '—'}
                        </div>
                    </div>

                    {/* Alert Level Card (Optional) */}
                    {variant.alert_level !== undefined && variant.alert_level !== null && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Alert Level</h2>
                            </div>
                            <div className="text-base font-medium text-gray-900">
                                {variant.alert_level}
                            </div>
                        </div>
                    )}

                    {/* Parent Inventory Item Link */}
                    {inventory && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-1 block">Parent Inventory Item</label>
                                    <Link
                                        to={LOCAL_PATH_PREFIX + `inventory/${parsedInventoryId}`}
                                        className="text-base font-medium text-primary hover:underline"
                                    >
                                        {inventory.name || 'View Parent Item'}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {selectedVariantForDelete && (
                <DeleteModal
                    item={selectedVariantForDelete}
                    modalTitle="Delete Variant"
                    modalPrompt={`Are you sure you want to delete "${selectedVariantForDelete.name}"? This action cannot be undone.`}
                    notifySuccess="Variant deleted successfully."
                    notifyError="Failed to delete variant."
                    deleteFunction={removeInventoryVariant}
                    onClose={() => setSelectedVariantForDelete(null)}
                    buttonText="Delete"
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
                    inventoryItem={inventory || undefined}
                    onSuccess={handleEditVariantSuccess}
                />
            )}
        </>
    );
}

export default VariantDetail;
