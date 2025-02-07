import { useLocation, useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading";
import { Package } from "../../types";
import { Link } from "react-router-dom";
import useFetchQuotation from "../../hook/useFetchQuotation";
import React, { useEffect, useState } from "react";
import { KTAccordion, KTModal } from "../../metronic/core";
import { archiveQuotation, restoreQuotation } from "../../services/api";
import { Slide, toast } from "react-toastify";

const categoryOptions = [
    { value: "renovation", label: "Renovation" },
    { value: "partition", label: "Partition" },
    { value: "smart_iot", label: "Smart IoT" },
    { value: "project_management", label: "Project Management" },
    { value: "electrical_appliances", label: "Electrical Appliances" },
    { value: "air_conditioning", label: "Air Conditioning" },
    { value: "others", label: "Others" },
];

function QuotationDetail() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const quotationId = id ? parseInt(id, 10) : null;
    const { quotationDetail, loading, error, refetch } = useFetchQuotation(quotationId);

    const [selectedPackages, setSelectedPackages] = useState([]);

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
        document.title = "Quotation Detail | RenoXpert";
        KTAccordion.init();

        if (quotationDetail) {
            setSelectedPackages(quotationDetail.packages);
        }

    }, [quotationDetail]);

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/quotations');
        }
    };

    const handleArchiveItem = async () => {
        try {
            const response = await archiveQuotation(quotationId);

            if (response?.success) {
                notify('success', 'Quotation archived successfully.');

                const modalEl = document.querySelector('#archive_item_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);

                modal.hide();
                refetch();

                navigate('/quotations/' + quotationId);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleRestoreItem = async () => {
        try {
            const response = await restoreQuotation(quotationId);

            if (response?.success) {
                notify('success', 'Quotation restored successfully.');

                const modalEl = document.querySelector('#restore_item_modal') as HTMLElement;
                const modal = KTModal.getInstance(modalEl);

                modal.hide();
                refetch();

                navigate('/quotations/' + quotationId);
            }
        } catch (error) {
            console.log(error);
        }
    }

    if (loading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!quotationDetail) {
        return <div>Quotation not found</div>;
    }

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Quotation Template Detail
                    </span>
                </div>
                <div className="flex gap-4">
                    <Link
                        to={`/quotations/edit/${quotationId}`}
                        className="btn btn-info btn-sm"
                    >
                        <i className="ki-outline ki-notepad-edit"></i>
                        Edit
                    </Link>
                    {quotationDetail.status === 'archived' &&
                        <button
                            className="btn btn-success btn-sm btn-outline"
                            data-modal-toggle="#restore_item_modal"
                        >
                            <div className="flex gap-2 items-center">
                                <i className="ki-filled ki-archive"></i>
                                <span>Restore Product</span>
                            </div>
                        </button>
                    }
                    <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                        <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                            <i className="ki-filled ki-dots-vertical"></i>
                        </button>

                        <div className="dropdown-content menu menu-default w-full max-w-56 py-2" data-dropdown-dismiss="true">
                            {quotationDetail.status !== 'archived' &&
                                <div className="menu-item">
                                    <button
                                        className="menu-link"
                                        data-modal-toggle="#archive_item_modal"
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center text-danger">
                                                <i className="ki-filled ki-archive text-lg"></i>
                                                <span className="text-start">Archive Quotation Template</span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            }
                            {quotationDetail.status === 'archived' &&
                                <div className="menu-item">
                                    <button
                                        className="menu-link"
                                    // data-modal-toggle="#archive_item_modal"
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center text-danger">
                                                <i className="ki-outline ki-trash text-lg"></i>
                                                <span>Remove Quotation Template</span>
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
                                            Quotation Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {quotationDetail.name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Property:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">

                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Price:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${quotationDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td
                                            className={`badge badge-sm badge-outline text-sm text-gray-900
                                                    ${quotationDetail.status === 'available' ? 'badge-success' : ''}
                                                    ${quotationDetail.status === 'archived' ? 'badge-danger' : ''}
                                                `}
                                        >
                                            {quotationDetail.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 py-3 pe-4 lg:pe-8">
                                            Draft/Ready:
                                        </td>
                                        <td className="text-sm text-gray-900 py-3">
                                            <label className="switch switch-lg">
                                                <input
                                                    className="checkbox"
                                                    name="is_ready"
                                                    type="checkbox"
                                                    checked={!!quotationDetail.is_ready}
                                                    readOnly
                                                />
                                            </label>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Description:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {quotationDetail.description || '-'}
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
                                Packages
                            </h3>
                        </div>

                        <div className="flex flex-col gap-5 p-4" data-accordion="true">
                            {selectedPackages &&
                                selectedPackages.map((prodPackage: Package) => (
                                    <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                        <div className="accordion-item border rounded-xl w-full" data-accordion-item="true" id={"package_item_" + prodPackage.id.toString()}>
                                            <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-base text-gray-900 font-medium">
                                                        {prodPackage.name}
                                                    </span>
                                                    <span className='text-base text-gray-700'>
                                                        RM {prodPackage.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    {prodPackage.category &&
                                                        <div className="badge text-sm">
                                                            {categoryOptions.find(option => option.value === prodPackage.category)?.label}
                                                        </div>
                                                    }
                                                    <span className='flex items-center gap-2 text-sm text-slate-400'>
                                                        {prodPackage.description_internal && <>
                                                            <i className="ki-filled ki-information-2 text-warning text-xl"></i>
                                                            {prodPackage.description_internal}
                                                        </>}
                                                    </span>
                                                </div>
                                                <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                            </button>
                                            <div className="accordion-content hidden border-t" id={"package_content_" + prodPackage.id.toString()}>
                                                <div className="product-list flex flex-col">
                                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[250px]'>Product</th>
                                                                <th className='w-[100px] text-center'>Quantity</th>
                                                                <th className='w-[120px] text-center'>Selling Price</th>
                                                                <th className='w-[120px] text-center'>Total Price</th>
                                                                <th className='w-[60px] text-center'>Visibility</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {prodPackage.products.map((product) => (
                                                                <React.Fragment key={product.id}>
                                                                    <tr>
                                                                        <td>
                                                                            <div className="flex flex-col">
                                                                                <span>{product.name}</span>
                                                                                <span className="text-xs text-slate-400">{product.description}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className='text-center text-lg'>
                                                                            <span className="mx-2 text-base">
                                                                                {product.pivot.quantity}
                                                                            </span>
                                                                        </td>
                                                                        <td className='text-center'>
                                                                            RM {(product.provisioning.supply.retail_price + product.provisioning.install.retail_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className='text-center'>
                                                                            RM {((product.provisioning.supply.retail_price * product.pivot.quantity) + (product.provisioning.install.retail_price * product.pivot.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className='text-center'>
                                                                            <label className="switch flex justify-center">
                                                                                <input
                                                                                    name="visibility"
                                                                                    type="checkbox"
                                                                                    checked={product.pivot.visibility}
                                                                                    readOnly
                                                                                />
                                                                            </label>
                                                                        </td>
                                                                    </tr>
                                                                    {/* <tr>
                                                                <td colSpan={8}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Add a internal reference note"
                                                                        className="input w-full border p-2"
                                                                    // onChange={(e) => handleNoteChange(product.id, e.target.value)}
                                                                    />
                                                                </td>
                                                            </tr> */}
                                                                </React.Fragment>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="archive_item_modal">
                <div className="modal-content modal-center-y max-w-[500px]">
                    <div className="modal-body overflow-y-auto scrollable-y flex flex-col gap-6 justify-center items-center my-4">
                        <div className="modal-title text-lg">
                            Archive Quotation
                        </div>

                        <div className="text-gray-800">
                            Are you sure you want to archive this quotation?
                        </div>

                        <blockquote className="p-4 border-s-4 border-warning bg-warning-clarity rounded-md">
                            <div className="flex gap-4">
                                <div className="flex">
                                    <i className="ki-filled ki-information-4 text-xl text-warning"></i>
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-warning-active font-semibold">
                                            Restore Quotation
                                        </span>
                                        <span className="text-sm text-gray-800">
                                            You can unarchive and restore products from the quotation <strong>Archive Zone</strong>.
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
                            Restore Product
                        </div>

                        <div className="text-gray-800">
                            Are you sure you want to restore this product?
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
        </>
    )
}

export default QuotationDetail;