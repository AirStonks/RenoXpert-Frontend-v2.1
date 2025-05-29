import React, { useEffect, useRef, useState } from 'react';
import { RenoProgress } from '../../types';
import { toast } from 'react-toastify';
import { renoProgressIndex } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
    ChevronDownIcon,
    ChevronUpIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    ListBulletIcon,
} from '@heroicons/react/24/solid';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

type SortOrder = 'asc' | 'desc';
type FilterStatus = 'All' | 'Completed' | 'Delayed' | 'On Track';
type SortField = 'property.name' | 'overall_completion' | 'contractual_end_date' | 'id';
type ViewMode = 'card' | 'list';

function PMMain() {
    const navigate = useNavigate();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [renoProgress, setRenoProgress] = useState<RenoProgress[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<SortField>('id');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [expandedSections, setExpandedSections] = useState<{
        [key: string]: { keyDates: boolean; progress: boolean };
    }>({});

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
        fetchProjects(1, size, searchTerm, sortOrder, sortField, filterStatus);
    }, []);

    const fetchProjects = async (
        page: number,
        size: number,
        searchTerm: string,
        order: SortOrder,
        field: SortField,
        status: FilterStatus
    ) => {
        try {
            setIsLoading(true);
            const response = await renoProgressIndex(size, page, searchTerm, order, field);
            let data = response?.data || [];

            // Client-side status filtering
            if (status !== 'All') {
                // In fetchProjects function
                data = data.filter((progress: RenoProgress) => getStatus(progress) === status);
            }

            setRenoProgress(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError('Failed to load projects');
            notify('error', 'Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setPage(1);
        await fetchProjects(1, size, searchTerm, sortOrder, sortField, filterStatus);
        notify('success', 'Projects refreshed');
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);
            await fetchProjects(1, size, value, sortOrder, sortField, filterStatus);
        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        fetchProjects(newPage, size, searchTerm, sortOrder, sortField, filterStatus);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1);
        fetchProjects(1, newSize, searchTerm, sortOrder, sortField, filterStatus);
    };

    const handleSortChange = (field: SortField) => {
        const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
        fetchProjects(page, size, searchTerm, newOrder, field, filterStatus);
    };

    const handleFilterChange = (status: FilterStatus) => {
        setFilterStatus(status);
        setPage(1);
        fetchProjects(1, size, searchTerm, sortOrder, sortField, status);
    };

    const toggleRowExpansion = (id: string | undefined) => {
        if (!id) return;
        const numericId = Number(id);
        setExpandedRows((prev) =>
            prev.includes(numericId) ? prev.filter((rowId) => rowId !== numericId) : [...prev, numericId]
        );
        setExpandedSections((prev) => ({
            ...prev,
            [id]: { keyDates: true, progress: true },
        }));
    };

    const toggleSection = (id: string | undefined, section: 'keyDates' | 'progress') => {
        if (!id) return; // Guard against undefined
        setExpandedSections((prev) => ({
            ...prev,
            [id]: {
                ...prev[id],
                [section]: !prev[id]?.[section],
            },
        }));
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'card' ? 'list' : 'card');
        setExpandedRows([]); // Reset expanded rows when switching views
    };

    const getStatus = (progress: RenoProgress) => {
        const overallCompletion =
            (progress.pre_reno_completion * 0.2 +
                progress.p1_completion * 0.175 +
                progress.p2a_completion * 0.175 +
                progress.p2b_completion * 0.175 +
                progress.iot_completion * 0.175 +
                progress.post_reno_completion * 0.1) * 100;

        if (overallCompletion >= 100) return 'Completed';

        const isDelayed = [
            progress.contractual_end_date &&
            progress.contractor_end_date &&
            new Date(progress.contractor_end_date) > new Date(progress.contractual_end_date),
            progress.contractual_p1_end_date &&
            progress.contractor_p1_end_date &&
            new Date(progress.contractor_p1_end_date) > new Date(progress.contractual_p1_end_date),
            progress.contractual_qc_end_date &&
            progress.contractor_qc_end_date &&
            new Date(progress.contractor_qc_end_date) > new Date(progress.contractual_qc_end_date),
            progress.contractual_handover_date &&
            progress.contractor_handover_date &&
            new Date(progress.contractor_handover_date) > new Date(progress.contractual_handover_date),
        ].some(Boolean);

        return isDelayed ? 'Delayed' : 'On Track';
    };

    const formatDate = (date: string | null) =>
        date
            ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '-';

    const getOverallCompletion = (progress: RenoProgress) =>
        (progress.pre_reno_completion * 0.2 +
            progress.p1_completion * 0.175 +
            progress.p2a_completion * 0.175 +
            progress.p2b_completion * 0.175 +
            progress.iot_completion * 0.175 +
            progress.post_reno_completion * 0.1) *
        100;

    const totalPages = Math.ceil(totalItems / size);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-6 z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Project Dashboard</h1>
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
                            <option value="Completed">Completed</option>
                            <option value="Delayed">Delayed</option>
                            <option value="On Track">On Track</option>
                        </select>
                        <select
                            value={sortField}
                            onChange={(e) => handleSortChange(e.target.value as SortField)}
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="property.name">Property Name</option>
                            <option value="overall_completion">Overall Completion</option>
                            <option value="contractual_end_date">Permit Approval</option>
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
                    ) : renoProgress.length > 0 ? (
                        renoProgress.map((progress) => (
                            <div
                                key={progress.id}
                                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-teal-500/20 transform hover:scale-105 transition cursor-pointer"
                            >
                                <Link
                                    to={LOCAL_PATH_PREFIX + `reno-progress/${progress.id}`}
                                    className="block"
                                    aria-label={`View details for ${progress.property.name}`}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2 py-1 rounded-full text-sm font-medium ${getStatus(progress) === 'Completed'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : getStatus(progress) === 'Delayed'
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                    }`}
                                            >
                                                {getStatus(progress)}
                                            </span>
                                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                                {progress.property.name}
                                            </h2>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                toggleRowExpansion(progress.id);
                                            }}
                                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            aria-label={expandedRows.includes(Number(progress.id)) ? 'Collapse details' : 'Expand details'}
                                        >
                                            {expandedRows.includes(Number(progress.id)) ? (
                                                <ChevronUpIcon className="h-5 w-5" />
                                            ) : (
                                                <ChevronDownIcon className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="mb-4 bg-teal-50 dark:bg-teal-900/50 p-3 rounded-lg">
                                        <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">
                                            Overall Completion
                                        </p>
                                        <div
                                            className="relative w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 animate-pulse-once"
                                            aria-label={`Primary: Overall completion ${getOverallCompletion(progress).toFixed(2)}%`}
                                        >
                                            <div
                                                className="absolute top-0 left-0 h-full bg-teal-500 rounded-full"
                                                style={{ width: `${getOverallCompletion(progress)}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-teal-700 dark:text-teal-300 mt-1 block">
                                            {getOverallCompletion(progress).toFixed(2)}%
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                        {progress.property.block}-{progress.property.floor}-{progress.property.unit_no}
                                    </p>
                                    <div className="mb-4">
                                        <Link
                                            to={LOCAL_PATH_PREFIX + `sales/${progress.sale_id}`}
                                            state={{ fromUrl: LOCAL_PATH_PREFIX + 'reno-progress/overview' }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-orange-500 hover:underline dark:text-orange-400 dark:hover:text-orange-300"
                                        >
                                            Sale #{progress.sales_no}
                                        </Link>
                                        <div className="relative w-[75%] bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-blue-300 rounded-full"
                                                style={{ width: `${100 - progress.remaining_percentage * 100}%` }}
                                            ></div>
                                            <div
                                                className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                                                style={{ width: `${progress.paid_percentage * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs text-blue-600 dark:text-blue-400">
                                                Issued: {(100 - progress.remaining_percentage * 100).toFixed(2)}%
                                            </span>
                                            <span className="text-xs text-green-600 dark:text-green-400">
                                                Paid: {(progress.paid_percentage * 100).toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        <p>
                                            <strong>Owner:</strong>{' '}
                                            {progress.sale.order.user
                                                ? `${progress.sale.order.user.name} (${progress.sale.order.user.email})`
                                                : '-'}
                                        </p>
                                    </div>
                                </Link>

                                {/* Collapsible Details */}
                                {expandedRows.includes(Number(progress.id)) && (
                                    <div className="mt-4 animate-fade-in" aria-expanded="true">
                                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Key Dates</h3>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p>
                                                    <strong>Permit Approval:</strong>
                                                </p>
                                                <p className="text-orange-600 dark:text-orange-400">
                                                    {formatDate(progress.contractual_end_date)}
                                                </p>
                                                <p className="text-blue-600 dark:text-blue-400">
                                                    {formatDate(progress.contractor_end_date)}
                                                </p>
                                            </div>
                                            <div>
                                                <p>
                                                    <strong>P1 End:</strong>
                                                </p>
                                                <p className="text-orange-600 dark:text-orange-400">
                                                    {formatDate(progress.contractual_p1_end_date)}
                                                </p>
                                                <p className="text-blue-600 dark:text-blue-400">
                                                    {formatDate(progress.contractor_p1_end_date)}
                                                </p>
                                            </div>
                                            <div>
                                                <p>
                                                    <strong>QC End:</strong>
                                                </p>
                                                <p className="text-orange-600 dark:text-orange-400">
                                                    {formatDate(progress.contractual_qc_end_date)}
                                                </p>
                                                <p className="text-blue-600 dark:text-blue-400">
                                                    {formatDate(progress.contractor_qc_end_date)}
                                                </p>
                                            </div>
                                            <div>
                                                <p>
                                                    <strong>Handover:</strong>
                                                </p>
                                                <p className="text-orange-600 dark:text-orange-400">
                                                    {formatDate(progress.contractual_handover_date)}
                                                </p>
                                                <p className="text-blue-600 dark:text-blue-400">
                                                    {formatDate(progress.contractor_handover_date)}
                                                </p>
                                            </div>
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-4 mb-2">
                                            Progress
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            {progress.rpm_version === 3 ? (
                                                progress.completion?.jobs ? (
                                                    [
                                                        ...progress.completion.jobs.map((job) => ({
                                                            label: job.job_name,
                                                            value: job.completion_percentage,
                                                        }))
                                                    ].map(({ label, value }) => (
                                                        <div key={label} className="flex items-center gap-2">
                                                            <span className="w-24 text-gray-700 dark:text-gray-300 whitespace-nowrap">{label}:</span>
                                                            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                                <div
                                                                    className="bg-green-500 h-full rounded-full"
                                                                    style={{ width: `${value * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs text-gray-600 dark:text-gray-300">
                                                                {(value * 100).toFixed(2)}%
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-gray-600 dark:text-gray-300">No job data available</div>
                                                )
                                            ) : (
                                                [
                                                    { label: 'Pre-Reno', value: progress.pre_reno_completion },
                                                    { label: 'P1', value: progress.p1_completion },
                                                    { label: 'P2-A', value: progress.p2a_completion },
                                                    { label: 'P2-B', value: progress.p2b_completion },
                                                    { label: 'IOT', value: progress.iot_completion },
                                                    { label: 'Post-Reno', value: progress.post_reno_completion },
                                                    {
                                                        label: 'Overall',
                                                        value: getOverallCompletion(progress) / 100,
                                                    },
                                                ].map(({ label, value }) => (
                                                    <div key={label} className="flex items-center gap-2">
                                                        <span className="w-24 text-gray-700 dark:text-gray-300">{label}:</span>
                                                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                            <div
                                                                className="bg-green-500 h-full rounded-full"
                                                                style={{ width: `${value * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-gray-600 dark:text-gray-300">
                                                            {(value * 100).toFixed(2)}%
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
                            No projects available
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
                                    onClick={() => handleSortChange('property.name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Condo
                                        {sortField === 'property.name' && (
                                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-3">Payment Progress</th>
                                <th className="px-4 py-3">Owner</th>
                                <th
                                    className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSortChange('overall_completion')}
                                >
                                    <div className="flex items-center gap-1">
                                        Overall Completion
                                        {sortField === 'overall_completion' && (
                                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-3">Version</th>
                                <th className="px-4 py-3">Details</th>
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
                                            <div className="h-2 bg-gray-200 rounded w-24"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 rounded w-40"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-2 bg-gray-200 rounded w-16"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : renoProgress.length > 0 ? (
                                renoProgress.map((progress) => (
                                    <React.Fragment key={progress.id}>
                                        <tr className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleRowExpansion(progress.id);
                                                    }}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    {expandedRows.includes(Number(progress.id)) ? (
                                                        <ChevronUpIcon className="h-5 w-5" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatus(progress) === 'Completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : getStatus(progress) === 'Delayed'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                        }`}
                                                >
                                                    {getStatus(progress)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{progress.property.name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {progress.property.block}-{progress.property.floor}-{progress.property.unit_no}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    to={LOCAL_PATH_PREFIX + `sales/${progress.sale_id}`}
                                                    state={{ fromUrl: LOCAL_PATH_PREFIX + 'reno-progress/overview' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-orange-500 hover:underline"
                                                >
                                                    Sale #{progress.sales_no}
                                                </Link>
                                                <div className="relative w-[75%] bg-gray-200 rounded-full h-2 mt-1">
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-blue-300 rounded-full"
                                                        style={{ width: `${100 - progress.remaining_percentage * 100}%` }}
                                                    ></div>
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                                                        style={{ width: `${progress.paid_percentage * 100}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-xs text-blue-600">
                                                        {(100 - progress.remaining_percentage * 100).toFixed(2)}%
                                                    </span>
                                                    <span className="text-xs text-green-600">
                                                        {(progress.paid_percentage * 100).toFixed(2)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    {progress.sale.order.user ? (
                                                        <>
                                                            <span className="font-medium">{progress.sale.order.user.name}</span>
                                                            <span className="text-xs text-gray-500">{progress.sale.order.user.email}</span>
                                                        </>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {progress.rpm_version === 3 ? (
                                                    <>
                                                        <div className="relative w-[75%] bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                                                                style={{ width: `${progress.completion.overall_completion * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs">{(progress.completion.overall_completion * 100).toFixed(2)}%</span>
                                                    </>
                                                ) :
                                                    <>
                                                        <div className="relative w-[75%] bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                                                                style={{ width: `${getOverallCompletion(progress)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs">{getOverallCompletion(progress).toFixed(2)}%</span>
                                                    </>
                                                }
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`badge badge-xs badge-outline cursor-default ${progress.rpm_version === 3
                                                        ? 'bg-gradient-to-r from-gray-200 to-yellow-300 font-bold shadow-2xl border-yellow-200 rounded-full uppercase px-3 py-1.5 text-slate-500'
                                                        : ''
                                                        }`}
                                                >
                                                    v{progress.rpm_version}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    to={LOCAL_PATH_PREFIX + `reno-progress/${progress.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    Details
                                                </Link>
                                            </td>
                                        </tr>
                                        {expandedRows.includes(Number(progress.id)) && (
                                            <tr className="border-b">
                                                <td colSpan={7} className="px-6 py-4">
                                                    <div
                                                        className="bg-white rounded-lg shadow-sm p-6 transition-all duration-300 ease-in-out animate-fade-in"
                                                        aria-expanded="true"
                                                    >
                                                        {/* Key Dates Section */}
                                                        <div className="mb-6">
                                                            <button
                                                                onClick={() => toggleSection(progress.id, 'keyDates')}
                                                                className="flex items-center justify-between w-full text-base font-semibold text-gray-800 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                                                aria-label={expandedSections[progress.id]?.keyDates ? 'Collapse Key Dates' : 'Expand Key Dates'}
                                                            >
                                                                <span>Key Dates</span>
                                                                {expandedSections[progress.id]?.keyDates ? (
                                                                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                                                                )}
                                                            </button>
                                                            {expandedSections[progress.id]?.keyDates && (
                                                                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm transition-all duration-200">
                                                                    <div>
                                                                        <p className="font-medium text-gray-700">Permit Approval</p>
                                                                        <p className="text-orange-600">{formatDate(progress.contractual_end_date)}</p>
                                                                        <p className="text-blue-600">{formatDate(progress.contractor_end_date)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-700">P1 End</p>
                                                                        <p className="text-orange-600">{formatDate(progress.contractual_p1_end_date)}</p>
                                                                        <p className="text-blue-600">{formatDate(progress.contractor_p1_end_date)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-700">QC End</p>
                                                                        <p className="text-orange-600">{formatDate(progress.contractual_qc_end_date)}</p>
                                                                        <p className="text-blue-600">{formatDate(progress.contractor_qc_end_date)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-700">Handover</p>
                                                                        <p className="text-orange-600">{formatDate(progress.contractual_handover_date)}</p>
                                                                        <p className="text-blue-600">{formatDate(progress.contractor_handover_date)}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Progress Section */}
                                                        <div>
                                                            <button
                                                                onClick={() => toggleSection(progress.id, 'progress')}
                                                                className="flex items-center justify-between w-full text-base font-semibold text-gray-800 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                                                aria-label={expandedSections[progress.id]?.progress ? 'Collapse Progress' : 'Expand Progress'}
                                                            >
                                                                <span>Progress</span>
                                                                {expandedSections[progress.id]?.progress ? (
                                                                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                                                                ) : (
                                                                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                                                                )}
                                                            </button>
                                                            {expandedSections[progress.id]?.progress && (
                                                                <div className="mt-4 space-y-3 text-sm">
                                                                    {progress.rpm_version === 3 ? (
                                                                        progress.completion?.jobs ? (
                                                                            [
                                                                                ...progress.completion.jobs.map((job) => ({
                                                                                    label: job.job_name,
                                                                                    value: job.completion_percentage,
                                                                                }))
                                                                            ].map(({ label, value }) => (
                                                                                <div key={label} className="flex items-center gap-3 group">
                                                                                    <span className="w-32 font-medium text-gray-700 whitespace-nowrap">{label}:</span>
                                                                                    <div className="flex-1 relative">
                                                                                        <div className="bg-gray-200 rounded-full h-3">
                                                                                            <div
                                                                                                className="bg-teal-500 h-full rounded-full transition-all duration-300 group-hover:shadow-md"
                                                                                                style={{ width: `${value * 100}%` }}
                                                                                            ></div>
                                                                                        </div>
                                                                                        <div className="absolute top-[-2rem] left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                                                            {(value * 100).toFixed(2)}%
                                                                                        </div>
                                                                                    </div>
                                                                                    <span className="w-12 text-xs text-gray-600">{(value * 100).toFixed(2)}%</span>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <div className="text-gray-600">No job data available</div>
                                                                        )
                                                                    ) : (
                                                                        [
                                                                            { label: 'Pre-Reno', value: progress.pre_reno_completion },
                                                                            { label: 'P1', value: progress.p1_completion },
                                                                            { label: 'P2-A', value: progress.p2a_completion },
                                                                            { label: 'P2-B', value: progress.p2b_completion },
                                                                            { label: 'IOT', value: progress.iot_completion },
                                                                            { label: 'Post-Reno', value: progress.post_reno_completion },
                                                                            {
                                                                                label: 'Overall',
                                                                                value: getOverallCompletion(progress) / 100,
                                                                            },
                                                                        ].map(({ label, value }) => (
                                                                            <div key={label} className="flex items-center gap-3 group">
                                                                                <span className="w-20 font-medium text-gray-700">{label}:</span>
                                                                                <div className="flex-1 relative">
                                                                                    <div className="bg-gray-200 rounded-full h-3">
                                                                                        <div
                                                                                            className="bg-teal-500 h-full rounded-full transition-all duration-300 group-hover:shadow-md"
                                                                                            style={{ width: `${value * 100}%` }}
                                                                                        ></div>
                                                                                    </div>
                                                                                    <div className="absolute top-[-2rem] left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                                                                        {(value * 100).toFixed(2)}%
                                                                                    </div>
                                                                                </div>
                                                                                <span className="w-12 text-xs text-gray-600">{(value * 100).toFixed(2)}%</span>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                                        No projects available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table >
                </div >
            )
            }

            {/* Pagination */}
            {
                !isLoading && renoProgress.length > 0 && (
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
                )
            }
        </div >


        // <div className="flex justify-between items-center flex-wrap mb-6">
        //     <div className="flex gap-4 items-center">
        //         <span className="text-2xl font-bold text-gray-900">
        //             Project Management
        //         </span>
        //     </div>
        //     {/* <div className="flex">
        //         <label className="switch flex justify-center">
        //             <input
        //                 name="advanceTableMode"
        //                 type="checkbox"
        //                 checked={advanceTableMode}
        //                 onChange={toggleTableMode}
        //             />
        //             <span className="text-gray-900">
        //                 Switch to Advance Table Mode
        //             </span>
        //         </label>
        //     </div> */}
        // </div>

        // <PMTable />
    );
}

export default PMMain;