// src\pages\Product\Package\PackageArchive.tsx

import { useNavigate } from 'react-router-dom';
import Button from '../../components/Buttons/Button';
import KTComponent from '../../metronic/core';
import { useEffect, useRef, useState } from 'react';
import { Package } from '../../types';
import { packageIndexArchived, removePackage } from '../../services/api';
import Loading from '../../components/Loading';
import DeleteModal from '../../components/Modals/DeleteModal';
import { Link } from 'react-router-dom';

type SortOrder = 'asc' | 'desc' | null;

function PackageArchive() {
    const navigate = useNavigate();
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

    const [selectedPackage, setSelectedPackage] = useState<{ id: number | string, name: string } | null>(null);

    useEffect(() => {
        document.title = "Packages | RenoXpert";
        KTComponent.init();
        initPackageTable(1, 10, '', null, '');
    }, []);

    const handleBackClick = () => {
        navigate('/packages');
    };

    const initPackageTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await packageIndexArchived(size, page, searchTerm, order, field);

            const data = response?.data || [];
            setPackages(data);

            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching packages:', error);
            setError('Failed to load packages');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initPackageTable(page, size, searchTerm);
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
                const response = await packageIndexArchived(size, 1, value, sortOrder, sortField);

                const data = response?.data || [];
                setPackages(data);
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
        initPackageTable(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size
        initPackageTable(1, newSize, searchTerm, sortOrder, sortField);
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

    const handleViewPackage = (pkgId: string | number) => {
        navigate(`/packages/${pkgId}`);
    }

    const handleRemovePackage = async (pkgId: number) => {
        try {
            const response = await removePackage(pkgId);

            if (response?.success) {
                initPackageTable(page, size);
                return { success: true };
            }
            return { success: false };

        } catch (error) {
            return { success: false, message: 'Package removal failed' };
        }
    }

    const totalPages = Math.ceil(totalItems / size);

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <div className="flex gap-4 items-center">
                        <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                            <i className="ki-solid ki-arrow-left"></i>
                        </button>
                        <span className="text-2xl font-bold text-gray-900">
                            Archived Packages
                        </span>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <Button
                            url='/packages/create'
                            btnText='Add New Package'
                            btnSize='btn-sm'
                            icon='ki-outline ki-plus-squared'
                        />
                        <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                            <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                                <i className="ki-filled ki-dots-vertical"></i>
                            </button>

                            <div className="dropdown-content menu menu-default w-full max-w-56 py-2" data-dropdown-dismiss="true">
                                {/* <div className="menu-item disabled">
                                    <button
                                        className="menu-link"
                                        data-modal-toggle="#archive_product_modal"
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <span>Manage Category</span>
                                            </div>
                                        </span>
                                    </button>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 items-center text-center badge badge-lg badge-pill badge-warning badge-outline">
                    <i className="ki-filled ki-information-4"></i>
                    <span className="font-semibold">You are currently viewing archived items</span>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">
                            Archived Packages
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
                                        placeholder="Search packages"
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
                                    <th
                                        className='w-[200px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Name {getSortIcon('name')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[300px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('description_internal')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Internal Description {getSortIcon('description_internal')}
                                        </div>
                                    </th>
                                    <th className='w-[110px] text-center'>Price</th>
                                    <th className='w-[80px] text-center'>Created By</th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Created Date {getSortIcon('created_at')}
                                        </div>
                                    </th>
                                    <th className='w-[80px] text-center'>Updated By</th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('updated_at')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Updated Date {getSortIcon('updated_at')}
                                        </div>
                                    </th>
                                    <th className='w-[110px] text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {packages.length > 0 ? (
                                    packages.map((pkg, pkgIndex) => (
                                        <tr
                                            key={pkgIndex}
                                            className={`${pkgIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                        >
                                            <td>
                                                <div className="flex flex-col">
                                                    <span>{pkg.name}</span>
                                                    <span className="text-xs text-slate-400">{pkg.description || ''}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {pkg.description_internal}
                                            </td>
                                            <td className='text-center'>
                                                RM {pkg.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className='text-center'>
                                                {pkg.created_by ? pkg.created_by.name : '-'}
                                            </td>
                                            <td className='text-center'>
                                                {pkg.created_at}
                                            </td>
                                            <td className='text-center'>
                                                {pkg.updated_by ? pkg.updated_by.name : '-'}
                                            </td>
                                            <td className='text-center'>
                                                {pkg.updated_at}
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex justify-around gap-2">
                                                    <Link
                                                        to={`/packages/${pkg.id}`}
                                                        state={{ fromUrl: '/packages/archives' }}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        View
                                                    </Link>
                                                    <button
                                                        className="btn-delete btn btn-sm btn-icon btn-danger"
                                                        data-tooltip="#remove_tooltip"
                                                        data-action="delete"
                                                        data-id={pkg.id}
                                                        data-name={pkg.name}
                                                        data-modal-toggle="#delete_item_modal"
                                                        onClick={() => setSelectedPackage({ id: pkg.id, name: pkg.name })}
                                                    >
                                                        <i className="ki-outline ki-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="text-center text-gray-500">
                                            No packages available
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
                {/* <ActivityCenter /> */}

                {/* <PackageTable /> */}
            </div>

            <DeleteModal
                item={selectedPackage}
                modalTitle='Remove Package'
                modalPrompt='Are you sure to permanently remove this package:'
                notifySuccess='Package Removed Successfully!'
                notifyError='Package remove failed'
                navigateUrl='/packages/archives'
                deleteFunction={handleRemovePackage}
            />
        </>
    );
}

export default PackageArchive;