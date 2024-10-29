// src\components\Modals\IncludeQuotationProductModal.tsx

import { useCallback, useEffect, useState } from "react";
import { Package, Product } from "../../types";
import { fetchProduct, fetchProducts } from "../../services/api";
import { KTDataTable } from "../../metronic/core";

interface IncludeQuotationProductModalProps {
    updateSelectedPackages: (prodPackages: Package[]) => void;
    isFromOrderQuotation: boolean;
}

function IncludeQuotationProductModal({ updateSelectedPackages, isFromOrderQuotation }: IncludeQuotationProductModalProps) {

    useEffect(() => {
        getProducts();
        initProdTable();
    }, []);

    const handleTableClick = useCallback(async (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const selectBtn = target.closest('[data-action="select"], [data-action="remove"]') as HTMLElement;

        if (selectBtn) {
            const prodId = selectBtn.dataset.id;
            const packId = selectBtn.dataset.packid;
            const productName = selectBtn.dataset.name;
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

            
            updateSelectedPackages(JSON.parse(selectedPackages));
            
            localStorage.setItem('include_quotation_pack_prods', JSON.stringify(selectedProducts));
        }
    }, [updateSelectedPackages]);

    const getProducts = async () => {
        const response = await fetchProducts();

        if (response) {
            localStorage.setItem('products_data', JSON.stringify(response.data));
        }
    };

    const initProdTable = () => {
        const apiUrl = 'http://' + window.location.hostname + ':8000/api/products';
        const datatableEl = document.querySelector('#products_table') as HTMLElement;
        const token = localStorage.getItem('token');

        const options = {
            apiEndpoint: apiUrl,
            requestMethod: 'GET',
            requestHeaders: {
                'Authorization': `Bearer ${token}`,
            },
            pageSize: 5,
            pageSizes: [5, 10],
            columns: {
                name: {
                    title: 'Product',
                    render: (item: string, data: Product) => `
                        <div class="flex flex-col">
                            <span>${item}</span>
                            <span class="text-xs text-slate-400">${data.description}</span>
                        </div>
                    `,
                },
                category: {
                    title: 'Category',
                },
                product_retail_price: {
                    title: 'Price',
                    render: (item: number) => `RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, // Format as currency
                },
                action: {
                    title: 'Action',
                    render: (item: string, data: Product) => {
                        const selectedProductsString = localStorage.getItem('selected_quotation_packages');
                        const selectedPackageId = localStorage.getItem('quotation:selected_package_id');
                        
                        // Parse selected products from localStorage
                        const selectedProducts: Product[] = selectedProductsString ? JSON.parse(selectedProductsString)[0].products : [];
                        
                        // Check if the current product is selected
                        const isSelected = selectedProducts.some(product => product.id === data.id);
                        
                        // Check if the product is original and should not display the button
                        if (isFromOrderQuotation) {
                            const isOriginal = selectedProducts.some(product => product.id === data.id && product.pivot.isOriginal);
                            if (isOriginal) {
                                return ''; // Return an empty string if the product is original
                            }
                        }
                    
                        // Determine button classes and text based on selection state
                        const buttonClass = isSelected ? 'btn-danger' : 'btn-primary';
                        const action = isSelected ? 'remove' : 'select';
                        const buttonText = isSelected ? 'Remove' : 'Select';
                    
                        // Render the button
                        return `
                            <div class="flex justify-around gap-2">
                                <button 
                                    class="btn ${buttonClass} btn-sm"
                                    data-action="${action}"
                                    data-packId="${selectedPackageId}"
                                    data-id="${data.id}"
                                    data-name="${data.name}"
                                    data-price="${data.product_retail_price}"
                                    data-desc="${data.description}"
                                >
                                    ${buttonText}
                                </button>
                            </div>
                        `;
                    }
                }
            },
        };

        const datatable = new KTDataTable(datatableEl, options);

        if (datatableEl) {
            datatableEl.addEventListener('click', handleTableClick);

            return () => {
                datatableEl.removeEventListener('click', handleTableClick);
            };
        }

        // Cache elements with the data-datatable-search attribute
        // const searchElements = document.querySelectorAll<HTMLInputElement>('[data-datatable-search]');

        // searchElements.forEach((element) => {
        //     // Get the ID of the datatable to be searched
        //     const tableId = element.getAttribute('data-datatable-search');
        //     // Find the corresponding datatable element
        //     const datatable = document.querySelector<HTMLElement>(tableId);

        //     if (datatable) {
        //         // Retrieve the datatable instance once
        //         const dataTableInstance = (datatable as any).instance;

        //         // Add the event listener for the keyup event
        //         element.addEventListener('keyup', () => {
        //             dataTableInstance.search(element.value);
        //         });
        //     }
        // });
    }

    return (
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
                <div className="modal-body p-0 pb-5">

                    <div className="flex mb-2">
                        <label className="input input-lg">
                            <i className="ki-filled ki-magnifier"></i>
                            <input type="text" placeholder="Search Products" data-datatable-search="#products_table" />
                        </label>
                    </div>
                    <div data-datatable="true" data-datatable-page-size="5" data-datatable-state-save="true" id="products_table">
                        <div className="scrollable-x-auto">
                            <table className="table table-auto table-border" data-datatable-table="true">
                                <thead>
                                    <tr>
                                        {/* <th className="w-14">
                                            <input className="checkbox checkbox-sm" data-datatable-check="true" type="checkbox" />
                                        </th> */}
                                        <th className="text-center">
                                            <span className="sort">
                                                <span className="sort-label">
                                                    Product
                                                </span>
                                            </span>
                                        </th>
                                        <th className="min-w-[150px] text-center">
                                            <span className="sort">
                                                <span className="sort-label">
                                                    Category
                                                </span>
                                            </span>
                                        </th>
                                        <th className="min-w-[120px] text-center">
                                            <span className="sort">
                                                <span className="sort-label">
                                                    Price
                                                </span>
                                            </span>
                                        </th>
                                        <th className="min-w-[110px] text-center">

                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Sample data */}
                                </tbody>
                            </table>
                        </div>
                        <div className="card-footer justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
                            <div className="flex items-center gap-2">
                                Show
                                <select className="select select-sm w-16" data-datatable-size="true" name="perpage"></select>
                                per page
                            </div>
                            <div className="flex items-center gap-4">
                                <span data-datatable-info="true"></span>
                                <div className="pagination" data-datatable-pagination="true"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default IncludeQuotationProductModal;