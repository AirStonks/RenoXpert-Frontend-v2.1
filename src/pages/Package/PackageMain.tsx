import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Package } from '../../types';
import { packageIndex, removePackage } from '../../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import DeleteModal from '../../components/Modals/DeleteModal';
import React from 'react';
import {
    ChevronDownIcon,
    ChevronUpIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    ListBulletIcon,
} from '@heroicons/react/24/solid';

type SortOrder = 'asc' | 'desc';
type FilterCategory = 'All' | 'renovation' | 'partition' | 'carpentry' | 'furniture' | 'electrical_appliances' | 'air_conditioning' | 'smart_iot' | 'project_management' | 'loose_items' | 'others';
type SortField = 'name' | 'created_at' | 'updated_at';
type ViewMode = 'card' | 'list';

const categoryOptions = [
    { value: 'renovation', label: 'Renovation' },
    { value: 'partition', label: 'Partition' },
    { value: 'carpentry', label: 'Carpentry' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'electrical_appliances', label: 'Electrical Appliances' },
    { value: 'air_conditioning', label: 'Air Conditioning' },
    { value: 'smart_iot', label: 'Smart IoT' },
    { value: 'project_management', label: 'Project Management' },
    { value: 'loose_items', label: 'Loose Items' },
    { value: 'others', label: 'Others' },
];

function PackageMain() {
    const navigate = useNavigate();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    interface StoredConfig {
        page: number;
        size: number;
        searchTerm: string;
        sortField: SortField;
        sortOrder: SortOrder;
        filterCategory: FilterCategory;
        viewMode: ViewMode;
        expiresAt: number;
    }

    const getInitialState = (): StoredConfig => {
        const savedState = localStorage.getItem('packageMainConfig');
        const defaultState: StoredConfig = {
            page: 1,
            size: 10,
            searchTerm: '',
            sortField: 'name',
            sortOrder: 'asc',
            filterCategory: 'All',
            viewMode: 'list',
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };

        if (savedState) {
            const parsedState: StoredConfig = JSON.parse(savedState);
            const currentTime = Date.now();

            if (currentTime > parsedState.expiresAt) {
                localStorage.removeItem('packageMainConfig');
                return defaultState;
            }
            return parsedState;
        }
        return defaultState;
    };

    const [packages, setPackages] = useState<Package[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(getInitialState().page);
    const [size, setSize] = useState<number>(getInitialState().size);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>(getInitialState().searchTerm);
    const [sortField, setSortField] = useState<SortField>(getInitialState().sortField);
    const [sortOrder, setSortOrder] = useState<SortOrder>(getInitialState().sortOrder);
    const [filterCategory, setFilterCategory] = useState<FilterCategory>(getInitialState().filterCategory);
    const [viewMode, setViewMode] = useState<ViewMode>(getInitialState().viewMode);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<{ id: number | string; name: string } | null>(null);

    const notify = (type: 'success' | 'error', message: string) => {
        toast[type](message, {
            position: 'top-center',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme') || 'light',
        });
    };

    useEffect(() => {
        const config: StoredConfig = {
            page,
            size,
            searchTerm,
            sortField,
            sortOrder,
            filterCategory,
            viewMode,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
        localStorage.setItem('packageMainConfig', JSON.stringify(config));
    }, [page, size, searchTerm, sortField, sortOrder, filterCategory, viewMode]);

    useEffect(() => {
        document.title = 'Packages | RenoXpert';
        fetchPackages(page, size, searchTerm, sortOrder, sortField, filterCategory);
    }, []);

    const fetchPackages = async (
        page: number,
        size: number,
        searchTerm: string,
        order: SortOrder,
        field: SortField,
        category: FilterCategory
    ) => {
        try {
            setIsLoading(true);
            const response = await packageIndex(size, page, searchTerm, order, field, true);
            let data = response?.data || [];
            setPackages(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching packages:', error);
            setError('Failed to load packages');
            notify('error', 'Failed to load packages');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setPage(1);
        await fetchPackages(1, size, searchTerm, sortOrder, sortField, filterCategory);
        notify('success', 'Packages refreshed');
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);
            await fetchPackages(1, size, value, sortOrder, sortField, filterCategory);
        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        fetchPackages(newPage, size, searchTerm, sortOrder, sortField, filterCategory);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1);
        fetchPackages(1, newSize, searchTerm, sortOrder, sortField, filterCategory);
    };

    const handleSortChange = (field: SortField) => {
        const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
        fetchPackages(page, size, searchTerm, newOrder, field, filterCategory);
    };

    const handleFilterChange = (category: FilterCategory) => {
        setFilterCategory(category);
        setPage(1);
        fetchPackages(1, size, searchTerm, sortOrder, sortField, category);
    };

    const toggleRowExpansion = (id: number) => {
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'card' ? 'list' : 'card');
        setExpandedRows([]);
    };

    const handleRemovePackage = async (pkgId: number) => {
        try {
            const response = await removePackage(pkgId);
            if (response?.success) {
                notify('success', 'Package removed successfully');
                fetchPackages(page, size, searchTerm, sortOrder, sortField, filterCategory);
                return { success: true };
            }
            notify('error', 'Package removal failed');
            return { success: false };
        } catch (error) {
            notify('error', 'Package removal failed');
            return { success: false, message: 'Package removal failed' };
        }
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        const [day, month, year] = date.split('/').map(Number);
        const dateObj = new Date(year, month - 1, day);
        if (isNaN(dateObj.getTime())) return '-';
        return dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const totalPages = Math.ceil(totalItems / size);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-6 z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Package Overview</h1>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search packages..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-10 pr-4 py-2 w-full md:w-64 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => handleFilterChange(e.target.value as FilterCategory)}
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="All">All Categories</option>
                            {categoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={sortField}
                            onChange={(e) => handleSortChange(e.target.value as SortField)}
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="name">Name</option>
                            <option value="created_at">Created Date</option>
                            <option value="updated_at">Updated Date</option>
                        </select>
                        <button
                            onClick={handleRefresh}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={toggleViewMode}
                            className={`p-2 rounded-lg transition ${viewMode === 'card' ? 'bg-gray-200 text-gray-800' : 'bg-blue-500 text-white'} hover:bg-opacity-80`}
                            title={viewMode === 'card' ? 'Switch to List View' : 'Switch to Card View'}
                        >
                            {viewMode === 'card' ? (
                                <ListBulletIcon className="h-5 w-5" />
                            ) : (
                                <Squares2X2Icon className="h-5 w-5" />
                            )}
                        </button>
                        <Link
                            to="/packages/create"
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            Add New Package
                        </Link>
                        <Link
                            to="/packages/archives"
                            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            Archived Zone
                        </Link>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
                    <p>{error}</p>
                    <button onClick={handleRefresh} className="mt-2 underline hover:text-red-900">
                        Try Again
                    </button>
                </div>
            )}

            {/* Content: Card or List View */}
            {viewMode === 'card' ? (
                // Card View
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        // Skeleton Loader
                        Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md animate-pulse"
                            >
                                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-full mb-2"></div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                            </div>
                        ))
                    ) : packages.length > 0 ? (
                        packages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-teal-500/20 transform hover:scale-105 transition cursor-pointer"
                            >
                                <div className="block">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                                {pkg.name}
                                            </h2>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleRowExpansion(Number(pkg.id))}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            aria-label={expandedRows.includes(Number(pkg.id)) ? 'Collapse details' : 'Expand details'}
                                        >
                                            {expandedRows.includes(Number(pkg.id)) ? (
                                                <ChevronUpIcon className="h-5 w-5" />
                                            ) : (
                                                <ChevronDownIcon className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{pkg.description || '-'}</p>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                        <p>
                                            <strong>Price:</strong> RM{' '}
                                            {pkg.total_price.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                        <p>
                                            <strong>Category:</strong>{' '}
                                            {pkg.category
                                                ? categoryOptions.find((option) => option.value === pkg.category)?.label
                                                : '-'}
                                        </p>
                                        <p>
                                            <strong>Add-on Package:</strong> {pkg.is_addon ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <Link
                                            to={`/packages/${pkg.id}`}
                                            className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>

                                {/* Collapsible Details */}
                                {expandedRows.includes(Number(pkg.id)) && (
                                    <div className="mt-4 animate-fade-in" aria-expanded="true">
                                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Details</h3>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            <p>
                                                <strong>Internal Description:</strong> {pkg.description_internal || '-'}
                                            </p>
                                            <p>
                                                <strong>Add-on Package:</strong> {pkg.is_addon ? 'Yes' : 'No'}
                                            </p>
                                            <p>
                                                <strong>Created By:</strong> {pkg.created_by ? pkg.created_by.name : '-'}
                                            </p>
                                            <p>
                                                <strong>Created At:</strong> {formatDate(pkg.created_at)}
                                            </p>
                                            <p>
                                                <strong>Updated By:</strong> {pkg.updated_by ? pkg.updated_by.name : '-'}
                                            </p>
                                            <p>
                                                <strong>Updated At:</strong> {formatDate(pkg.updated_at)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
                            No packages available
                        </div>
                    )}
                </div>
            ) : (
                // List View
                <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-700">
                        <thead className="bg-gray-50 text-gray-800 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 w-12"></th>
                                <th
                                    className="w-[250px] px-4 py-3 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSortChange('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Name
                                        {sortField === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="w-[250px] px-4 py-3">Internal Description</th>
                                <th className="w-[120px] px-4 py-3">Price</th>
                                <th className="w-[80px] px-4 py-3">Category</th>
                                <th className="w-[80px] px-4 py-3 whitespace-nowrap text-center">Add-on Package</th>
                                <th className="w-[100px] px-4 py-3">Created By</th>
                                <th className="w-[100px] px-4 py-3">Updated By</th>
                                <th className="w-[80px] px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                // Skeleton Loader for List
                                Array.from({ length: 6 }).map((_, index) => (
                                    <tr key={index} className="border-b animate-pulse">
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-6"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-40"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : packages.length > 0 ? (
                                packages.map((pkg) => (
                                    <React.Fragment key={pkg.id}>
                                        <tr className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => toggleRowExpansion(Number(pkg.id))}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    {expandedRows.includes(Number(pkg.id)) ? (
                                                        <ChevronUpIcon className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{pkg.name}</span>
                                                    <span className="text-xs text-gray-500">{pkg.description || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{pkg.description_internal || '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                RM{' '}
                                                {pkg.total_price.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                            <td className="px-4 py-3">
                                                {pkg.category
                                                    ? categoryOptions.find((option) => option.value === pkg.category)?.label
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-block h-3 w-3 rounded-full ${pkg.is_addon
                                                            ? 'bg-green-500 dark:bg-green-400'
                                                            : 'bg-gray-300 dark:bg-gray-600'
                                                        }`}
                                                    title={pkg.is_addon ? 'Add-on Package' : 'Not an Add-on Package'}
                                                ></span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{pkg.created_by ? pkg.created_by.name : '-'}</span>
                                                    <span className="text-xs text-gray-500">{formatDate(pkg.created_at)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{pkg.updated_by ? pkg.updated_by.name : '-'}</span>
                                                    <span className="text-gray-500">{formatDate(pkg.updated_at)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-4">
                                                    <Link
                                                        to={`/packages/${pkg.id}`}
                                                        className="text-blue-500 hover:underline"
                                                    >
                                                        View
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRows.includes(Number(pkg.id)) && (
                                            <tr className="border-b">
                                                <td colSpan={9} className="px-6 py-4">
                                                    <div
                                                        className="bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ease-in-out animate-fade-in"
                                                        aria-expanded="true"
                                                    >
                                                        <h3 className="text-base font-semibold text-gray-800 mb-4">Details</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <p className="font-medium text-gray-700">Internal Description</p>
                                                                <p className="text-gray-600">{pkg.description_internal || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Add-on Package</p>
                                                                <p className="text-gray-600">{pkg.is_addon ? 'Yes' : 'No'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Created By</p>
                                                                <p className="text-gray-600">{pkg.created_by ? pkg.created_by.name : '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Created At</p>
                                                                <p className="text-gray-600">{formatDate(pkg.created_at)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Updated By</p>
                                                                <p className="text-gray-600">{pkg.updated_by ? pkg.updated_by.name : '-'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Updated At</p>
                                                                <p className="text-gray-600">{formatDate(pkg.updated_at)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-4 py-3 text-center text-gray-500">
                                        No packages available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!isLoading && packages.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between mt-6 bg-white p-4 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 mb-4 md:mb-0">
                        <span>Show</span>
                        <select
                            value={size}
                            onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                            className="border rounded-lg px-3 py-1"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="30">30</option>
                            <option value="50">50</option>
                        </select>
                        <span>per page</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>
                            {(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => handlePageChange(page - 1)}
                                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                                const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
                                const currentPage = startPage + index;
                                return (
                                    <button
                                        key={currentPage}
                                        onClick={() => handlePageChange(currentPage)}
                                        className={`px-3 py-1 border rounded-lg ${page === currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                                    >
                                        {currentPage}
                                    </button>
                                );
                            })}
                            <button
                                disabled={page === totalPages}
                                onClick={() => handlePageChange(page + 1)}
                                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PackageMain;