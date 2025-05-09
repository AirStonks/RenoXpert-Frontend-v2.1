import React, { useEffect, useRef, useState } from 'react';
import { DefectInspectionForm } from '../../types';
import { toast } from 'react-toastify';
import ClipboardJS from 'clipboard';
import { fetchRPMDIForms, generateDIForm } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import AddUnitToDIFModal from './components/Modals/AddUnitToDIFModal';
import {
    ChevronDownIcon,
    ChevronUpIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    ListBulletIcon,
} from '@heroicons/react/24/solid';

type SortOrder = 'asc' | 'desc';
type FilterStatus = 'All' | 'Submitted' | 'Not Submitted';
type SortField = 'property.property_name' | 'submitted_at' | 'id';
type ViewMode = 'card' | 'list';

function DIFormMain() {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const navigate = useNavigate();

    const [diForms, setDiForms] = useState<DefectInspectionForm[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<SortField>('id');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('list');

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
        document.title = 'Defect Inspection Forms | RenoXpert';
        fetchDIFormsData(1, size, searchTerm, sortOrder, sortField, filterStatus);

        const clipboard = new ClipboardJS('.copy-link');
        clipboard.on('success', (e) => {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };
    }, []);

    const fetchDIFormsData = async (
        page: number,
        size: number,
        searchTerm: string,
        order: SortOrder,
        field: SortField,
        status: FilterStatus
    ) => {
        try {
            setIsLoading(true);
            const response = await fetchRPMDIForms(size, page, searchTerm, order, field);
            let data: DefectInspectionForm[] = response?.data || [];

            // Client-side status filtering
            if (status !== 'All') {
                data = data.filter((form: DefectInspectionForm) =>
                    status === 'Submitted' ? !!form.submitted_at : !form.submitted_at
                );
            }

            setDiForms(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching DI forms:', error);
            setError('Failed to load DI forms');
            notify('error', 'Failed to load DI forms');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setPage(1);
        await fetchDIFormsData(1, size, searchTerm, sortOrder, sortField, filterStatus);
        notify('success', 'DI Forms refreshed');
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);
            await fetchDIFormsData(1, size, value, sortOrder, sortField, filterStatus);
        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        fetchDIFormsData(newPage, size, searchTerm, sortOrder, sortField, filterStatus);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1);
        fetchDIFormsData(1, newSize, searchTerm, sortOrder, sortField, filterStatus);
    };

    const handleSortChange = (field: SortField) => {
        const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
        fetchDIFormsData(page, size, searchTerm, newOrder, field, filterStatus);
    };

    const handleFilterChange = (status: FilterStatus) => {
        setFilterStatus(status);
        setPage(1);
        fetchDIFormsData(1, size, searchTerm, sortOrder, sortField, status);
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

    const handleGenerateDIForm = async (formId: number) => {
        setIsLoading(true);
        try {
            const response = await generateDIForm(formId);

            if (response?.success) {
                notify('success', 'DI Form generated successfully!');
                handleRefresh();
            }

        } catch (error) {
            notify('error', 'Failed to generate DI Form');
        } finally {
            setIsLoading(false);
        }
    }

    const formatDate = (date: string | null) =>
        date
            ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '-';

    const totalPages = Math.ceil(totalItems / size);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-6 z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Defect Inspection Forms</h1>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by Unit/Property..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-10 pr-4 py-2 w-full md:w-64 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => handleFilterChange(e.target.value as FilterStatus)}
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="All">All Status</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Not Submitted">Not Submitted</option>
                        </select>
                        <select
                            value={sortField}
                            onChange={(e) => handleSortChange(e.target.value as SortField)}
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="property.property_name">Property Name</option>
                            <option value="submitted_at">Submitted At</option>
                        </select>
                        <button
                            onClick={handleRefresh}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={toggleViewMode}
                            className={`p-2 rounded-lg transition ${viewMode === 'card' ? 'bg-gray-200 text-gray-800' : 'bg-blue-500 text-white'
                                } hover:bg-opacity-80`}
                            title={viewMode === 'card' ? 'Switch to List View' : 'Switch to Card View'}
                        >
                            {viewMode === 'card' ? (
                                <ListBulletIcon className="h-5 w-5" />
                            ) : (
                                <Squares2X2Icon className="h-5 w-5" />
                            )}
                        </button>
                        <button
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            data-modal-toggle="#add-unit-modal"
                        >
                            Add Unit
                        </button>
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
                    ) : diForms.length > 0 ? (
                        diForms.map((diForm) => (
                            <div
                                key={diForm.id}
                                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-teal-500/20 transform hover:scale-105 transition cursor-pointer"
                            >
                                <div className="block">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2 py-1 rounded-full text-sm font-medium ${diForm.submitted_at
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}
                                            >
                                                {diForm.submitted_at ? 'Submitted' : 'Not Submitted'}
                                            </span>
                                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                                {diForm.property.property_name}
                                            </h2>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleRowExpansion(Number(diForm.id))}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            aria-label={expandedRows.includes(Number(diForm.id)) ? 'Collapse details' : 'Expand details'}
                                        >
                                            {expandedRows.includes(Number(diForm.id)) ? (
                                                <ChevronUpIcon className="h-5 w-5" />
                                            ) : (
                                                <ChevronDownIcon className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                        {diForm.property.block}-{diForm.property.level}-{diForm.property.unit}
                                    </p>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                        <p>
                                            <strong>Owner:</strong>{' '}
                                            {diForm.reno_progress?.sale.order.user
                                                ? `${diForm.reno_progress.sale.order.user.name} (${diForm.reno_progress.sale.order.user.email})`
                                                : diForm.owner_email ? diForm.owner_email : '-'}
                                        </p>
                                        <p>
                                            <strong>DI By:</strong>{' '}
                                            {diForm.di_by ? diForm.di_by.charAt(0).toUpperCase() + diForm.di_by.slice(1) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        {(diForm.di_by === 'belive') && (
                                            <>
                                                {diForm.status === 'not_available' && (
                                                    <button
                                                        className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                                        onClick={() => handleGenerateDIForm(Number(diForm.id))}
                                                    >
                                                        Generate DI Form
                                                    </button>
                                                )}
                                                {diForm.status === 'submitted' && (
                                                    <Link
                                                        to={`/di-forms/${diForm.id}`}
                                                        state={{ fromUrl: '/di-forms' }}
                                                        className="text-green-500 hover:underline dark:text-green-400 dark:hover:text-green-300"
                                                    >
                                                        View Report
                                                    </Link>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Collapsible Details */}
                                {expandedRows.includes(Number(diForm.id)) && (
                                    <div className="mt-4 animate-fade-in" aria-expanded="true">
                                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Details</h3>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            <p>
                                                <strong>Submitted At:</strong> {formatDate(diForm.submitted_at)}
                                            </p>
                                            <p>
                                                <strong>Status:</strong>{' '}
                                                {diForm.status.charAt(0).toUpperCase() + diForm.status.slice(1)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
                            No DI forms available
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
                                <th className="px-4 py-3">Status</th>
                                <th
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSortChange('property.property_name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Unit
                                        {sortField === 'property.property_name' && (
                                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-3">Owner</th>
                                <th className="px-4 py-3">DI Parties</th>
                                <th className="px-4 py-3">DI Report</th>
                                <th
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSortChange('submitted_at')}
                                >
                                    <div className="flex items-center gap-1">
                                        Submitted At
                                        {sortField === 'submitted_at' && (
                                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-3">RPM</th>
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
                                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-40"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-24"></div>
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
                            ) : diForms.length > 0 ? (
                                diForms.map((diForm) => (
                                    <React.Fragment key={diForm.id}>
                                        <tr className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => toggleRowExpansion(Number(diForm.id))}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    {expandedRows.includes(Number(diForm.id)) ? (
                                                        <ChevronUpIcon className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${diForm.submitted_at
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {diForm.submitted_at ? 'Submitted' : 'Not Submitted'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{diForm.property.property_name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {diForm.property.block}-{diForm.property.level}-{diForm.property.unit}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    {diForm.reno_progress?.sale.order.user ? (
                                                        <>
                                                            <span className="font-medium">
                                                                {diForm.reno_progress.sale.order.user.name}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {diForm.reno_progress.sale.order.user.email}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                +{diForm.reno_progress.sale.order.user.country_code}{' '}
                                                                {diForm.reno_progress.sale.order.user.phone_no}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="font-medium">
                                                            {diForm.owner_email ? diForm.owner_email : '-'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {diForm.di_by ? diForm.di_by.charAt(0).toUpperCase() + diForm.di_by.slice(1) : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {(diForm.di_by === 'belive') && (
                                                    <>
                                                        {(diForm.status === 'not_available') && (
                                                            <button
                                                                className="text-blue-500 hover:underline"
                                                                onClick={() => handleGenerateDIForm(Number(diForm.id))}
                                                            >
                                                                Generate DI Form
                                                            </button>
                                                        )}
                                                        {(diForm.status === 'submitted' || diForm.status === 'not_submitted') && (
                                                            <Link
                                                                to={`/di-forms/${diForm.id}`}
                                                                state={{ fromUrl: '/di-forms' }}
                                                                className="text-green-500 hover:underline"
                                                            >
                                                                View Report
                                                            </Link>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{formatDate(diForm.submitted_at)}</td>
                                            <td className="px-4 py-3">
                                                {diForm.reno_progress_id && (
                                                    <Link
                                                        to={`/reno-progress/${diForm.reno_progress_id}`}
                                                        state={{ fromUrl: '/di-forms' }}
                                                        className="text-orange-500 hover:underline"
                                                    >
                                                        View RPM
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedRows.includes(Number(diForm.id)) && (
                                            <tr className="border-b">
                                                <td colSpan={8} className="px-6 py-4">
                                                    <div
                                                        className="bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ease-in-out animate-fade-in"
                                                        aria-expanded="true"
                                                    >
                                                        <h3 className="text-base font-semibold text-gray-800 mb-4">Details</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <p className="font-medium text-gray-700">Submitted At</p>
                                                                <p className="text-gray-600">{formatDate(diForm.submitted_at)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Status</p>
                                                                <p className="text-gray-600">
                                                                    {diForm.status.charAt(0).toUpperCase() + diForm.status.slice(1)}
                                                                </p>
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
                                    <td colSpan={8} className="px-4 py-3 text-center text-gray-500">
                                        No DI forms available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!isLoading && diForms.length > 0 && (
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
                                        className={`px-3 py-1 border rounded-lg ${page === currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                                            }`}
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

            <AddUnitToDIFModal refetch={handleRefresh} />
        </div>
    );
}

export default DIFormMain;