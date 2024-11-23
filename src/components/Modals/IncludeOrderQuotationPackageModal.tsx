// src\components\Modals\IncludeProductModal.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import { KTAccordion, KTDataTable } from "../../metronic/core";
import { Package, Product } from "../../types";
import { fetchPackages, packageIndex } from "../../services/api";
import Loading from "../Loading";

interface IncludeOrderQuotationPackageModallProps {
    selectedPackages: Package[];
    updateSelectedPackages: (prodPackages: Package[]) => void;
    previousModalId?: string; // Make this optional
}

type SortOrder = 'asc' | 'desc' | null;

function IncludeOrderQuotationPackageModal({ selectedPackages, updateSelectedPackages, previousModalId }: IncludeOrderQuotationPackageModallProps) {
    const [packages, setPackages] = useState<Package[]>([]); // Initialize as an empty array
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

    //     console.log(target);


    //     // Find the select button element
    //     const selectBtn = target.closest('[data-action="select"], [data-action="remove"]') as HTMLElement;

    //     if (selectBtn) {
    //         const id = selectBtn.dataset.id;
    //         const packageName = selectBtn.dataset.name;
    //         const packagePrice = parseFloat(selectBtn.dataset.price);
    //         const packageDescription = selectBtn.dataset.desc;

    //         // Retrieve the current selected prodPackages from localStorage
    //         const storedPackages = localStorage.getItem('selected_quotation_packages');
    //         const selectedPackages = storedPackages ? JSON.parse(storedPackages) : [];
    //         const packagesData = localStorage.getItem('packages_data');

    //         // Check if the prodPackage ID is already selected
    //         const packageIndex = selectedPackages.findIndex(prodPackage => prodPackage.id === Number(id));

    //         if (packageIndex > -1) {
    //             // If it is selected, remove it
    //             selectedPackages.splice(packageIndex, 1);
    //             // Change button to "Select"
    //             selectBtn.dataset.action = 'select';
    //             selectBtn.className = 'btn btn-primary btn-sm'; // Update class
    //             selectBtn.innerText = 'Select';
    //         } else {
    //             // If it is not selected, add it
    //             const selectedPackage = JSON.parse(packagesData).find(prodPackage => prodPackage.id === Number(id));

    //             selectedPackages.push({
    //                 id: Number(id),
    //                 name: packageName,
    //                 description: packageDescription,
    //                 total_price: packagePrice,
    //                 packages: selectedPackage.packages
    //             });

    //             // selectedPackages.push(selectedPackage);
    //             // Change button to "Remove"
    //             selectBtn.dataset.action = 'remove';
    //             selectBtn.className = 'btn btn-danger btn-sm'; // Update class
    //             selectBtn.innerText = 'Remove';
    //         }


    //         // Save the updated array back to localStorage
    //         localStorage.setItem('selected_quotation_packages', JSON.stringify(selectedPackages));

    //         // TODO Update the prodPackage-list
    //         updateSelectedPackages(selectedPackages);
    //     }
    // }, [selectedPackages, updateSelectedPackages]);

    useEffect(() => {

        initPackageTable(page, size, searchTerm, sortOrder, sortField);

    }, [page, size, searchTerm, sortOrder, sortField]);

    // const getPackages = async () => {
    //     const response = await fetchPackages();

    //     if (response) {
    //         localStorage.setItem('packages_data', JSON.stringify(response.data));
    //     }
    // };

    const initPackageTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await packageIndex(size, page, searchTerm, order, field);
            const data = response?.data || [];

            localStorage.setItem('packages_data', JSON.stringify(data));

            setPackages(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching packages:', error);
            setError('Failed to load packages');
        } finally {
            setIsLoading(false);
            KTAccordion.init();
        }
    };

    // const initProdTable = () => {
    //     const apiUrl = 'http://' + window.location.hostname + ':8000/api/packages';
    //     const datatableEl = document.querySelector('#packages_table') as HTMLElement;
    //     const token = localStorage.getItem('token');

    //     const options = {
    //         apiEndpoint: apiUrl,
    //         requestMethod: 'GET',
    //         requestHeaders: {
    //             'Authorization': `Bearer ${token}`,
    //         },
    //         pageSize: 5,
    //         pageSizes: [5, 10],
    //         columns: {
    //             // select: {
    //             //     render: (item: string, data: Package) => {
    //             //         const checkbox = document.createElement('input');
    //             //         checkbox.className = 'checkbox checkbox-sm';
    //             //         checkbox.type = 'checkbox';
    //             //         checkbox.value = data.id.toString();
    //             //         checkbox.setAttribute('data-datatable-row-check', 'true');
    //             //         return checkbox.outerHTML.trim();
    //             //     },
    //             // },
    //             name: {
    //                 title: 'Package',
    //                 render: (item: string, data: Package) => `
    //                     <div class="flex flex-col">
    //                         <span>${item}</span>
    //                         <span class="text-xs text-slate-400">${data.description}</span>
    //                     </div>
    //                 `,
    //             },
    //             category: {
    //                 title: 'Category',
    //             },
    //             total_price: {
    //                 title: 'Price',
    //                 render: (item: number) => `RM ${item.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, // Format as currency
    //             },
    //             action: {
    //                 title: 'Action',
    //                 render: (item: string, data: Package) => {
    //                     const selectedPackagesString = localStorage.getItem('selected_quotation_packages');
    //                     const selectedPackages = selectedPackagesString ? JSON.parse(selectedPackagesString) : [];

    //                     const isSelected = selectedPackages.some((prodPackage: { id: number }) => prodPackage.id === data.id);

    //                     const buttonClass = isSelected ? 'btn-danger' : 'btn-primary';
    //                     const action = isSelected ? 'remove' : 'select';
    //                     const buttonText = isSelected ? 'Remove' : 'Select';

    //                     return `
    //                         <div class="flex justify-around gap-2">
    //                             <button 
    //                                 class="btn ${buttonClass} btn-sm"
    //                                 data-action="${action}"
    //                                 data-id="${data.id}"
    //                                 data-name="${data.name}"
    //                                 data-price="${data.total_price}"
    //                                 data-desc="${data.description}"
    //                             >
    //                                 ${buttonText}
    //                             </button>
    //                         </div>
    //                     `;
    //                 }
    //             }

    //         },
    //     };

    //     const datatable = new KTDataTable(datatableEl, options);

    //     if (datatableEl) {
    //         datatableEl.addEventListener('click', handleTableClick);

    //         return () => {
    //             datatableEl.removeEventListener('click', handleTableClick);
    //         };
    //     }
    // }

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        try {
            setIsLoading(true);
            const response = await packageIndex(page, size, searchTerm, sortOrder, sortField);
            const data = response?.data || [];

            localStorage.setItem('packages_data', JSON.stringify(data));

            setPackages(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error searching packages:', error);
            setError('Failed to search packages');
        } finally {
            setIsLoading(false);
            KTAccordion.init();
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

    const handleSelectPackage = (button: HTMLButtonElement) => {

        // Find the select button element
        const selectBtn = button.closest('[data-action="select"], [data-action="remove"]') as HTMLElement;

        if (selectBtn) {
            const id = selectBtn.dataset.id;
            const packageName = selectBtn.dataset.name;
            const packagePrice = parseFloat(selectBtn.dataset.price);
            const packageDescription = selectBtn.dataset.desc;

            // Retrieve the current selected prodPackages from localStorage
            const storedPackages = localStorage.getItem('selected_quotation_packages');
            const selectedPackages = storedPackages ? JSON.parse(storedPackages) : [];
            const packagesData = localStorage.getItem('packages_data');

            /// Check if the prodPackage ID is already selected
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
            localStorage.setItem('selected_quotation_packages', JSON.stringify(selectedPackages));

            // TODO Update the prodPackage-list
            updateSelectedPackages(selectedPackages);
        }
    }

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

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
                                <input
                                    placeholder="Search products"
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </label>
                        </div>
                        <div className="mx-2 mb-2 ">
                            <span className="text-xs text-red-600">Note: Removed pkg will not show in the list. To remove the pkg from quotation, close this modal and remove from the list.</span>
                        </div>
                        <div className="modal-table overflow-y-auto scrollable-y max-h-[400px]">
                            <table className="table align-middle text-gray-700 font-medium text-sm">
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
                                                    Packages Count
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
                                    {packages.length > 0 ? (
                                        packages.map((pkg, pkgIndex) => {
                                            const selectedPackagesString = localStorage.getItem('selected_quotation_packages');
                                            const selectedPackages = selectedPackagesString ? JSON.parse(selectedPackagesString) : [];

                                            const isSelected = selectedPackages.some((prodPackage: { id: number }) => prodPackage.id === pkg.id);

                                            const buttonClass = isSelected ? 'btn-danger' : 'btn-primary';
                                            const action = isSelected ? 'remove' : 'select';
                                            const buttonText = isSelected ? 'Remove' : 'Select';

                                            return (
                                                <tr
                                                    key={pkgIndex}
                                                    className={`${pkgIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                                >
                                                    <td>
                                                        <div className="flex flex-col">
                                                            <span>{pkg.name}</span>
                                                            <span className="text-xs text-slate-400">{pkg.description}</span>
                                                        </div>
                                                    </td>
                                                    <td className='text-center capitalize'></td>
                                                    <td className='text-center'>
                                                        {`RM ${pkg.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                    </td>
                                                    <td className='text-center'>
                                                        <div className="flex justify-around gap-2">
                                                            <button
                                                                ref={buttonRef}
                                                                className={`btn ${buttonClass} btn-sm`}
                                                                data-action={action}
                                                                data-id={pkg.id}
                                                                data-name={pkg.name}
                                                                data-price={pkg.total_price}
                                                                data-desc={pkg.description}
                                                                onClick={(e) => handleSelectPackage(e.target)}
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
                                                No packages available
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
            </div>

        </>
    );
}

export default IncludeOrderQuotationPackageModal;