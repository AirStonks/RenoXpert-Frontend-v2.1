import { useEffect, useRef, useState } from "react";
import useFetchPackage from "../../hook/useFetchPackage";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";
import { archivePackage, removePackage, restorePackage } from "../../services/api";
import { Slide, toast } from "react-toastify";
import DeleteModal from "../../components/Modals/DeleteModal";
import { ArrowLeft, Edit, Archive, MoreVertical, Copy, Trash2, RotateCcw, DollarSign, Calculator, Calendar, TrendingUp, PackageIcon, Clock } from 'lucide-react';
import { useUser } from "../../context/UserContext";
import { canSeeDetailedPricing } from "../../utils/userPermissions";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const categoryOptions = [
    { value: "renovation", label: "Renovation" },
    { value: "partition", label: "Partition" },
    { value: "carpentry", label: "Carpentry" },
    { value: "furniture", label: "Furniture" },
    { value: "electrical_appliances", label: "Electrical Appliances" },
    { value: "air_conditioning", label: "Air Conditioning" },
    { value: "smart_iot", label: "Smart IoT" },
    { value: "project_management", label: "Project Management" },
    { value: "loose_items", label: "Loose Items" },
    { value: "others", label: "Others" },
];

function PackageDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const packageId = id ? parseInt(id, 10) : null;
    const { currentUser } = useUser();
    const { packageDetail, loading, error, refetch } = useFetchPackage(packageId);

    const [selectedPackage, setSelectedPackage] = useState<{ id: number | string, name: string } | null>(null);
    const [selectedArchivePackage, setSelectedArchivePackage] = useState<{ id: number | string, name: string } | null>(null);
    const [selectedRestorePackage, setSelectedRestorePackage] = useState<{ id: number | string, name: string } | null>(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    useEffect(() => {
        document.title = "Package Detail | RenoXpert";
    }, [packageId, packageDetail?.name]);

    // Toggle dropdown visibility
    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate(LOCAL_PATH_PREFIX + 'packages');
        }
    };

    const handleArchiveItem = async (pkgId: number) => {
        try {
            const response = await archivePackage(pkgId);

            if (response?.success) {
                notify('success', 'Package archived successfully.');
                setSelectedArchivePackage(null);
                refetch();

                navigate(LOCAL_PATH_PREFIX + 'packages/' + pkgId);
            }
            return { success: true };
        } catch (error) {
            console.log(error);
            return { success: false, message: 'Package archiving failed' };
        }
    };

    const handleRestoreItem = async (pkgId: number) => {
        try {
            const response = await restorePackage(pkgId);

            if (response?.success) {
                notify('success', 'Package restored successfully.');
                setSelectedRestorePackage(null);
                refetch();

                navigate(LOCAL_PATH_PREFIX + 'packages/' + pkgId);
            }
            return { success: true };
        } catch (error) {
            console.log(error);
            return { success: false, message: 'Package restore failed' };
        }
    }

    const handleRemovePackage = async (pkgId: number) => {
        try {
            const response = await removePackage(pkgId);

            if (response?.success) {
                return { success: true };
            }
            return { success: false };

        } catch (error) {
            return { success: false, message: 'Package removal failed' };
        }
    }

    if (!packageId) return null;

    if (loading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!packageDetail) {
        return <div>Package not found</div>;
    }

    // Calculate package retail price (sum of all items supply and install retail price)
    const packageRetailPrice = packageDetail.products.reduce((total, item) => total + ((item.provisioning.supply.retail_price + item.provisioning.install.retail_price) * item.pivot.quantity), 0);

    const packageCogs = packageDetail.products.reduce((total, item) => total + ((item.provisioning.supply.cogs + item.provisioning.install.cogs) * item.pivot.quantity), 0);

    // Calculate package margin in amount
    const packageMarginInAmount = packageRetailPrice - packageCogs;

    // Calculate package margin in percentage (handle division by zero)
    const packageMarginInPercentage = packageRetailPrice > 0 ? (packageMarginInAmount / packageRetailPrice) * 100 : 0;

    // Calculate financial fields (using package data if available, otherwise calculated values)
    const originalAmount = packageDetail.total_price || packageRetailPrice;
    const markupAmount = packageDetail.markup_amount;
    const markupPercentage = packageDetail.markup_percentage ? (packageDetail.markup_percentage * 100) : 0;
    const tenure = packageDetail.tenure;
    const monthlyAmount = packageDetail.monthly_amount;
    // const totalPackageAmount = originalAmount + markupAmount;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
                <div className="px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                            onClick={handleBackClick}
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Package Detail</h1>
                            <p className="text-sm text-gray-600">{packageDetail.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {canSeeDetailedPricing(currentUser) && (
                            <Link
                                to={LOCAL_PATH_PREFIX + 'packages/edit/' + packageId}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </Link>
                        )}
                        {packageDetail.status === 'archived' && (
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                                onClick={() => setSelectedRestorePackage({ id: packageId, name: packageDetail?.name || '' })}
                            >
                                <RotateCcw className="w-4 h-4" />
                                Restore
                            </button>
                        )}
                        <div className="relative">
                            <button
                                ref={buttonRef}
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                                onClick={toggleDropdown}
                            >
                                <MoreVertical className="w-5 h-5 text-gray-700" />
                            </button>
                            {isDropdownOpen && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute right-0 top-12 bg-white/90 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-xl py-2 min-w-[200px] transition-all duration-200"
                                >
                                    {canSeeDetailedPricing(currentUser) && (
                                        <>
                                            <Link
                                                to={LOCAL_PATH_PREFIX + `packages/create`}
                                                state={{ dupPackId: packageId, fromUrl: LOCAL_PATH_PREFIX + `packages/${packageId}` }}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50/80 transition-colors duration-200"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <Copy className="w-4 h-4 text-gray-600" />
                                                <span className="text-gray-700">Duplicate Package</span>
                                            </Link>
                                            {packageDetail.status !== 'archived' && (
                                                <button
                                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50/80 transition-colors duration-200 w-full text-left"
                                                    onClick={() => {
                                                        setIsDropdownOpen(false);
                                                        setSelectedArchivePackage({ id: packageId, name: packageDetail?.name || '' });
                                                    }}
                                                >
                                                    <Archive className="w-4 h-4 text-red-500" />
                                                    <span className="text-red-500">Archive Package</span>
                                                </button>
                                            )}
                                            {packageDetail.status === 'archived' && (
                                                <button
                                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50/80 transition-colors duration-200 w-full text-left"
                                                    onClick={() => {
                                                        setIsDropdownOpen(false);
                                                        setSelectedPackage({ id: packageId, name: packageDetail?.name || '' });
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                    <span className="text-red-500">Remove Package</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-9 gap-8 mb-8 py-6">
                {/* Left Column - Package Details */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Financial Overview */}
                    <div className="bg-white/90 backdrop-blur-lg border border-gray-100 rounded-2xl shadow-lg p-6 max-w-2xl mx-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                <Calculator className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Financial Summary</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50/80 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Original Amount</span>
                                </div>
                                <span className="text-lg font-bold text-blue-700">
                                    RM {originalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            {markupAmount > 0 && (
                                <div className="bg-gray-50/80 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="w-5 h-5 text-orange-500" />
                                        <span className="text-sm font-semibold text-gray-700">Markup Amount</span>
                                    </div>
                                    <span className="text-lg font-bold text-orange-700">
                                        RM {markupAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}

                            {markupPercentage > 0 && (
                                <div className="bg-gray-50/80 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="w-5 h-5 text-purple-500" />
                                        <span className="text-sm font-semibold text-gray-700">Markup %</span>
                                    </div>
                                    <span className="text-lg font-bold text-purple-700">
                                        {markupPercentage.toFixed(2)}%
                                    </span>
                                </div>
                            )}

                            {tenure > 0 && (
                                <div className="bg-gray-50/80 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="w-5 h-5 text-indigo-500" />
                                        <span className="text-sm font-semibold text-gray-700">Tenure</span>
                                    </div>
                                    <span className="text-lg font-bold text-indigo-700">
                                        {tenure} months
                                    </span>
                                </div>
                            )}

                            {monthlyAmount > 0 && (
                                <div className="bg-gray-50/80 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-5 h-5 text-teal-500" />
                                        <span className="text-sm font-semibold text-gray-700">Monthly Amount</span>
                                    </div>
                                    <span className="text-lg font-bold text-teal-700">
                                        RM {monthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Package Information */}
                    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                                <PackageIcon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Package Information</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                                <span className="text-sm font-medium text-gray-600">Package Name</span>
                                <span className="text-sm font-semibold text-gray-900">{packageDetail.name}</span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                                <span className="text-sm font-medium text-gray-600">Status</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${packageDetail.status === 'available'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {packageDetail.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                                <span className="text-sm font-medium text-gray-600">Category</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {packageDetail.category
                                        ? categoryOptions.find(option => option.value === packageDetail.category)?.label
                                        : '-'
                                    }
                                </span>
                            </div>

                            <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                                <span className="text-sm font-medium text-gray-600">Add-on Package</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {packageDetail.is_addon ? 'Yes' : 'No'}
                                </span>
                            </div>

                            <div className="flex justify-between items-start py-3">
                                <span className="text-sm font-medium text-gray-600">Internal Description</span>
                                <span className="text-sm text-gray-900 text-right max-w-[200px]">
                                    {packageDetail.description_internal || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Package Description</h2>
                        <ul className="text-sm text-gray-900">
                            {packageDetail?.description
                                ? packageDetail.description.split("\n").map((item, index) => (
                                    <li key={index} className="flex items-start">
                                        {item}
                                    </li>
                                ))
                                : <li className="flex items-start">-</li>}
                        </ul>
                    </div>


                    {/* Cost Analysis */}
                    {canSeeDetailedPricing(currentUser) && (
                        <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Cost Analysis</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                                    <span className="text-sm font-medium text-gray-600">Total Retail Price</span>
                                    <span className="text-sm font-bold text-green-600">
                                        RM {packageRetailPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                                    <span className="text-sm font-medium text-gray-600">Total COGS</span>
                                    <span className="text-sm font-bold text-red-600">
                                        RM {packageCogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                                    <span className="text-sm font-medium text-gray-600">Margin Amount</span>
                                    <span className="text-sm font-bold text-blue-600">
                                        RM {packageMarginInAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-3">
                                    <span className="text-sm font-medium text-gray-600">Margin Percentage</span>
                                    <span className="text-sm font-bold text-purple-600">
                                        {packageMarginInPercentage.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Products */}
                <div className="xl:col-span-7">
                    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Products</h2>

                        <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="table w-full text-sm">
                                    <thead className="bg-gray-50/80 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">#</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">Product</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">Supplier</th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-700 whitespace-nowrap">Quantity</th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-700 whitespace-nowrap">Visibility</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">Total RRP</th>
                                            {canSeeDetailedPricing(currentUser) && (
                                                <>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">Supply RRP</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">Install RRP</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">Supply COGS</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">Install COGS</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">Total COGS</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">Margin %</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-700 whitespace-nowrap">Margin Amount</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packageDetail.products.map((product, index) => (
                                            <tr key={index} className="hover:bg-gray-50/50 transition-colors duration-200">
                                                <td className="px-4 py-3 text-center font-medium">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900">{product.name}</span>
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block w-fit mt-1">
                                                            SKU: {product.SKU || '-'}
                                                        </span>
                                                        <span className="text-xs text-gray-600 mt-1">{product.description}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {product.supplier_name || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="px-3 py-1 rounded-full text-sm font-medium">
                                                        {product.pivot.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <label className="switch flex justify-center">
                                                        <input name="visibility"
                                                            type="checkbox"
                                                            checked={product.pivot.visibility}
                                                            readOnly
                                                        />
                                                    </label>
                                                </td>
                                                <td className="px-4 py-3 text-green-600 font-bold whitespace-nowrap">
                                                    RM {(
                                                        (product.provisioning.supply.retail_price + product.provisioning.install.retail_price) *
                                                        product.pivot.quantity
                                                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                {canSeeDetailedPricing(currentUser) && (
                                                    <>
                                                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                            RM {product.provisioning.supply.retail_price.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                            RM {product.provisioning.install.retail_price.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                            RM {product.provisioning.supply.cogs.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                            RM {product.provisioning.install.cogs.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </td>
                                                        <td className="px-4 py-3 text-red-600 font-bold whitespace-nowrap">
                                                            RM {(
                                                                (product.provisioning.supply.cogs + product.provisioning.install.cogs) *
                                                                product.pivot.quantity
                                                            ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-3 font-bold whitespace-nowrap">
                                                            {(() => {
                                                                const totalRRP =
                                                                    (product.pivot.includeSupply
                                                                        ? product.provisioning.supply.retail_price * product.pivot.quantity
                                                                        : 0) +
                                                                    (product.pivot.includeInstall
                                                                        ? product.provisioning.install.retail_price * product.pivot.quantity
                                                                        : 0);
                                                                const totalCOGS =
                                                                    (product.pivot.includeSupply
                                                                        ? product.provisioning.supply.cogs * product.pivot.quantity
                                                                        : 0) +
                                                                    (product.pivot.includeInstall
                                                                        ? product.provisioning.install.cogs * product.pivot.quantity
                                                                        : 0);
                                                                return product.pivot.includeSupply || product.pivot.includeInstall
                                                                    ? totalRRP !== 0
                                                                        ? `${(((totalRRP - totalCOGS) / totalRRP) * 100).toLocaleString(undefined, {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })}%`
                                                                        : totalCOGS > 0
                                                                            ? "-100.00%"
                                                                            : "0.00%"
                                                                    : "";
                                                            })()}
                                                        </td>
                                                        <td className="px-4 py-3 font-bold whitespace-nowrap">
                                                            RM {(
                                                                ((product.provisioning.supply.retail_price + product.provisioning.install.retail_price) *
                                                                    product.pivot.quantity) -
                                                                ((product.provisioning.supply.cogs + product.provisioning.install.cogs) *
                                                                    product.pivot.quantity)
                                                            ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100/80 backdrop-blur-sm">
                                        <tr>
                                            <td colSpan={4} className="px-4 py-3"></td>
                                            <td className="px-4 py-3 text-center font-bold text-gray-900">
                                                <span className="font-bold text-lg">Total</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-md text-green-600 font-bold">
                                                    {(() => {
                                                        const totalRRP = packageDetail.products.reduce(
                                                            (acc, product) =>
                                                                acc +
                                                                (product.provisioning.supply.retail_price +
                                                                    product.provisioning.install.retail_price) *
                                                                product.pivot.quantity,
                                                            0
                                                        );
                                                        return totalRRP > 0
                                                            ? `RM ${totalRRP.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`
                                                            : '';
                                                    })()}
                                                </span>
                                            </td>
                                            {canSeeDetailedPricing(currentUser) && (
                                                <>
                                                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                        {(() => {
                                                            const totalSupplyRRP = packageDetail.products.reduce(
                                                                (acc, product) =>
                                                                    acc + product.provisioning.supply.retail_price * product.pivot.quantity,
                                                                0
                                                            );
                                                            return totalSupplyRRP > 0
                                                                ? `RM ${totalSupplyRRP.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}`
                                                                : '';
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                        {(() => {
                                                            const totalInstallRRP = packageDetail.products.reduce(
                                                                (acc, product) =>
                                                                    acc + product.provisioning.install.retail_price * product.pivot.quantity,
                                                                0
                                                            );
                                                            return totalInstallRRP > 0
                                                                ? `RM ${totalInstallRRP.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}`
                                                                : '';
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                        {(() => {
                                                            const totalSupplyCOGS = packageDetail.products.reduce(
                                                                (acc, product) =>
                                                                    acc + product.provisioning.supply.cogs * product.pivot.quantity,
                                                                0
                                                            );
                                                            return totalSupplyCOGS > 0
                                                                ? `RM ${totalSupplyCOGS.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}`
                                                                : '';
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                                                        {(() => {
                                                            const totalInstallCOGS = packageDetail.products.reduce(
                                                                (acc, product) =>
                                                                    acc + product.provisioning.install.cogs * product.pivot.quantity,
                                                                0
                                                            );
                                                            return totalInstallCOGS > 0
                                                                ? `RM ${totalInstallCOGS.toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}`
                                                                : '';
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="text-md text-red-600 font-bold">
                                                            {(() => {
                                                                const totalCOGS = packageDetail.products.reduce(
                                                                    (acc, product) =>
                                                                        acc +
                                                                        (product.provisioning.supply.cogs + product.provisioning.install.cogs) *
                                                                        product.pivot.quantity,
                                                                    0
                                                                );
                                                                return totalCOGS > 0
                                                                    ? `RM ${totalCOGS.toLocaleString(undefined, {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}`
                                                                    : '';
                                                            })()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 font-bold whitespace-nowrap">
                                                        {(() => {
                                                            const totalRRP = packageDetail.products.reduce(
                                                                (acc, product) =>
                                                                    acc +
                                                                    (product.provisioning.supply.retail_price +
                                                                        product.provisioning.install.retail_price) *
                                                                    product.pivot.quantity,
                                                                0
                                                            );
                                                            const totalCOGS = packageDetail.products.reduce(
                                                                (acc, product) =>
                                                                    acc +
                                                                    (product.provisioning.supply.cogs + product.provisioning.install.cogs) *
                                                                    product.pivot.quantity,
                                                                0
                                                            );
                                                            return totalRRP !== 0
                                                                ? `${(((totalRRP - totalCOGS) / totalRRP) * 100).toLocaleString(undefined, {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}%`
                                                                : totalCOGS > 0
                                                                    ? "-100.00%"
                                                                    : "0.00%";
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 font-bold whitespace-nowrap">
                                                        {(() => {
                                                            const totalRRP = packageDetail.products.reduce(
                                                                (acc, product) =>
                                                                    acc +
                                                                    (product.provisioning.supply.retail_price +
                                                                        product.provisioning.install.retail_price) *
                                                                    product.pivot.quantity,
                                                                0
                                                            );
                                                            const totalCOGS = packageDetail.products.reduce(
                                                                (acc, product) =>
                                                                    acc +
                                                                    (product.provisioning.supply.cogs + product.provisioning.install.cogs) *
                                                                    product.pivot.quantity,
                                                                0
                                                            );
                                                            const marginAmount = totalRRP - totalCOGS;
                                                            return `RM ${marginAmount.toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}`;
                                                        })()}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            {/* Archive Modal */}
            <DeleteModal
                item={selectedArchivePackage}
                modalTitle='Archive Package'
                modalPrompt='Are you sure you want to archive this package? You can restore it later from the Archive Zone.'
                notifySuccess='Package Archived Successfully!'
                notifyError='Package archiving failed'
                navigateUrl='/packages'
                deleteFunction={handleArchiveItem}
                onClose={() => setSelectedArchivePackage(null)}
                buttonText='Archive'
            />

            {/* Restore Modal */}
            <DeleteModal
                item={selectedRestorePackage}
                modalTitle='Restore Package'
                modalPrompt='Are you sure you want to restore this package?'
                notifySuccess='Package Restored Successfully!'
                notifyError='Package restore failed'
                deleteFunction={handleRestoreItem}
                onClose={() => setSelectedRestorePackage(null)}
                buttonText='Restore'
            />

            {/* Remove Modal */}
            <DeleteModal
                item={selectedPackage}
                modalTitle='Remove Package'
                modalPrompt='Are you sure to permanently remove this package:'
                notifySuccess='Package Removed Successfully!'
                notifyError='Package remove failed'
                deleteFunction={handleRemovePackage}
                onClose={() => setSelectedPackage(null)}
            />
        </div>
    );
}

export default PackageDetail;
