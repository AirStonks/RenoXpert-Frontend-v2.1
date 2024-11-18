import Button from '../../components/Buttons/Button';
import KTComponent from '../../metronic/core';
import { useEffect, useState } from 'react';
import { Product } from '../../types';
import { productIndex, removeProduct } from '../../services/api';
import DeleteModal from '../../components/Modals/DeleteModal';
import Loading from '../../components/Loading';
import { useNavigate } from 'react-router-dom';

function ProductMain() {
    const navigate = useNavigate();

    const [products, setProducts] = useState<Product[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(5);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const [selectedProduct, setSelectedProduct] = useState<{ id: number | string, name: string } | null>(null);

    useEffect(() => {
        document.title = "Products | RenoXpert";
        KTComponent.init();
        initProductTable(page, size);
    }, [page, size]);

    const initProductTable = async (page: number, size: number) => {
        try {
            setIsLoading(true);
            const response = await productIndex(size, page);

            // Ensure the API response is valid and contains 'products'
            const data = response?.data || []; // Default to an empty array if undefined
            setProducts(data);

            // Ensure the totalItems field exists in the response
            setTotalItems(response?.totalCount || 0); // Default to 0 if undefined
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to load products');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initProductTable(page, size);
    };

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        try {
            setIsLoading(true);
            const response = await productIndex(size, page, value);

            const data = response?.data || [];
            setProducts(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error searching products:', error);
            setError('Failed to search products');
        } finally {
            setIsLoading(false);
        }
    };


    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size
    };

    const handleViewProduct = (productId: string | number) => {
        navigate(`/products/${productId}`);
    }

    const handleRemoveProduct = async (productId: number) => {
        try {
            const response = await removeProduct(productId);

            if (response?.success) {
                initProductTable(page, size);
                return { success: true };
            }
            return { success: false };

        } catch (error) {
            console.log(error);
            return { success: false, message: 'Product removal failed' };
        }
    }

    const totalPages = Math.ceil(totalItems / size);

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Product Overview
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <button className="btn btn-sm btn-info" disabled>
                            Go to Product Inventory
                        </button>
                        <Button
                            url='/products/create'
                            btnText='Add Product'
                            btnSize='btn-sm'
                            icon='ki-outline ki-plus-squared'
                        />
                        <Button
                            url='/products/category'
                            btnText='Manage Category'
                            btnSize='btn-sm'
                            btnColor='btn-warning'
                        />
                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">
                            Project Overview
                        </div>
                        <div className="flex flex-wrap gap-2 lg:gap-5 items-center">
                            <button
                                className="btn-refresh"
                                onClick={handleRefreshTable}
                            >
                                <i className="ki-solid ki-arrows-circle text-lg"></i>
                            </button>
                            <div className="flex">
                                <label className="input input-sm">
                                    <i className="ki-filled ki-magnifier"></i>
                                    <input
                                        placeholder="Search products"
                                        type="text"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                    />
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {/* <select className="select select-sm w-28">
                                    <option value="1">
                                        Latest
                                    </option>
                                    <option value="2">
                                        Older
                                    </option>
                                    <option value="3">
                                        Oldest
                                    </option>
                                </select>
                                <button className="btn btn-sm btn-outline btn-primary">
                                    <i className="ki-filled ki-setting-4">
                                    </i>
                                    Filters
                                </button>
                                <label className="switch switch-sm">
                                    <input className="order-2" name="check" type="checkbox" value="1" />
                                    <span className="switch-label order-1">Push Alerts</span>
                                </label> */}
                            </div>
                        </div>
                    </div>
                    <div className="card-table">
                        <table className="table align-middle text-gray-700 font-medium text-sm">
                            <thead>
                                <tr>
                                    <th className='w-[300px] text-center'>Name</th>
                                    <th className='w-[100px] text-center'>SKU</th>
                                    <th className='w-[100px] text-center'>Selling Price</th>
                                    <th className='w-[120px] text-center'>PM Category</th>
                                    <th className='w-[120px] text-center'>Type</th>
                                    <th className='w-[80px] text-center'>Task Weightage</th>
                                    <th className='w-[120px] text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? (
                                    products.map((product, prodIndex) => (
                                        <tr key={prodIndex}>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span>{product.name}</span>
                                                    <span className="text-xs text-slate-400">{product.description || ''}</span>
                                                </div>
                                            </td>
                                            <td className='text-center'>{product.SKU}</td>
                                            <td className='text-center'>
                                                <div className="flex flex-col justify-center items-center">
                                                    <span>RM {product.provisioning.supply.retail_price + product.provisioning.install.retail_price}</span>
                                                </div>
                                            </td>
                                            <td className='text-center capitalize'>{product.pm_category}</td>
                                            <td className='text-center capitalize'>{product.type}</td>
                                            <td className='text-center'>{product.task_weightage}</td>
                                            <td className='text-center'>
                                                <div className="flex justify-around gap-2">
                                                    <button
                                                        className="btn-view btn btn-sm btn-secondary"
                                                        onClick={() => handleViewProduct(product.id)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="btn-delete btn btn-sm btn-icon btn-clear btn-light"
                                                        data-modal-toggle="#delete_item_modal"
                                                        onClick={() => setSelectedProduct({ id: product.id, name: product.name })}
                                                    >
                                                        <i className="ki-outline ki-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center text-gray-500">
                                            No products available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="card-footer justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
                        <div className="flex items-center gap-2">
                            Show
                            <select
                                className="select select-sm w-16"
                                name="perpage"
                                value={size}
                                onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="30">30</option>
                                <option value="50">50</option>
                            </select>
                            per page
                        </div>
                        <div className="flex items-center gap-4">
                            <span>{(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}</span>
                            <div className="pagination">
                                {/* Previous Page Button */}
                                <button
                                    className={`btn ${page === 1 ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(page - 1)}
                                >
                                    <i className="ki-outline ki-black-left"></i>
                                </button>

                                {/* Page Number Buttons with Ellipses */}
                                {totalPages > 0 && (
                                    <>
                                        {page > 3 && (
                                            <>
                                                <button
                                                    className="btn"
                                                    onClick={() => handlePageChange(1)}
                                                >
                                                    1
                                                </button>
                                                <span className="btn btn-disabled">...</span>
                                            </>
                                        )}

                                        {Array.from({
                                            length: Math.min(3, totalPages)
                                        }, (_, index) => {
                                            // Determine the start of the 3-page window
                                            const startPage = Math.max(1,
                                                Math.min(
                                                    page - 1,
                                                    totalPages - 2
                                                )
                                            );

                                            const currentPage = startPage + index;
                                            return (
                                                <button
                                                    key={currentPage}
                                                    className={`btn ${page === currentPage ? 'active' : ''}`}
                                                    onClick={() => handlePageChange(currentPage)}
                                                >
                                                    {currentPage}
                                                </button>
                                            );
                                        })}

                                        {page < totalPages - 2 && (
                                            <>
                                                <span className="btn btn-disabled">...</span>
                                                <button
                                                    className="btn"
                                                    onClick={() => handlePageChange(totalPages)}
                                                >
                                                    {totalPages}
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Next Page Button */}
                                <button
                                    className={`btn ${page === totalPages ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(page + 1)}
                                >
                                    <i className="ki-outline ki-black-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteModal
                item={selectedProduct}
                modalTitle='Remove Product'
                modalPrompt='Are you sure to permanently remove this product:'
                notifySuccess='Product Removed Successfully!'
                notifyError='Product remove failed'
                navigateUrl='/products'
                deleteFunction={handleRemoveProduct}
            />
        </>
    );
}

export default ProductMain;