import { useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading";
import { Package } from "../../types";
import { Link } from "react-router-dom";
import useFetchQuotation from "../../hook/useFetchQuotation";
import React, { useEffect, useState } from "react";
import { KTAccordion } from "../../metronic/core";

function QuotationDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const quotationId = id ? parseInt(id, 10) : null;
    const { quotationDetail, loading, error } = useFetchQuotation(quotationId);

    const [selectedPackages, setSelectedPackages] = useState([]);

    useEffect(() => {
        document.title = "Quotation Detail | RenoXpert";
        KTAccordion.init();

        if (quotationDetail) {
            setSelectedPackages(quotationDetail.packages);
        }

    }, [quotationDetail]);

    const handleBackClick = () => {
        navigate('/quotations');
    };

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
                        Quotation Detail
                    </span>
                </div>
            </div>
            <div className="flex flex-wrap gap-8 mb-8">
                <div className="left-column flex flex-col flex-[3] gap-8">
                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                General Info
                            </h3>

                            <Link
                                to={`/quotations/edit/${quotationId}`}
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id={quotationId}
                            // onClick={handleCloseModal}
                            >
                                <i className="ki-outline ki-notepad-edit"></i>
                            </Link>
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
                                            Price:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${quotationDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <span className="badge badge-sm badge-success badge-outline">
                                                Available
                                            </span>
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

                            <Link
                                to={`/quotations/edit/${quotationId}`}
                                className="btn-edit btn btn-sm btn-icon btn-clear btn-light"
                                data-tooltip="#edit_tooltip"
                                data-action="edit"
                                data-id={quotationId}
                            // onClick={handleCloseModal}
                            >
                                <i className="ki-outline ki-notepad-edit"></i>
                            </Link>
                        </div>

                        <div className="flex flex-col gap-5 p-4" data-accordion="true">
                            {selectedPackages.map((prodPackage: Package) => (
                                <div className="package flex items-center" key={prodPackage.id} data-id={prodPackage.id}>
                                    <div className="accordion-item border rounded-xl w-full" data-accordion-item="true" id={"package_item_" + prodPackage.id.toString()}>
                                        <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + prodPackage.id.toString()}>
                                            <div className="flex flex-col items-start">
                                                <span className="text-base text-gray-900 font-medium">
                                                    {prodPackage.name}
                                                </span>
                                                <span className='text-base text-slate-700'>
                                                    RM {prodPackage.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className='text-sm text-slate-400'>
                                                    {prodPackage.description}
                                                </span>
                                            </div>
                                            <i className="ki-outline ki-plus text-gray-600 text-2sm accordion-active:hidden block">
                                            </i>
                                            <i className="ki-outline ki-minus text-gray-600 text-2sm accordion-active:block hidden">
                                            </i>
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
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}

export default QuotationDetail;