import { useEffect } from "react";
import useFetchPackage from "../../hook/useFetchPackage";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";

function PackageDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const packageId = id ? parseInt(id, 10) : null;
    const { packageDetail, loading, error } = useFetchPackage(packageId);

    useEffect(() => {
        document.title = "Package Detail | RenoXpert";
    }, [packageId]);

    const handleBackClick = () => {
        navigate('/packages');
    };

    if (!packageId) return null; // Early return for null packageId


    if (loading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!packageDetail) {
        return <div>Product Category not found</div>;
    }

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
                <div className="flex">
                    <Link
                        to={'/packages/edit/' + packageId}
                        className="btn btn-info btn-sm"
                    >
                        <i className="ki-outline ki-notepad-edit"></i>
                        Edit
                    </Link>
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
                                            Price:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {`RM ${packageDetail.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Description:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {packageDetail.description}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Internal Description:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
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
                                        <th className='w-[100px]'>Unit Price</th>
                                        <th className='w-[100px]'>Total Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {packageDetail.products.map((product, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span>{product.name}</span>
                                                    <span className="text-xs text-slate-400 font-semibold">SKU: {product.SKU || '-'}</span>
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
                                            <td>
                                                RM {(product.provisioning.supply.retail_price + product.provisioning.install.retail_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                RM {((product.provisioning.supply.retail_price + product.provisioning.install.retail_price) * product.pivot.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PackageDetail;