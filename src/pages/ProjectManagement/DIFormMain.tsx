import React, { useEffect, useRef, useState } from 'react'
import { DefectInspectionForm } from '../../types';
import { Slide, toast } from 'react-toastify';
import ClipboardJS from 'clipboard';
import { fetchDIForms } from '../../services/api';
import Loading from '../../components/Loading';
import { Link } from 'react-router-dom';

type SortOrder = 'asc' | 'desc' | null;

function DIFormMain() {

    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [diForms, setDiForms] = useState<DefectInspectionForm[]>([]); // Initialize as an empty array
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
        document.title = "Purchase Orders | RenoXpert";
        initPOTable(1, 10, '', null, '');

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        // Cleanup the ClipboardJS instance
        return () => {
            clipboard.destroy();
        };
    }, []);

    const initPOTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await fetchDIForms(size, page, searchTerm, order, field);

            const data = response?.data || [];
            setDiForms(data);

            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            setError('Failed to load purchase orders');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initPOTable(page, size, searchTerm, sortOrder, sortField);
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
                const response = await fetchDIForms(size, 1, value, sortOrder, sortField);

                const data = response?.data || [];
                setDiForms(data);
                setTotalItems(response?.totalCount || 0);
            } catch (error) {
                console.error('Error searching defect inspection forms:', error);
                setError('Failed to search defect inspection forms');
            } finally {
                setIsLoading(false);
            }

        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        initPOTable(newPage, size, searchTerm, sortOrder, sortField);
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
                initPOTable(page, size, searchTerm, 'asc', field);
            } else if (sortOrder === 'asc') {
                setSortOrder('desc');
                initPOTable(page, size, searchTerm, 'desc', field);
            } else {
                setSortOrder(null);
                setSortField('');
                initPOTable(page, size, searchTerm, null, '');
            }
        } else {
            // New field, start with ascending
            setSortField(field);
            setSortOrder('asc');
            initPOTable(page, size, searchTerm, 'asc', field);
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


    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Defect Inspection Forms
                    </span>
                    <div className="flex gap-3 flex-wrap">

                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">
                            DI Forms Overview
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
                                        placeholder="Search di forms"
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
                                    <th className='w-[100px]'>Condo</th>
                                    <th className='w-[100px]'>Owner</th>
                                    <th className='w-[60px] text-center'>Status</th>
                                    <th className='w-[100px]'>Submitted by</th>
                                    <th className='w-[100px]'>Submitted at</th>
                                    <th className='w-[100px] text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {diForms.length > 0 ? (
                                    diForms.map((diForm, index) => (
                                        <tr
                                            key={index}
                                            className={`${index % 2 === 0 ? '' : 'bg-gray-100'}`}
                                        >
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold mb-1">{diForm.property.property_name}</span>
                                                    <span className="badge badge-xs text-md text-gray-600 mb-2">
                                                        {diForm.property.block}-{diForm.property.level}-{diForm.property.unit}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    {diForm.reno_progress ?
                                                        <>
                                                            <span>{diForm.reno_progress.sale.order.user.name}</span>
                                                            <span className="text-xs text-slate-400">{diForm.reno_progress.sale.order.user.email}</span>
                                                            <span className="text-xs text-slate-700">+{diForm.reno_progress.sale.order.user.country_code} {diForm.reno_progress.sale.order.user.phone_no}</span>
                                                        </>
                                                        :
                                                        '-'
                                                    }
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                {diForm.status}
                                            </td>
                                            <td>
                                                {diForm.contractor_name ? diForm.contractor_name : 'N/A'}
                                            </td>
                                            <td>
                                                {diForm.status === 'completed' || diForm.status === 'submitted' ? diForm.updated_at : 'N/A'}
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex justify-around gap-2">
                                                    <div className="dropdown" data-dropdown="true"
                                                        data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                                                        <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                                                            <i className="ki-filled ki-dots-vertical"></i>
                                                        </button>
                                                        <div className="dropdown-content menu menu-default w-full max-w-64 py-2"
                                                            data-dropdown-dismiss="true">
                                                            {diForm.reno_progress &&
                                                                <>
                                                                    <div className="menu-item">
                                                                        <Link
                                                                            to={'/reno-progress/' + diForm.reno_progress_id + '/defect-inspection-report'}
                                                                            state={{ fromUrl: location.pathname }}
                                                                            className="menu-link"
                                                                        >
                                                                            <span className="menu-title">
                                                                                <div className="flex gap-2 items-center">
                                                                                    <i className="ki-outline ki-magnifier"></i>
                                                                                    <span>View</span>
                                                                                </div>
                                                                            </span>
                                                                        </Link>
                                                                    </div>
                                                                    <div className="menu-item">
                                                                        <Link
                                                                            to={'/reno-progress/' + diForm.reno_progress_id}
                                                                            state={{ fromUrl: location.pathname }}
                                                                            className="menu-link"
                                                                        >
                                                                            <span className="menu-title">
                                                                                <div className="flex gap-2 items-center">
                                                                                    <i className="ki-outline ki-magnifier"></i>
                                                                                    <span>View Reno Progress</span>
                                                                                </div>
                                                                            </span>
                                                                        </Link>
                                                                    </div>
                                                                </>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center text-gray-500">
                                            No purchase orders available
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
            </div>
        </>
    )
}

export default DIFormMain