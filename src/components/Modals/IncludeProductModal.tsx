// src\components\Modals\IncludeProductModal.tsx

import { useCallback, useEffect } from "react";
import { KTDataTable } from "../../metronic/core";
import { Product } from "../../types";

interface IncludeProductModalProps {
    selectedProducts: Product[];
    updateSelectedProducts: (products: Product[]) => void;
    updateTotalPrice: (price: number, operator: string) => void;
    previousModalId?: string; // Make this optional
}

function IncludeProductModal({
    selectedProducts,
    updateSelectedProducts,
    updateTotalPrice,
    previousModalId
}: IncludeProductModalProps) {


    const handleTableClick = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // Find the select button element
        const selectBtn = target.closest('[data-action="select"], [data-action="remove"]') as HTMLElement;

        if (selectBtn) {
            const id = selectBtn.dataset.id;
            const productName = selectBtn.dataset.name;
            const productPrice = parseFloat(selectBtn.dataset.price);
            const productDescription = selectBtn.dataset.desc;

            // Retrieve the current selected products from localStorage
            const storedProducts = localStorage.getItem('include_prod_selected_products');
            const selectedProducts = storedProducts ? JSON.parse(storedProducts) : [];

            // Check if the product ID is already selected
            const productIndex = selectedProducts.findIndex(product => product.id === Number(id));

            if (productIndex > -1) {
                // If it is selected, remove it
                selectedProducts.splice(productIndex, 1);
                selectBtn.dataset.action = 'select';
                selectBtn.className = 'btn btn-primary btn-sm';
                selectBtn.innerText = 'Select';
            
                updateTotalPrice(productPrice, '-');
            } else {
                // If it is not selected, add it
                selectedProducts.push({ id: Number(id), name: productName, quantity: 1, visibility: true, price: productPrice, description: productDescription });
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
    }, [selectedProducts, updateSelectedProducts]);

    useEffect(() => {

        initProdTable();

    }, []);

    const initProdTable = () => {
        const apiUrl = 'https://api.renoxpert.my/api/products';
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
                // select: {
                //     render: (item: string, data: Product) => {
                //         const checkbox = document.createElement('input');
                //         checkbox.className = 'checkbox checkbox-sm';
                //         checkbox.type = 'checkbox';
                //         checkbox.value = data.id.toString();
                //         checkbox.setAttribute('data-datatable-row-check', 'true');
                //         return checkbox.outerHTML.trim();
                //     },
                // },
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
                    title: 'Retail Price',
                    render: (item: number) => `RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, // Format as currency
                },
                action: {
                    title: 'Action',
                    render: (item: string, data: Product) => {
                        const selectedProductsString = localStorage.getItem('include_prod_selected_products');
                        const selectedProducts = selectedProductsString ? JSON.parse(selectedProductsString) : [];

                        const isSelected = selectedProducts.some((product: { id: number }) => product.id === data.id);

                        const buttonClass = isSelected ? 'btn-danger' : 'btn-primary';
                        const action = isSelected ? 'remove' : 'select';
                        const buttonText = isSelected ? 'Remove' : 'Select';

                        return `
                            <div class="flex justify-around gap-2">
                                <button 
                                    class="btn ${buttonClass} btn-sm"
                                    data-action="${action}"
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
        const searchElements = document.querySelectorAll<HTMLInputElement>('[data-datatable-search]');

        searchElements.forEach((element) => {
            // Get the ID of the datatable to be searched
            const tableId = element.getAttribute('data-datatable-search');
            // Find the corresponding datatable element
            const datatable = document.querySelector<HTMLElement>(tableId);

            if (datatable) {
                // Retrieve the datatable instance once
                const dataTableInstance = (datatable as any).instance;

                // Add the event listener for the keyup event
                element.addEventListener('keyup', () => {
                    dataTableInstance.search(element.value);
                });
            }
        });
    }

    return (
        <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="include_product_modal">
            <div className="modal-content modal-center-y max-w-[800px]">
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
                                                    Retail Price
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

export default IncludeProductModal;