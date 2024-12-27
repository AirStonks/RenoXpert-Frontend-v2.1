// src\components\Modals\IncludeQuotationProductModal.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { Package, Product } from "../../types";
import { fetchProduct, fetchProducts, productIndex } from "../../services/api";
import { KTDataTable } from "../../metronic/core";
import Loading from "../Loading";

interface IncludeQuotationProductModalProps {
    updateSelectedPackages: (prodPackages: Package[]) => void;
    isFromOrderQuotation: boolean;
}

type SortOrder = 'asc' | 'desc' | null;

function IncludeQuotationProductModal({ updateSelectedPackages, isFromOrderQuotation }: IncludeQuotationProductModalProps) {
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

    useEffect(() => {
        initProductTable(page, size, searchTerm, sortOrder, sortField);

    }, [page, size, searchTerm, sortOrder, sortField]);


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
            localStorage.setItem('products_data', JSON.stringify(data));
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

    const totalPages = Math.ceil(totalItems / size);

    const handleSelectProduct = async (button: HTMLButtonElement) => {
        // Find the select button element
        const selectBtn = button.closest('[data-action="select"], [data-action="remove"]') as HTMLElement;

        if (selectBtn) {
            const prodId = selectBtn.dataset.id;
            const packId = selectBtn.dataset.packid;
            const productName = selectBtn.dataset.name;
            const SKU = selectBtn.dataset.sku;
            const productPrice = parseFloat(selectBtn.dataset.price);
            const productDescription = selectBtn.dataset.desc;

            // Retrieve current selected products from localStorage
            const storedProducts = localStorage.getItem('include_quotation_pack_prods');
            const selectedProducts = storedProducts ? JSON.parse(storedProducts) : [];

            // Check if the product ID is already selected
            const productIndex = selectedProducts.findIndex(product => product.id === Number(prodId));

            const productResponse = await fetchProduct(Number(prodId));
            const product = productResponse.data;

            if (productIndex > -1) {
                // Remove selected product
                selectedProducts.splice(productIndex, 1);
                selectBtn.dataset.action = 'select';
                selectBtn.className = 'btn btn-primary btn-sm';
                selectBtn.innerText = 'Select';

                if (product) {
                    // Get selected quotation packages from localStorage
                    const storedPackages = localStorage.getItem('selected_quotation_packages');
                    const selectedPackages = storedPackages ? JSON.parse(storedPackages) : [];

                    console.log('Selected Package: ', selectedPackages);

                    const selectedPackage = selectedPackages.find(prodPackage => prodPackage.id === Number(packId));

                    // Filter out the item that id is match with prodId
                    if (selectedPackage) {
                        const filteredProducts = selectedPackage.products.filter(product => product.id !== Number(prodId));
                        selectedPackage.products = filteredProducts;

                        // Update the package in selectedPackages
                        const packageIndex = selectedPackages.findIndex(prodPackage => prodPackage.id === Number(packId));
                        if (packageIndex > -1) {
                            selectedPackages[packageIndex] = selectedPackage;
                        }

                        // Save updated packages to localStorage
                        localStorage.setItem('selected_quotation_packages', JSON.stringify(selectedPackages));
                    }
                }

            } else {
                // Check if product already exists and update quantity if needed
                const existingProduct = selectedProducts.find(product => product.id === Number(prodId));
                if (existingProduct) {
                    existingProduct.quantity += 1; // Update quantity
                } else {
                    // Add new product
                    selectedProducts.push({
                        id: Number(prodId),
                        name: productName,
                        SKU: SKU,
                        quantity: 1,
                        price: productPrice,
                        description: productDescription
                    });
                }
                selectBtn.dataset.action = 'remove';
                selectBtn.className = 'btn btn-danger btn-sm';
                selectBtn.innerText = 'Remove';

                if (product) {
                    console.log(product);

                    product['pivot'] = {
                        package_id: packId,
                        product_id: prodId,
                        quantity: 1,
                        included: true,
                        visibility: true,
                        includeSupply: true,
                        includeInstall: true,
                        isOriginal: !isFromOrderQuotation,
                    };

                    // Get selected quotation packages from localStorage
                    const storedPackages = localStorage.getItem('selected_quotation_packages');
                    const selectedPackages = storedPackages ? JSON.parse(storedPackages) : [];

                    console.log('Selected Package: ', selectedPackages);

                    const selectedPackage = selectedPackages.find(prodPackage => prodPackage.id === Number(packId));

                    // Check if the selected package exists
                    if (selectedPackage) {
                        // Check if the product already exists in the package
                        const existingProduct = selectedPackage.products.find(prod => prod.id === Number(prodId));

                        if (!existingProduct) {
                            // If the product doesn't exist, add it to the package
                            selectedPackage.products.push(product);

                            // Update the package in selectedPackages
                            const packageIndex = selectedPackages.findIndex(prodPackage => prodPackage.id === Number(packId));
                            if (packageIndex > -1) {
                                selectedPackages[packageIndex] = selectedPackage;
                            }

                            // Save updated packages to localStorage
                            localStorage.setItem('selected_quotation_packages', JSON.stringify(selectedPackages));
                        } else {
                            console.log('Product already exists in the package.');
                        }
                    } else {
                        console.log('Selected package not found.');
                    }
                }
            }

            // Save updated products to localStorage
            // console.log(JSON.stringify(selectedProducts));

            const selectedPackages = localStorage.getItem('selected_quotation_packages');

            console.log('NEW: ', JSON.parse(selectedPackages));



            updateSelectedPackages(JSON.parse(selectedPackages));

            localStorage.setItem('include_quotation_pack_prods', JSON.stringify(selectedProducts));
        }
    }

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="include_pack_prod_modal">
                <div className="modal-content modal-center-y max-w-[800px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Add Product into Package</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss='true'
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
                                    <th className='text-center'>Product</th>
                                    <th className='min-w-[150px] text-center'>Category</th>
                                    <th className='min-w-[120px] text-center'>Selling Price</th>
                                    <th className='min-w-[120px] text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? (
                                    products.map((product, prodIndex) => {
                                        const selectedProductsString = localStorage.getItem('selected_quotation_packages');
                                        const selectedPackageId = localStorage.getItem('quotation:selected_package_id');
                                        let btn = false;

                                        // Parse selected products from localStorage
                                        const selectedProducts: Product[] = (() => {
                                            try {
                                                const parsed = selectedProductsString ? JSON.parse(selectedProductsString) : [];
                                                // Find products for the current package
                                                const currentPackage = parsed.find(pkg => pkg.id === Number(selectedPackageId));
                                                return currentPackage?.products || [];
                                            } catch (error) {
                                                console.error('Error parsing selected products:', error);
                                                return [];
                                            }
                                        })();

                                        console.log(selectedProducts);


                                        // Check if the current product is selected
                                        const isSelected = selectedProducts.some(prod => prod.id === product.id);

                                        // Check if the product is original and should not display the button
                                        if (isFromOrderQuotation) {
                                            const isOriginal = selectedProducts.some(prod => prod.id === product.id && prod.pivot.isOriginal);
                                            if (isOriginal) {
                                                btn = true; // Return an empty string if the product is original
                                            }
                                        }

                                        // Determine button classes and text based on selection state
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
                                                <td className='text-center'>
                                                    <div className="flex flex-col justify-center items-center">
                                                        <span>RM {product.provisioning.supply.retail_price + product.provisioning.install.retail_price}</span>
                                                    </div>
                                                </td>
                                                <td className='text-center'>
                                                    <div className="flex justify-around gap-2">
                                                        {!btn && (
                                                            <button
                                                                ref={buttonRef}
                                                                className={`btn ${buttonClass} btn-sm`}
                                                                data-action={action}
                                                                data-id={product.id}
                                                                data-packId={selectedPackageId}
                                                                data-sku={product.SKU}
                                                                data-price={product.provisioning.supply.retail_price + product.provisioning.install.retail_price}
                                                                data-name={product.name}
                                                                data-desc={product.description}
                                                                // Pass current button into handleSelectProduct
                                                                onClick={(e) => handleSelectProduct(e.target)}
                                                            >
                                                                {buttonText}
                                                            </button>
                                                        )}
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

export default IncludeQuotationProductModal;