// src\components\Modals\IncludeProductModal.tsx

import { useCallback, useEffect, useState } from "react";
import { KTDataTable } from "../../metronic/core";
import { Package, Product } from "../../types";
import { fetchPackages } from "../../services/api";

interface IncludePackageModalProps {
    selectedPackages: Package[];
    updateSelectedPackages: (prodPackages: Package[]) => void;
    previousModalId?: string; // Make this optional
}

function IncludePackageModal({ selectedPackages, updateSelectedPackages, previousModalId }: IncludePackageModalProps) {

    // const [selectedPackage, setSelectedPackage] = useState({
    //     id: 0,
    //     name: '',
    //     description: '',
    //     total_price: 0,
    //     products: [],
    // });

    const handleTableClick = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // Find the select button element
        const selectBtn = target.closest('[data-action="select"], [data-action="remove"]') as HTMLElement;

        if (selectBtn) {
            const id = selectBtn.dataset.id;
            const packageName = selectBtn.dataset.name;
            const packagePrice = parseFloat(selectBtn.dataset.price);
            const packageDescription = selectBtn.dataset.desc;

            // Retrieve the current selected prodPackages from localStorage
            const storedPackages = localStorage.getItem('include_packages');
            const selectedPackages = storedPackages ? JSON.parse(storedPackages) : [];
            const packagesData = localStorage.getItem('packages_data');
            
            // Check if the prodPackage ID is already selected
            const packageIndex = selectedPackages.findIndex(prodPackage => prodPackage.id === Number(id));

            if (packageIndex > -1) {
                // If it is selected, remove it
                selectedPackages.splice(packageIndex, 1);
                // Change button to "Select"
                selectBtn.dataset.action = 'select';
                selectBtn.className = 'btn btn-primary btn-sm'; // Update class
                selectBtn.innerText = 'Select';
            } else {
                // If it is not selected, add it
                const selectedPackage = JSON.parse(packagesData).find(prodPackage => prodPackage.id === Number(id));

                selectedPackages.push({ 
                    id: Number(id),
                    name: packageName,
                    description: packageDescription,
                    total_price: packagePrice,
                    products: selectedPackage.products
                });

                // selectedPackages.push(selectedPackage);
                // Change button to "Remove"
                selectBtn.dataset.action = 'remove';
                selectBtn.className = 'btn btn-danger btn-sm'; // Update class
                selectBtn.innerText = 'Remove';
            }
            

            // Save the updated array back to localStorage
            localStorage.setItem('include_packages', JSON.stringify(selectedPackages));

            // TODO Update the prodPackage-list
            updateSelectedPackages(selectedPackages);
        }
    }, [selectedPackages, updateSelectedPackages]);

    useEffect(() => {
        getPackages()
        initProdTable();
    }, []);

    const getPackages = async () => {
        const response = await fetchPackages();
        
        if (response) {
            localStorage.setItem('packages_data',  JSON.stringify(response.data));
        }
    };

    const initProdTable = () => {
        const apiUrl = 'http://' + window.location.hostname + ':8000/api/packages';
        const datatableEl = document.querySelector('#packages_table') as HTMLElement;
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
                total_price: {
                    title: 'Price',
                    render: (item: number) => `RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, // Format as currency
                },
                action: {
                    title: 'Action',
                    render: (item: string, data: Package) => {
                        const selectedProductsString = localStorage.getItem('include_packages');
                        const selectedPackages = selectedProductsString ? JSON.parse(selectedProductsString) : [];

                        const isSelected = selectedPackages.some((prodPackage: { id: number }) => prodPackage.id === data.id);

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
                                    data-price="${data.total_price}"
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
        <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="include_package_modal">
            <div className="modal-content modal-center-y max-w-[800px]">
                <div className="modal-header py-4 px-5">
                    <span className="text-lg text-gray-900 font-bold">Add Package into Quotation</span>
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
                            <input type="text" placeholder="Search Products" data-datatable-search="#packages_table" />
                        </label>
                    </div>
                    <div className="mx-2 mb-2 ">
                        <span className="text-xs text-red-600">Note: Removed package will not show in the list. To remove the package from quotation, close this modal and remove from the list.</span>
                    </div>
                    <div data-datatable="true" data-datatable-page-size="5" data-datatable-state-save="true" id="packages_table">
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
                                                    Package
                                                </span>
                                            </span>
                                        </th>
                                        <th className="text-center">
                                            <span className="sort">
                                                <span className="sort-label">
                                                    Products Count
                                                </span>
                                            </span>
                                        </th>
                                        <th className="min-w-[120px] text-center">
                                            <span className="sort">
                                                <span className="sort-label">
                                                    Total Price
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

export default IncludePackageModal;