import Button from '../../components/Buttons/Button';
import KTComponent from '../../metronic/core';
import { useEffect, useRef, useState } from 'react';
import { Product } from '../../types';
import { productIndex, removeProduct } from '../../services/api';
import DeleteModal from '../../components/Modals/DeleteModal';
import Loading from '../../components/Loading';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

type SortOrder = 'asc' | 'desc' | null;

function ProductMain() {
    const navigate = useNavigate();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    // Define the shape of the stored config with expiration
    interface StoredConfig {
        page: number;
        size: number;
        searchTerm: string;
        sortField: string;
        sortOrder: SortOrder;
        expiresAt: number; // Timestamp in milliseconds
    }

    // Load initial state from localStorage with expiration check
    const getInitialState = (): StoredConfig => {
        const savedState = localStorage.getItem('productMainConfig');
        const defaultState = {
            page: 1,
            size: 10,
            searchTerm: '',
            sortField: '',
            sortOrder: 'asc' as SortOrder,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 1 day from now
        };

        if (savedState) {
            const parsedState: StoredConfig = JSON.parse(savedState);
            const currentTime = Date.now();

            // Check if the data has expired
            if (currentTime > parsedState.expiresAt) {
                localStorage.removeItem('productMainConfig'); // Clear expired data
                return defaultState;
            }
            return parsedState;
        }
        return defaultState;
    };

    const [products, setProducts] = useState<Product[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(getInitialState().page);
    const [size, setSize] = useState<number>(getInitialState().size);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>(getInitialState().searchTerm);
    const [sortField, setSortField] = useState<string>(getInitialState().sortField);
    const [sortOrder, setSortOrder] = useState<SortOrder>(getInitialState().sortOrder);

    const [selectedProduct, setSelectedProduct] = useState<{ id: number | string, name: string } | null>(null);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const config: StoredConfig = {
            page,
            size,
            searchTerm,
            sortField,
            sortOrder,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // Set expiration to 1 day from now
        };
        localStorage.setItem('productMainConfig', JSON.stringify(config));
    }, [page, size, searchTerm, sortField, sortOrder]);


    useEffect(() => {
        document.title = "Products | RenoXpert";
        KTComponent.init();
        initProductTable(page, size, searchTerm, sortOrder, sortField);
    }, [page, size, searchTerm, sortField, sortOrder]);

    const initProductTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await productIndex(size, page, searchTerm, order, field);
            const data = response?.data || [];
            setProducts(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to load products');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initProductTable(page, size, searchTerm, sortOrder, sortField);
    };

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        // Debounce logic remains the same
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);

            try {
                setIsLoading(true);
                const response = await productIndex(size, 1, value, sortOrder, sortField);

                const data = response?.data || [];
                setProducts(data);
                setTotalItems(response?.totalCount || 0);
            } catch (error) {
                console.error('Error searching products:', error);
                setError('Failed to search products');
            } finally {
                setIsLoading(false);
            }

        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        initProductTable(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size
        initProductTable(1, newSize, searchTerm, sortOrder, sortField);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Cycle through states: null -> asc -> desc -> null
            if (sortOrder === null) {
                setSortOrder('asc');
                initProductTable(page, size, searchTerm, 'asc', field);
            } else if (sortOrder === 'asc') {
                setSortOrder('desc');
                initProductTable(page, size, searchTerm, 'desc', field);
            } else {
                setSortOrder(null);
                setSortField('');
                initProductTable(page, size, searchTerm, null, '');
            }
        } else {
            // New field, start with ascending
            setSortField(field);
            setSortOrder('asc');
            initProductTable(page, size, searchTerm, 'asc', field);
        }
    };

    const getSortIcon = (field: string) => {
        if (sortField !== field) {
            return <i className="ki-outline ki-arrow-up-down text-gray-400" />;
        }
        switch (sortOrder) {
            case 'asc':
                return <i className="ki-outline ki-arrow-up text-primary" />;
            case 'desc':
                return <i className="ki-outline ki-arrow-down text-primary" />;
            default:
                return <i className="ki-outline ki-arrow-up-down text-gray-400" />;
        }
    };

    const handleRemoveProduct = async (productId: number) => {
        try {
            const response = await removeProduct(productId);

            if (response?.success) {
                initProductTable(1, 10, null);
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
                        <Link
                            to="/inventory"
                            className="btn btn-sm btn-info"
                        >
                            Go to Product Inventory
                        </Link>
                        <Button
                            url='/products/create'
                            btnText='Add Product'
                            btnSize='btn-sm'
                            icon='ki-outline ki-plus-squared'
                        />
                        <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                            <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                                <i className="ki-filled ki-dots-vertical"></i>
                            </button>

                            <div className="dropdown-content menu menu-default w-full max-w-56 py-2" data-dropdown-dismiss="true">
                                <div className="menu-item disabled">
                                    <button
                                        className="menu-link"
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <span>Manage Category</span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                                <div className="menu-item">
                                    <Link
                                        to={'/products/archives'}
                                        className="menu-link"
                                        data-modal-toggle="#archive_product_modal"
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <i className="ki-filled ki-archive"></i>
                                                <span>Archived Zone</span>
                                            </div>
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">
                            Product Overview
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
                                    <th className='w-[120px] text-center'>
                                        <div className="flex items-center justify-center gap-2">
                                            Photo
                                        </div>
                                    </th>
                                    <th
                                        className='w-[450px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Name {getSortIcon('name')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[100px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('price')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Selling Price {getSortIcon('price')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[120px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('pm_category_id')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            PM Category {getSortIcon('pm_category_id')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[120px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('type')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Type {getSortIcon('type')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Created Date {getSortIcon('created_at')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('updated_at')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Updated Date {getSortIcon('updated_at')}
                                        </div>
                                    </th>
                                    <th className='w-[120px] text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? (
                                    products.map((product, prodIndex) => (
                                        <tr
                                            key={prodIndex}
                                            className={`${prodIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                        >
                                            <td className='text-center'>
                                                {product.attachments && product.attachments.thumbnail ? (
                                                    <img
                                                        src={AWS_S3_URL + product.attachments.thumbnail.file_url}
                                                        alt={product.name}
                                                        className="w-[72px] h-[72px] object-cover border border-gray-300 rounded"
                                                    />
                                                )
                                                    :
                                                    ''
                                                }
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span>{product.name}</span>
                                                    <div className="inline-block">
                                                        <span className="text-xs font-semibold badge badge-outline badge-xs my-1">SKU: {product.SKU || '-'}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-400">{product.description || ''}</span>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col justify-center items-center">
                                                    <span>RM {product.provisioning.supply.retail_price + product.provisioning.install.retail_price}</span>
                                                </div>
                                            </td>
                                            <td className='text-center capitalize'>{product.pm_category}</td>
                                            <td className='text-center capitalize'>{product.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</td>
                                            <td className='text-center'>
                                                <div className="flex flex-col">
                                                    <span>{product.created_by ? product.created_by.name : '-'}</span>
                                                    <div className="inline-block">
                                                        <span className="text-sm font-semibold badge badge-outline badge-sm my-1">{product.created_at}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col">
                                                    <span>{product.updated_by ? product.updated_by.name : '-'}</span>
                                                    <div className="inline-block">
                                                        <span className="text-sm font-semibold badge badge-outline badge-sm my-1">{product.updated_at}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex justify-around gap-2">
                                                    <Link
                                                        to={`/products/${product.id}`}
                                                        className="btn-view btn btn-sm btn-secondary"
                                                    >
                                                        View
                                                    </Link>
                                                    {/* <button
                                                        className="btn-delete btn btn-sm btn-icon btn-danger"
                                                        data-modal-toggle="#delete_item_modal"
                                                        onClick={() => setSelectedProduct({ id: product.id, name: product.name })}
                                                    >
                                                        <i className="ki-outline ki-trash"></i>
                                                    </button> */}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="text-center text-gray-500">
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

            {/* <DeleteModal
                item={selectedProduct}
                modalTitle='Remove Product'
                modalPrompt='Are you sure to permanently remove this product:'
                notifySuccess='Product Removed Successfully!'
                notifyError='Product remove failed'
                navigateUrl='/products'
                deleteFunction={handleRemoveProduct}
            /> */}
        </>
    );
}

export default ProductMain;