// src\pages\Quotation\QuotationMain.tsx

import { useNavigate } from 'react-router-dom';
import Button from '../../components/Buttons/Button';
import { useEffect, useRef, useState } from 'react';
import { Quotation } from '../../types';
import { quotationIndex, removeQuotation } from '../../services/api';
import Loading from '../../components/Loading';
import DeleteModal from '../../components/Modals/DeleteModal';
import { Link } from 'react-router-dom';

type SortOrder = 'asc' | 'desc' | null;

function QuotationMain() {
    const navigate = useNavigate();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [quotations, setQuotations] = useState<Quotation[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);

    const [selectedQuotation, setSelectedQuotation] = useState<{ id: number | string, name: string } | null>(null);
    const [selectedQuotationReadyStatus, setSelectedQuotationReadyStatus] = useState<string | null>(null);

    useEffect(() => {
        document.title = "Quotations | RenoXpert";
        initQuotationTable(1, 10, '', null, '');

        // Cleanup function to clear localStorage on unmount
        return () => {
            localStorage.removeItem('include_packages');
        };
    }, []);

    const toggleStatus = (status: string) => {
        setSelectedQuotationReadyStatus(prevStatus => (prevStatus === status ? null : status));
    };

    const initQuotationTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await quotationIndex(size, page, searchTerm, order, field, true);

            const data = response?.data || [];
            setQuotations(data);

            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching quotations:', error);
            setError('Failed to load quotations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initQuotationTable(page, size, searchTerm, sortOrder, sortField);
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
                const response = await quotationIndex(size, 1, value, sortOrder, sortField, true);

                const data = response?.data || [];
                setQuotations(data);
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
        initQuotationTable(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size
        initQuotationTable(1, newSize, searchTerm, sortOrder, sortField);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Cycle through states: null -> asc -> desc -> null
            if (sortOrder === null) {
                setSortOrder('asc');
                initQuotationTable(page, size, searchTerm, 'asc', field);
            } else if (sortOrder === 'asc') {
                setSortOrder('desc');
                initQuotationTable(page, size, searchTerm, 'desc', field);
            } else {
                setSortOrder(null);
                setSortField('');
                initQuotationTable(page, size, searchTerm, null, '');
            }
        } else {
            // New field, start with ascending
            setSortField(field);
            setSortOrder('asc');
            initQuotationTable(page, size, searchTerm, 'asc', field);
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

    const handleViewQuotation = (quotationId: string | number) => {
        navigate(`/quotations/${quotationId}`);
    }

    const handleRemoveQuotation = async (quotationId: number) => {
        try {
            const response = await removeQuotation(quotationId);

            if (response?.success) {
                initQuotationTable(page, size);
                return { success: true };
            }
            return { success: false };

        } catch (error) {
            console.log(error);
            return { success: false, message: 'Quotation removal failed' };
        }
    }

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Quotation Template Overview
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <Button
                            url='/quotations/create'
                            btnText='Create Quotation'
                            btnSize='btn-sm'
                            icon='ki-outline ki-plus-squared'
                        />
                        <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                            <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                                <i className="ki-filled ki-dots-vertical"></i>
                            </button>

                            <div className="dropdown-content menu menu-default w-full max-w-56 py-2" data-dropdown-dismiss="true">
                                <div className="menu-item">
                                    <Link
                                        to={'/quotations/archives'}
                                        className="menu-link"
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <i className="ki-filled ki-archive"></i>
                                                <span>Archived Zone</span>
                                            </div>
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">
                            Quotation Template Overview
                        </div>
                        <div className="flex flex-wrap gap-2 lg:gap-5 items-center">
                            <div className="flex gap-3 items-center">
                                <span className='text-gray-900 font-medium'>Filter: </span>
                                {/* <button
                                    className="btn btn-sm btn-light rounded-full"
                                    data-drawer-toggle="#drawer_2_4"
                                >
                                    <i className="ki-filled ki-sort"></i>
                                    Sort
                                </button> */}
                                <button
                                    className={`btn btn-sm rounded-full ${selectedQuotationReadyStatus === 'in_progress' ? 'btn-success btn-outline' : 'btn-light'}`}
                                    onClick={() => toggleStatus('in_progress')}
                                >
                                    Ready Only
                                </button>
                                {/* <button
                                    className={`btn btn-sm rounded-full ${selectedProgressStatus === 'done' ? 'btn-success btn-outline' : 'btn-light'}`}
                                    onClick={() => toggleStatus('done')}
                                >
                                    Done
                                    {
                                        selectedProgressStatus === 'done' &&
                                        <i className="ki-filled ki-cross"></i>
                                    }
                                </button> */}
                            </div>
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
                                        placeholder="Search quotations..."
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
                                    <th className='w-[100px] text-center'>Property</th>
                                    <th className='w-[50px] text-center'>Draft/Ready</th>
                                    <th
                                        className='w-[300px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('description')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Description {getSortIcon('description')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[110px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('total_amount')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Total Amount {getSortIcon('total_amount')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Created Date {getSortIcon('created_at')}
                                        </div>
                                    </th>
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
                                {quotations.length > 0 ? (
                                    quotations.map((quotation, quoteIndex) => (
                                        <tr
                                            key={quoteIndex}
                                            className={`${quoteIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                        >
                                            <td>
                                                {quotation.name}
                                            </td>
                                            <td>
                                                {quotation.property ? quotation.property.name : '-'}
                                            </td>
                                            <td className='text-center'>
                                                <label className="switch switch-lg flex justify-center">
                                                    <input
                                                        className="checkbox"
                                                        name="is_ready"
                                                        type="checkbox"
                                                        checked={!!quotation.is_ready}
                                                        readOnly
                                                    />
                                                </label>
                                            </td>
                                            <td>
                                                {quotation.description}
                                            </td>
                                            <td className='text-center'>
                                                RM {quotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col">
                                                    <span>{quotation.created_by ? quotation.created_by.name : '-'}</span>
                                                    <div className="inline-block">
                                                        <span className="text-sm font-semibold badge badge-outline badge-sm my-1">{quotation.created_at}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex flex-col">
                                                    <span>{quotation.updated_by ? quotation.updated_by.name : '-'}</span>
                                                    <div className="inline-block">
                                                        <span className="text-sm font-semibold badge badge-outline badge-sm my-1">{quotation.updated_at}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex justify-around gap-2">
                                                    <Link
                                                        to={`/quotations/${quotation.id}`}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        View
                                                    </Link>
                                                    {/* <button
                                                        className="btn-delete btn btn-sm btn-icon btn-danger"
                                                        data-tooltip="#remove_tooltip"
                                                        data-action="delete"
                                                        data-id={quotation.id}
                                                        data-name={quotation.name}
                                                        data-modal-toggle="#delete_item_modal"
                                                        onClick={() => setSelectedQuotation({ id: quotation.id, name: quotation.name })}
                                                    >
                                                        <i className="ki-outline ki-trash"></i>
                                                    </button> */}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center text-gray-500">
                                            No quotations available
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

            {/* <DeleteModal
                item={selectedQuotation}
                modalTitle='Remove Quotation'
                modalPrompt='Are you sure to permanently remove this package:'
                notifySuccess='Quotation Removed Successfully!'
                notifyError='Quotation remove failed'
                navigateUrl='/quotations'
                deleteFunction={handleRemoveQuotation}
            /> */}
        </>
    );
}

export default QuotationMain;
