import React, { useEffect, useState } from 'react'
import { RenoProgress } from '../../../types';
import { toast } from 'react-toastify';
import { renoProgressIndex } from '../../../services/api';
import Loading from '../../../components/Loading';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

type SortOrder = 'asc' | 'desc' | null;

function PMTable() {
    const navigate = useNavigate();

    const [renoProgress, setRenoProgress] = useState<RenoProgress[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    useEffect(() => {
        initRenoProgressTable(1, 10, '', null, '');
    }, []);

    const initRenoProgressTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await renoProgressIndex(size, page, searchTerm, order, field);
            const data = response?.data || [];
            setRenoProgress(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching renoProgress:', error);
            setError('Failed to load renoProgress');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initRenoProgressTable(page, size, searchTerm, sortOrder, sortField);
    };

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        try {
            setIsLoading(true);
            const response = await renoProgressIndex(size, page, value);

            const data = response?.data || [];
            setRenoProgress(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error searching renoProgress:', error);
            setError('Failed to search renoProgress');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        initRenoProgressTable(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size
        initRenoProgressTable(1, newSize, searchTerm, sortOrder, sortField);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Cycle through states: null -> asc -> desc -> null
            if (sortOrder === null) {
                setSortOrder('asc');
                initRenoProgressTable(page, size, searchTerm, 'asc', field);
            } else if (sortOrder === 'asc') {
                setSortOrder('desc');
                initRenoProgressTable(page, size, searchTerm, 'desc', field);
            } else {
                setSortOrder(null);
                setSortField('');
                initRenoProgressTable(page, size, searchTerm, null, '');
            }
        } else {
            // New field, start with ascending
            setSortField(field);
            setSortOrder('asc');
            initRenoProgressTable(page, size, searchTerm, 'asc', field);
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

    const toProgressDetail = (id: number) => {
        navigate(`/reno-progress/${id}`);
    }

    const totalPages = Math.ceil(totalItems / size);

    return (
        <>
            {isLoading && <Loading />}

            {renoProgress.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            Project Overview
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
                                        placeholder="Search Unit/Property"
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
                                        className='w-[100px] text-center cursor-pointer hover:bg-gray-50'
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Condo
                                        </div>
                                    </th>
                                    <th
                                        className='w-[100px] text-center cursor-pointer hover:bg-gray-50'
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Payment Progress
                                        </div>
                                    </th>
                                    <th className='w-[120px]'>
                                        <div className="flex items-center justify-center gap-2">
                                            Owner
                                        </div>
                                    </th>
                                    <th
                                        className='w-[100px] text-center cursor-pointer hover:bg-gray-50'
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Owner Schedule
                                        </div>
                                    </th>
                                    <th
                                        className='w-[100px] text-center cursor-pointer hover:bg-gray-50'
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Sub Contractor Schedule
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Pre-Reno
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            P1
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            P2-A
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            P2-B
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            IOT
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Post-Reno
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Overall Completion
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {renoProgress.length > 0 ? (
                                    renoProgress.map((progress, progressIndex) => (
                                        <tr
                                            key={progressIndex}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => toProgressDetail(Number(progress.id))}
                                        >
                                            <td className="text-center">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold mb-1">{progress.property.name}</span>
                                                    <span className="badge badge-xs text-md text-gray-600 mb-2">
                                                        {progress.property.block}-{progress.property.floor}-{progress.property.unit_no}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <Link
                                                    to={'/sales/' + progress.sale_id}
                                                    state={{ fromUrl: '/reno-progress/overview' }}
                                                    onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                                    className="link text-orange-500"
                                                >
                                                    {progress.sales_no}
                                                </Link>
                                                <div className="w-full bg-gray-200 rounded-full h-[8px] my-2 relative overflow-hidden">
                                                    {/* Issued progress bar (outer) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                                        style={{
                                                            width: `${100 - progress.remaining_percentage * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />

                                                    {/* Paid progress bar (inner) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.paid_percentage * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex gap-2 justify-center">
                                                    <span className="text-xs badge badge-sm badge-pill badge-outline border-blue-200 bg-blue-50 text-blue-400">{(100 - (progress.remaining_percentage * 100)).toFixed(2)}%</span>
                                                    <span className="text-xs badge badge-sm badge-pill badge-outline badge-success">{(progress.paid_percentage * 100).toFixed(2)}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    {progress.sale.order.user ?
                                                        <>
                                                            <span>{progress.sale.order.user.name}</span>
                                                            <span className="text-xs text-slate-400">{progress.sale.order.user.email}</span>
                                                            <span className="text-xs text-slate-700">+{progress.sale.order.user.country_code} {progress.sale.order.user.phone_no}</span>
                                                        </>
                                                        :
                                                        '-'
                                                    }
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm text-gray-900">
                                                        {progress.contractual_start_date
                                                            ? new Date(progress.contractual_start_date).toLocaleDateString('en-GB', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })
                                                            : '-'}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        to
                                                    </span>
                                                    <span className="text-sm text-gray-900">
                                                        {progress.contractual_end_date
                                                            ? new Date(progress.contractual_end_date).toLocaleDateString('en-GB', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })
                                                            : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm text-gray-900">
                                                        {progress.contractor_start_date
                                                            ? new Date(progress.contractor_start_date).toLocaleDateString('en-GB', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })
                                                            : '-'}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        to
                                                    </span>
                                                    <span className="text-sm text-gray-900">
                                                        {progress.contractor_end_date
                                                            ? new Date(progress.contractor_end_date).toLocaleDateString('en-GB', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })
                                                            : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                    {/* Issued progress bar (outer) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                                        style={{
                                                            width: `${(progress.pre_reno_completion * 100)}%`,
                                                            height: '8px'
                                                        }}
                                                    />

                                                    {/* Paid progress bar (inner) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.pre_reno_completion * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs">{(progress.pre_reno_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                    {/* Issued progress bar (outer) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.p1_completion * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />

                                                    {/* Paid progress bar (inner) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.p1_completion * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs">{(progress.p1_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                    {/* Issued progress bar (outer) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.p2a_completion * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />

                                                    {/* Paid progress bar (inner) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.p2a_completion * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs">{(progress.p2a_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                    {/* Issued progress bar (outer) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.p2b_completion * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />

                                                    {/* Paid progress bar (inner) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.p2b_completion * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs">{(progress.p2b_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                    {/* Issued progress bar (outer) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.iot_completion * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />

                                                    {/* Paid progress bar (inner) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.iot_completion * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs">{(progress.iot_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                    {/* Issued progress bar (outer) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.post_reno_completion * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />

                                                    {/* Paid progress bar (inner) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                        style={{
                                                            width: `${progress.post_reno_completion * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs">{(progress.post_reno_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                    {/* Paid progress bar (inner) */}
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                        style={{
                                                            width: `${((progress.pre_reno_completion * 0.2) + (progress.p1_completion * 0.175) + (progress.p2a_completion * 0.175) + (progress.p2b_completion * 0.175) + (progress.iot_completion * 0.175) + (progress.post_reno_completion * 0.1)) * 100}%`,
                                                            height: '8px'
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs">{(((progress.pre_reno_completion * 0.2) + (progress.p1_completion * 0.175) + (progress.p2a_completion * 0.175) + (progress.p2b_completion * 0.175) + (progress.iot_completion * 0.175) + (progress.post_reno_completion * 0.1)) * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={12} className="text-center text-gray-500">
                                            No Project available
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
            )}
        </>
    )
}

export default PMTable