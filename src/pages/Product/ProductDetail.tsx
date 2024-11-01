import { useNavigate, useParams } from "react-router-dom";
import useFetchProduct from "../../hook/useFetchProduct";
import Loading from "../../components/Loading";
import { Link } from "react-router-dom";

function ProductDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const productId = id ? parseInt(id, 10) : null;
    const { product, loading, error } = useFetchProduct(productId);

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
            <div className="flex justify-between items-center flex-wrap mb-6">
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
                                            Product Name:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.name}
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
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.description ? product.description : '-'}
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
                                            Category:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            {product.category}
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
                                    <tr>
                                        <td className="pb-3">
                                            <div className="flex flex-col pe-1">
                                                <span className="">UOM</span>
                                                <span className="text-xs text-gray-500">Unit of Measurement</span>
                                            </div>
                                        </td>
                                        <td className="pb-3">
                                            :
                                        </td>
                                        <td className="ps-2 lg:ps-4 pb-3">
                                            {product.uom}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="">
                                            <div className="flex flex-col pe-1">
                                                <span className="">Total Retail Price</span>
                                            </div>
                                        </td>
                                        <td>
                                            :
                                        </td>
                                        <td className="ps-2 lg:ps-4">
                                            RM {product.provisioning.supply.retail_price + product.provisioning.install.retail_price}
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
                </div>
            </div>
        </>
    )
}

export default ProductDetail;