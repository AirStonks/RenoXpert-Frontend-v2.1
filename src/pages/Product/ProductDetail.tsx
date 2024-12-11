import { useNavigate, useParams } from "react-router-dom";
import useFetchProduct from "../../hook/useFetchProduct";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

function ProductDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const productId = id ? parseInt(id, 10) : null;
    const { product, loading, error } = useFetchProduct(productId);

    useEffect(() => {
        document.title = 'Product Detail | RenoXpert';
    }, []);

    const handleBackClick = () => {
        navigate('/products');
    };

    if (!productId) return null;

    if (loading) {
        return <Loading />;
    } else if (error) {
        return <div className="text-red-600">Something went wrong: {error}</div>;
    } else if (!product) {
        return <div>Product not found</div>;
    }

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-4">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Product Detail
                    </span>
                </div>
                <div className="flex">
                    <Link
                        to={'/products/edit/' + productId}
                        className="btn btn-info btn-sm"
                    >
                        Edit Product
                    </Link>
                </div>
            </div>

            <div className="flex mb-4 gap-2 items-center text-center badge badge-lg badge-pill">
                <i className="ki-filled ki-information-2 text-success"></i>
                <span className="font-semibold">Owner can only see this information</span>
            </div>

            <div className="flex flex-wrap gap-8 mb-8">
                <div className="flex flex-col flex-[3] gap-8">
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
                                            Photo:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center text-center">
                                            {product.attachments ?
                                                product.attachments.thumbnail && (
                                                    <div className="flex gap-4 items-center">
                                                        <a
                                                            className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                                                            href={AWS_S3_URL + (product.attachments.thumbnail.file_url)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <img
                                                                src={AWS_S3_URL + (product.attachments.thumbnail.file_url)}
                                                                alt={product.name}
                                                                className="w-24 h-24 object-cover"
                                                            />
                                                        </a>
                                                        <button
                                                            className="btn btn-sm btn-info btn-outline"
                                                            data-modal-toggle="#photos_modal"
                                                        >
                                                            View More
                                                        </button>
                                                    </div>
                                                )
                                                :
                                                <span className="text-gray-600">N/A</span>
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Product Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center text-center">
                                            <span>{product.name}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            SKU:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.SKU ? product.SKU : 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Description:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center">
                                            <span>{product.description ? product.description : '-'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Status:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Product Type:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            PM Category:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.pm_category}
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
                            <span className="text-gray-900">
                                {product.internal_desc ? product.internal_desc : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Product History
                            </h3>
                        </div>
                        <div className="card-group pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Created By:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.created_by ? product.created_by.name : 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Date Created:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.created_at}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="card-group pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Last Updated By:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.updated_by ? product.updated_by.name : 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Last Updated At:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.updated_at}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">
                                Project Management
                            </h3>
                        </div>
                        <div className="card-body pt-3.5 pb-3.5">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Task Weightage:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.task_weightage}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col flex-[4] gap-8'>
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                Pricing
                            </div>
                        </div>
                        <div className="card-body">
                            <table className="table-auto mb-4">
                                <tbody>
                                    <tr className="flex items-center">
                                        <td className="pb-3">
                                            <div className="flex flex-col pe-1">
                                                <span className="text-gray-900">UOM</span>
                                                <span className="text-xs text-gray-500">Unit of Measurement</span>
                                            </div>
                                        </td>
                                        <td className="pb-3">
                                            <span className="text-gray-900">:</span>
                                        </td>
                                        <td className="pb-3 ps-2 lg:ps-4 flex gap-2 items-center text-center">
                                            <span className="text-gray-900">{product.uom}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr className="flex items-center">
                                        <td>
                                            <div className="flex flex-col pe-1">
                                                <span className="text-gray-900">Total Retail Price</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-gray-900">:</span>
                                        </td>
                                        <td className="ps-2 lg:ps-4 flex gap-2 items-center text-center">
                                            <span className="text-gray-900">RM {product.provisioning.supply.retail_price + product.provisioning.install.retail_price}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="flex gap-2">
                                <div className="card flex-1">
                                    <div className="card-header">
                                        <div className="card-title">
                                            Supply
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <table className="table-auto">
                                            <tbody>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                        Retail Price:
                                                    </td>
                                                    <td className="text-sm text-gray-900 pb-3">
                                                        RM {product.provisioning.supply.retail_price}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                        COGS:
                                                    </td>
                                                    <td className="text-sm text-gray-900 pb-3">
                                                        RM {product.provisioning.supply.cogs}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pe-4 lg:pe-8">
                                                        Excluded Price:
                                                    </td>
                                                    <td className="text-sm text-gray-900">
                                                        RM {product.provisioning.supply.excluded_price}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="card flex-1">
                                    <div className="card-header">
                                        <div className="card-title">
                                            Install
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <table className="table-auto">
                                            <tbody>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                        Retail Price:
                                                    </td>
                                                    <td className="text-sm text-gray-900 pb-3">
                                                        RM {product.provisioning.install.retail_price}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                                        COGS:
                                                    </td>
                                                    <td className="text-sm text-gray-900 pb-3">
                                                        RM {product.provisioning.install.cogs}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="text-sm text-gray-600 pe-4 lg:pe-8">
                                                        Excluded Price:
                                                    </td>
                                                    <td className="text-sm text-gray-900">
                                                        RM {product.provisioning.install.excluded_price}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                Properties
                            </div>
                        </div>
                        <div className="card-body">
                            <table className="table-auto">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Color:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center text-center">
                                            <span>{product.color || 'N/A'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Material:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center text-center">
                                            <span>{product.material || 'N/A'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Width:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center text-center">
                                            <span>{product.width || 'N/A'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Height:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center text-center">
                                            <span>{product.height || 'N/A'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8">
                                            Depth:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3 flex gap-2 items-center text-center">
                                            <span>{product.depth || 'N/A'}</span>
                                            <i className="ki-filled ki-information-2 text-success"></i>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="photos_modal">
                <div className="modal-content h-full max-w-[900px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Product Photos</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body overflow-y-auto scrollable-y flex flex-col gap-4">
                        <div className="card w-full">
                            <div className="card-header">
                                <div className="card-title">
                                    Thumbnail
                                </div>
                            </div>
                            <div className="card-body">
                                {product.attachments ?
                                    product.attachments.thumbnail && (
                                        <div className="flex gap-4 items-center">
                                            <a
                                                className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                                                href={AWS_S3_URL + (product.attachments.thumbnail.file_url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <img
                                                    src={AWS_S3_URL + (product.attachments.thumbnail.file_url)}
                                                    alt={product.name}
                                                    className="w-24 h-24 object-cover"
                                                />
                                            </a>
                                        </div>
                                    )
                                    :
                                    <span className="text-gray-600">N/A</span>
                                }
                            </div>
                        </div>

                        <div className="card w-full">
                            <div className="card-header">
                                <div className="card-title">
                                    Photos
                                </div>
                            </div>
                            <div className="card-body flex gap-4">
                                {product.attachments ?
                                    product.attachments.photos ?
                                        product.attachments.photos.map((photo, index: number) => (
                                            <div className="flex gap-4 items-center" key={index}>
                                                <a
                                                    className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                                                    href={AWS_S3_URL + (photo.file_url)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <img
                                                        src={AWS_S3_URL + (photo.file_url)}
                                                        alt={photo.original_name}
                                                        className="w-24 h-24 object-cover"
                                                    />
                                                </a>
                                            </div>
                                        ))
                                        :
                                        <span className="text-gray-600">N/A</span>
                                    :
                                    <span className="text-gray-600">N/A</span>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProductDetail;