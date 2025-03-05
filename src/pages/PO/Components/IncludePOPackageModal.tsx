import React, { useEffect, useRef, useState } from 'react'
import { Package, POItem, POPackage, Product } from '../../../types'
import { packageIndex } from '../../../services/api';
import { KTAccordion } from '../../../metronic/core';
import Loading from '../../../components/Loading';

type Props = {
    selectedPOPackages: POPackage[];
    setSelectedPOPackages: React.Dispatch<React.SetStateAction<POPackage[]>>;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    recalculateTotalAmount?: () => void
}

type SortOrder = 'asc' | 'desc' | null;

function IncludePOPackageModal({ setSelectedPOPackages, isOpen, setIsOpen, recalculateTotalAmount }: Props) {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

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

    useEffect(() => {
        initPackageTable(1, 10, '', null, '');
    }, []);

    const initPackageTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await packageIndex(size, page, searchTerm, order, field, false);
            const data = response?.data || [];

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
                const response = await packageIndex(size, 1, value, sortOrder, sortField, false);
                const data = response?.data || [];

                setPackages(data);
                setTotalItems(response?.totalCount || 0);
            } catch (error) {
                console.error('Error searching packages:', error);
                setError('Failed to search packages');
            } finally {
                setIsLoading(false);
                KTAccordion.init();
            }

        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        initPackageTable(newPage, size, searchTerm, sortOrder, sortField);
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
                initPackageTable(page, size, searchTerm, 'asc', field);
            } else if (sortOrder === 'asc') {
                setSortOrder('desc');
                initPackageTable(page, size, searchTerm, 'desc', field);
            } else {
                setSortOrder(null);
                setSortField('');
                initPackageTable(page, size, searchTerm, null, '');
            }
        } else {
            // New field, start with ascending
            setSortField(field);
            setSortOrder('asc');
            initPackageTable(page, size, searchTerm, 'asc', field);
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

    const handleCloseModal = () => {
        setIsOpen(false);
    };

    const handleSelectPackage = (button: HTMLButtonElement) => {
        const selectBtn = button.closest('[data-action="select"], [data-action="remove"]') as HTMLElement;
        if (!selectBtn?.dataset) return;

        const packageData = {
            package_id: selectBtn.dataset.id,
            name: selectBtn.dataset.name || '',
            total_price: parseFloat(selectBtn.dataset.price || '0'),
            description: selectBtn.dataset.desc || '',
            description_internal: selectBtn.dataset.int_desc || '',
            category: selectBtn.dataset.cat || ''
        };

        const selectedPackage = packages.find(pkg => pkg.id === Number(packageData.package_id));
        const poItems: POItem[] = selectedPackage?.products?.map((product: Product) => ({
            product_id: String(product.id),
            product_name: product.name,
            product_desc: product.description || '',
            qty: product.pivot?.quantity || 1,
            supply: true,
            install: true,
            unit_price: (product.provisioning?.supply?.retail_price + product.provisioning?.install?.retail_price) || 0,
            supply_price: product.pivot?.includeSupply ? product.provisioning?.supply?.cogs || 0 : 0,
            install_price: product.pivot?.includeInstall ? product.provisioning?.install?.cogs || 0 : 0,
            total_price: ((product.pivot?.includeSupply ? product.provisioning?.supply?.cogs || 0 : 0) +
                (product.pivot?.includeInstall ? product.provisioning?.install?.cogs || 0 : 0)) *
                (product.pivot?.quantity || 1),
        })) || [];

        setSelectedPOPackages((prevPackages) => {
            const packageExists = prevPackages.some(pkg => pkg.id === packageData.package_id);

            if (packageExists) {
                const updatedPackages = prevPackages.filter(pkg => pkg.id !== packageData.package_id);
                selectBtn.dataset.action = 'select';
                selectBtn.className = 'btn btn-primary btn-sm';
                selectBtn.innerText = 'Select';
                return updatedPackages;
            } else {
                const newPackage: POPackage = {
                    ...packageData,
                    po_items: poItems,
                    quantity: 1,
                };
                selectBtn.dataset.action = 'remove';
                selectBtn.className = 'btn btn-danger btn-sm';
                selectBtn.innerText = 'Remove';
                return [...prevPackages, newPackage];
            }
        });
    };



    return (
        <>
            {/* Loading Overlay */}
            {(isOpen === true && isLoading) && <Loading />}

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="add_package_modal">
                <div className="modal-content modal-center-y max-w-[800px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Add Package into PO</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                            onClick={handleCloseModal}
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
                            <span className="text-xs text-red-600">
                                Note: Removed pkg will not show in the list. To remove the pkg from PO, close this modal and remove from the list.
                            </span>
                        </div>

                        {packages.length > 0 &&
                            <>
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
                                                <th className="text-center">
                                                    <span className="sort">
                                                        <span className="sort-label">
                                                            Internal Description
                                                        </span>
                                                    </span>
                                                </th>
                                                <th
                                                    className='min-w-[120px] text-center cursor-pointer hover:bg-gray-50'
                                                    onClick={() => handleSort('total_price')}
                                                >
                                                    <div className="flex items-center justify-center gap-2">
                                                        Total Price {getSortIcon('total_price')}
                                                    </div>
                                                </th>
                                                <th className="min-w-[110px] text-center">

                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {packages.length > 0 ? (
                                                packages.map((pkg, pkgIndex) => {
                                                    const selectedPackagesString = localStorage.getItem('include_packages');
                                                    const selectedPackages = selectedPackagesString ? JSON.parse(selectedPackagesString) : [];

                                                    const isSelected = selectedPackages.some((prodPackage: { id: number }) => prodPackage.id === pkg.id);

                                                    const buttonClass = isSelected ? 'btn-danger' : 'btn-primary';
                                                    const action = isSelected ? 'remove' : 'select';
                                                    const buttonText = isSelected ? 'Remove' : 'Select';

                                                    const totalCogs = pkg.products.reduce((total, item) => total + item.provisioning.supply.co, 0);

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
                                                            <td>
                                                                {pkg.description_internal}
                                                            </td>
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
                                                                        data-int_desc={pkg.description_internal}
                                                                        data-cat={pkg.category}
                                                                        onClick={(e) => handleSelectPackage(e.currentTarget)}
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
                            </>}
                    </div>
                </div>
            </div>

        </>
    )
}

export default IncludePOPackageModal