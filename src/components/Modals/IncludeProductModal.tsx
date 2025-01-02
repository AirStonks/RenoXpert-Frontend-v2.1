// src\components\Modals\IncludeProductModal.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { KTDataTable } from "../../metronic/core";
import { Product } from "../../types";
import { productIndex } from "../../services/api";
import Loading from "../Loading";

interface IncludeProductModalProps {
    selectedProducts: Product[];
    updateSelectedProducts: (products: Product[]) => void;
    updateTotalPrice: (price: number, operator: string) => void;
    previousModalId?: string; // Make this optional
}

type SortOrder = 'asc' | 'desc' | null;

function IncludeProductModal({
    selectedProducts,
    updateSelectedProducts,
    updateTotalPrice,
    previousModalId
}: IncludeProductModalProps) {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [products, setProducts] = useState<Product[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);


    // const handleTableClick = useCallback((event: MouseEvent) => {
    //     const target = event.target as HTMLElement;

    //     // Find the select button element
    //     const selectBtn = target.closest('[data-action="select"], [data-action="remove"]') as HTMLElement;

    //     if (selectBtn) {
    //         const id = selectBtn.dataset.id;
    //         const productName = selectBtn.dataset.name;
    //         const productPrice = parseFloat(selectBtn.dataset.price);
    //         const productDescription = selectBtn.dataset.desc;

    //         // Retrieve the current selected products from localStorage
    //         const storedProducts = localStorage.getItem('include_prod_selected_products');
    //         const selectedProducts = storedProducts ? JSON.parse(storedProducts) : [];

    //         // Check if the product ID is already selected
    //         const productIndex = selectedProducts.findIndex(product => product.id === Number(id));

    //         if (productIndex > -1) {
    //             // If it is selected, remove it
    //             const productQuantity = selectedProducts[productIndex].quantity;

    //             selectedProducts.splice(productIndex, 1);
    //             selectBtn.dataset.action = 'select';
    //             selectBtn.className = 'btn btn-primary btn-sm';
    //             selectBtn.innerText = 'Select';

    //             updateTotalPrice(productPrice * productQuantity, '-');
    //         } else {
    //             // If it is not selected, add it
    //             selectedProducts.push({
    //                 id: Number(id),
    //                 name: productName,
    //                 quantity: 1,
    //                 visibility: true,
    //                 price: productPrice,
    //                 description: productDescription,
    //                 supply: true,
    //                 install: true,
    //             });
    //             selectBtn.dataset.action = 'remove';
    //             selectBtn.className = 'btn btn-danger btn-sm';
    //             selectBtn.innerText = 'Remove';

    //             updateTotalPrice(productPrice, '+');

    //         }

    //         // Save the updated array back to localStorage
    //         localStorage.setItem('include_prod_selected_products', JSON.stringify(selectedProducts));

    //         // TODO Update the product-list
    //         updateSelectedProducts(selectedProducts);
    //     }
    // }, [selectedProducts, updateSelectedProducts]);

    useEffect(() => {

        initProductTable(1, 10, '', null, '');

    }, []);

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

    const totalPages = Math.ceil(totalItems / size);

    const handleSelectProduct = (button: HTMLButtonElement) => {
        // Find the select button element
        const selectBtn = button.closest('[data-action="select"], [data-action="remove"]') as HTMLElement;

        if (selectBtn) {
            const id = selectBtn.dataset.id;
            const productName = selectBtn.dataset.name;
            const SKU = selectBtn.dataset.sku;
            const productPrice = parseFloat(selectBtn.dataset.price);
            const productDescription = selectBtn.dataset.desc;

            // Retrieve the current selected products from localStorage
            const storedProducts = localStorage.getItem('include_prod_selected_products');
            const selectedProducts = storedProducts ? JSON.parse(storedProducts) : [];

            // Check if the product ID is already selected
            const productIndex = selectedProducts.findIndex(product => product.id === Number(id));

            if (productIndex > -1) {
                // If it is selected, remove it
                const productQuantity = selectedProducts[productIndex].quantity;

                selectedProducts.splice(productIndex, 1);
                selectBtn.dataset.action = 'select';
                selectBtn.className = 'btn btn-primary btn-sm';
                selectBtn.innerText = 'Select';

                updateTotalPrice(productPrice * productQuantity, '-');
            } else {
                // If it is not selected, add it
                selectedProducts.push({
                    id: Number(id),
                    name: productName,
                    SKU: SKU,
                    quantity: 1,
                    visibility: true,
                    price: productPrice,
                    description: productDescription,
                    supply: true,
                    install: true,
                });
                selectBtn.dataset.action = 'remove';
                selectBtn.className = 'btn btn-danger btn-sm';
                selectBtn.innerText = 'Remove';

                updateTotalPrice(productPrice, '+');

            }

            // Save the updated array back to localStorage
            localStorage.setItem('include_prod_selected_products', JSON.stringify(selectedProducts));

            // TODO Update the product-list
            updateSelectedProducts(selectedProducts);
        }
    }

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="include_product_modal">
                <div className="modal-content modal-center-y max-w-[900px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Add Product into Package</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            {...(previousModalId
                                ? { 'data-modal-toggle': `#${previousModalId}` }
                                : { 'data-modal-dismiss': 'true' }
                            )}
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body p-0 pb-5 ">
                        <div className="flex mb-2">
                            <label className="input input-lg">
                                <i className="ki-filled ki-magnifier"></i>
                                <input
                                    placeholder="Search products"
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="modal-table overflow-y-auto scrollable-y max-h-[400px]">
                        <table className="table align-middle text-gray-700 font-medium text-sm">
                            <thead>
                                <tr>
                                    <th
                                        className='text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Name {getSortIcon('name')}
                                        </div>
                                    </th>
                                    <th
                                        className='min-w-[150px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('pm_category_id')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Category {getSortIcon('pm_category_id')}
                                        </div>
                                    </th>
                                    <th
                                        className='min-w-[150px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('type')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Product Type {getSortIcon('type')}
                                        </div>
                                    </th>
                                    <th
                                        className='min-w-[120px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('price')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Selling Price {getSortIcon('price')}
                                        </div>
                                    </th>
                                    <th className='min-w-[120px] text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? (
                                    products.map((product, prodIndex) => {
                                        const selectedProductsString = localStorage.getItem('include_prod_selected_products');
                                        const selectedProducts = selectedProductsString ? JSON.parse(selectedProductsString) : [];

                                        const isSelected = selectedProducts.some((selProd: { id: number }) => selProd.id === product.id);

                                        const buttonClass = isSelected ? 'btn-danger' : 'btn-primary';
                                        const action = isSelected ? 'remove' : 'select';
                                        const buttonText = isSelected ? 'Remove' : 'Select';

                                        return (
                                            <tr
                                                key={prodIndex}
                                                className={`${prodIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                            >
                                                <td>
                                                    <div className="flex flex-col">
                                                        <span>{product.name}</span>
                                                        <span className="text-xs text-slate-500 font-semibold">SKU: {product.SKU || '-'}</span>
                                                        <span className="text-xs text-slate-400">{product.description || ''}</span>
                                                    </div>
                                                </td>
                                                <td className='text-center capitalize'>{product.pm_category}</td>
                                                <td className='text-center capitalize'>
                                                    {product.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                                </td>
                                                <td className='text-center'>
                                                    <div className="flex flex-col justify-center items-center">
                                                        <span>RM {product.provisioning.supply.retail_price + product.provisioning.install.retail_price}</span>
                                                    </div>
                                                </td>
                                                <td className='text-center'>
                                                    <div className="flex justify-around gap-2">
                                                        <button
                                                            ref={buttonRef}
                                                            className={`btn ${buttonClass} btn-sm`}
                                                            data-action={action}
                                                            data-id={product.id}
                                                            data-sku={product.SKU}
                                                            data-price={product.provisioning.supply.retail_price + product.provisioning.install.retail_price}
                                                            data-name={product.name}
                                                            data-desc={product.description}
                                                            // Pass current button into handleSelectProduct
                                                            onClick={(e) => handleSelectProduct(e.target)}
                                                        >
                                                            {buttonText}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
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
                    <div className="modal-footer justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
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
        </>
    );
}

export default IncludeProductModal;