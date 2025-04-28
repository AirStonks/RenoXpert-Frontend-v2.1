import { useEffect, useState } from "react";
import useFetchPackage from "../../hook/useFetchPackage";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";
import { archivePackage, removePackage, restorePackage } from "../../services/api";
import { Slide, toast } from "react-toastify";
import { KTModal } from "../../metronic/core";
import DeleteModal from "../../components/Modals/DeleteModal";

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
    const { packageDetail, loading, error, refetch } = useFetchPackage(packageId);

    const [selectedPackage, setSelectedPackage] = useState<{ id: number | string, name: string } | null>(null);

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
        setSelectedPackage({ id: packageId, name: packageDetail?.name || '' });
    }, [packageId, packageDetail?.name]);

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/packages');
        }
    };

    const handleArchiveItem = async () => {
        try {
            const response = await archivePackage(packageId);

            if (response?.success) {
                notify('success', 'Package archived successfully.');

                const modalEl = document.querySelector('#archive_item_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);

                modal.hide();
                refetch();

                navigate('/packages/' + packageId);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleRestoreItem = async () => {
        try {
            const response = await restorePackage(packageId);

            if (response?.success) {
                notify('success', 'Package restored successfully.');

                const modalEl = document.querySelector('#restore_item_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);

                modal.hide();
                refetch();

                navigate('/packages/' + packageId);
            }
        } catch (error) {
            console.log(error);
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

    if (!packageId) return null; // Early return for null packageId


    if (loading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!packageDetail) {
        return <div>Product Category not found</div>;
    }

    // Calculate package retail price (sum of all items supply and install retail price)
    const packageRetailPrice = packageDetail.products.reduce((total, item) => total + ((item.provisioning.supply.retail_price + item.provisioning.install.retail_price) * item.pivot.quantity), 0);

    const packageCogs = packageDetail.products.reduce((total, item) => total + ((item.provisioning.supply.cogs + item.provisioning.install.cogs) * item.pivot.quantity), 0);

    // Calculate package margin in amount
    const packageMarginInAmount = packageRetailPrice - packageCogs;

    // Calculate package margin in percentage (handle division by zero)
    const packageMarginInPercentage = packageRetailPrice > 0 ? (packageMarginInAmount / packageRetailPrice) * 100 : 0;

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Package Detail
                    </span>
                </div>
                <div className="flex gap-4">
                    <Link
                        to={'/packages/edit/' + packageId}
                        className="btn btn-info btn-sm"
                    >
                        <i className="ki-outline ki-notepad-edit"></i>
                        Edit
                    </Link>
                    {packageDetail.status === 'archived' &&
                        <button
                            className="btn btn-success btn-sm btn-outline"
                            data-modal-toggle="#restore_item_modal"
                        >
                            <div className="flex gap-2 items-center">
                                <i className="ki-filled ki-archive"></i>
                                <span>Restore Package</span>
                            </div>
                        </button>
                    }
                    <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                        <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                            <i className="ki-filled ki-dots-vertical"></i>
                        </button>

                        <div className="dropdown-content menu menu-default w-full max-w-56 py-2" data-dropdown-dismiss="true">
                            <div className="menu-item">
                                <Link
                                    to={`/packages/create`}
                                    state={{ dupPackId: packageId, fromUrl: `/packages/${packageId}` }}
                                    className="menu-link"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-outline ki-note text-lg"></i>
                                            <span>Duplicate Package</span>
                                        </div>
                                    </span>
                                </Link>
                            </div>
                            {packageDetail.status !== 'archived' &&
                                <div className="menu-item">
                                    <button
                                        className="menu-link"
                                        data-modal-toggle="#archive_item_modal"
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center text-danger">
                                                <i className="ki-filled ki-archive text-lg"></i>
                                                <span>Archive Package</span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            }
                            {packageDetail.status === 'archived' &&
                                <div className="menu-item">
                                    <button
                                        className="menu-link"
                                        data-modal-toggle="#delete_item_modal"
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center text-danger">
                                                <i className="ki-outline ki-trash text-lg"></i>
                                                <span>Remove Package</span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                General Info
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Package Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {packageDetail.name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Total Retail Price:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${packageRetailPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Total COGS:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${packageCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Total Margin (Amount):
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${packageMarginInAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Total Margin (%):
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`${packageMarginInPercentage.toFixed(2)}%`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td
                                            className={`badge badge-sm badge-outline text-sm text-gray-900
                                                    ${packageDetail.status === 'available' ? 'badge-success' : ''}
                                                    ${packageDetail.status === 'archived' ? 'badge-danger' : ''}
                                                `}
                                        >
                                            {packageDetail.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 py-3 pe-4 lg:pe-8">
                                            Description:
                                        </td>
                                        <td className="text-sm text-gray-900 py-3">
                                            {packageDetail.description}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Category:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {packageDetail.category ?
                                                categoryOptions.find(option => option.value === packageDetail.category)?.label
                                                :
                                                '-'
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Add-on Package:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {packageDetail.is_addon ? 'Yes' : 'No'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Internal Description
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            {packageDetail.description_internal}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col right-column flex-[6] gap-8'>
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Products
                            </h3>
                        </div>
                        <div className="card-table pb-3.5">
                            <table className="table align-middle text-gray-700 font-medium text-sm">
                                <thead>
                                    <tr>
                                        <th className='w-[250px]'>Product</th>
                                        <th className='w-[50px] text-center'>Quantity</th>
                                        <th className='w-[100px] text-center'>Visibility</th>
                                        <th className='w-[100px] whitespace-nowrap'>Supply RRP</th>
                                        <th className='w-[100px] whitespace-nowrap'>Install RRP</th>
                                        <th className='w-[100px] whitespace-nowrap'>Total RRP</th>
                                        <th className='w-[100px] whitespace-nowrap'>Supply COGS</th>
                                        <th className='w-[100px] whitespace-nowrap'>Install COGS</th>
                                        <th className='w-[100px] whitespace-nowrap'>Total COGS</th>
                                        <th className='w-[100px] whitespace-nowrap'>Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {packageDetail.products.map((product, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td>
                                                <div className="flex flex-col">
                                                    <span>{product.name}</span>
                                                    <div className="inline-block">
                                                        <span className="text-xs text-slate-400 font-semibold badge badge-xs badge-pill">SKU: {product.SKU || '-'}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-400">{product.description}</span>
                                                </div>
                                            </td>
                                            <td className='text-center text-lg'>
                                                <span className="mx-2 text-base">
                                                    {product.pivot.quantity}
                                                </span>
                                            </td>
                                            <td>
                                                <label className="switch flex justify-center">
                                                    <input
                                                        name="visibility"
                                                        type="checkbox"
                                                        checked={product.pivot.visibility}
                                                        readOnly
                                                    />
                                                </label>
                                            </td>
                                            <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                RM {product.provisioning.supply.retail_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                RM {product.provisioning.install.retail_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="whitespace-nowrap font-semibold text-success">
                                                RM {((product.provisioning.supply.retail_price + product.provisioning.install.retail_price) * product.pivot.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                RM {product.provisioning.supply.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="whitespace-nowrap text-gray-500 font-medium text-xs">
                                                RM {product.provisioning.install.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="whitespace-nowrap font-semibold text-danger">
                                                RM {((product.provisioning.supply.cogs + product.provisioning.install.cogs) * product.pivot.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="whitespace-nowrap font-semibold">
                                                RM {(((product.provisioning.supply.retail_price + product.provisioning.install.retail_price) * product.pivot.quantity) - ((product.provisioning.supply.cogs + product.provisioning.install.cogs) * product.pivot.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="archive_item_modal">
                <div className="modal-content modal-center-y max-w-[500px]">
                    <div className="modal-body overflow-y-auto scrollable-y flex flex-col gap-6 justify-center items-center my-4">
                        <div className="modal-title text-lg">
                            Archive Package
                        </div>

                        <div className="text-gray-800">
                            Are you sure you want to archive this package?
                        </div>

                        <blockquote className="p-4 border-s-4 border-warning bg-warning-clarity rounded-md">
                            <div className="flex gap-4">
                                <div className="flex">
                                    <i className="ki-filled ki-information-4 text-xl text-warning"></i>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-warning-active font-semibold">
                                            Restore Package
                                        </span>
                                        <span className="text-sm text-gray-800">
                                            You can unarchive and restore packages from the package <strong>Archive Zone</strong>.
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-warning-active font-semibold">
                                            Manual Removal from Associated Entities
                                        </span>
                                        <span className="text-sm text-gray-800">
                                            At this stage of system development, we are unable to automatically remove the item you are about to archive from the <strong>Package, Quotation Template and Quotation Orders</strong>. You will need to manually remove it from these sections.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </blockquote>

                        <div className="flex gap-4">
                            <button
                                className="btn btn-secondary btn-sm"
                                data-modal-dismiss="true"
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success btn-sm"
                                onClick={handleArchiveItem}
                            >
                                Archive
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="restore_item_modal">
                <div className="modal-content modal-center-y max-w-[500px]">
                    <div className="modal-body overflow-y-auto scrollable-y flex flex-col gap-6 justify-center items-center my-4">
                        <div className="modal-title text-lg">
                            Restore Package
                        </div>

                        <div className="text-gray-800">
                            Are you sure you want to restore this package?
                        </div>

                        {/* <blockquote className="p-4 border-s-4 border-warning bg-warning-clarity rounded-md">
                            <div className="flex gap-4">
                                <div className="flex">
                                    <i className="ki-filled ki-information-4 text-xl text-warning"></i>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-warning-active font-semibold">
                                        Information
                                    </span>
                                    <span className="text-sm text-gray-800">
                                        You can retrieve this product from the product archive zone and unarchive it.
                                    </span>
                                </div>
                            </div>
                        </blockquote> */}

                        <div className="flex gap-4">
                            <button
                                className="btn btn-secondary btn-sm"
                                data-modal-dismiss="true"
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success btn-sm"
                                onClick={handleRestoreItem}
                            >
                                Restore
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteModal
                item={selectedPackage}
                modalTitle='Remove Package'
                modalPrompt='Are you sure to permanently remove this package:'
                notifySuccess='Package Removed Successfully!'
                notifyError='Package remove failed'
                navigateUrl='/packages'
                deleteFunction={handleRemovePackage}
            />
        </>
    );
}

export default PackageDetail;