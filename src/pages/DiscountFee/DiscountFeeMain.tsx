// src\pages\DiscountFee\DiscountFeeMain.tsx

import { useEffect, useState } from 'react';
import DiscountFeesTable from '../../components/Tables/DiscountFeesTable';
import AddDiscountFeeModal from '../../components/Modals/AddDiscountFeeModal';
import { DiscountFee } from '../../types';
import { discountFeeIndex } from '../../services/api';
import Loading from '../../components/Loading';

function DiscountFeeMain() {
    const [discountFee, setDiscountFee] = useState<DiscountFee[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);

    const [selectedDiscountFee, setSelectedDiscountFee] = useState<{ id: number | string, name: string } | null>(null);

    useEffect(() => {
        document.title = "Discount & Fee Management | RenoXpert";
        initDiscountFeeTable(page, size, searchTerm, sortOrder, sortField);
    }, [page, size, searchTerm, sortOrder, sortField]);

    const initDiscountFeeTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await discountFeeIndex(size, page, searchTerm, order, field);
            const data = response?.data || [];
            setDiscountFee(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching discountFee:', error);
            setError('Failed to load discountFee');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initDiscountFeeTable(page, size, searchTerm, sortOrder, sortField);
    };

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        try {
            setIsLoading(true);
            const response = await discountFeeIndex(size, page, value);

            const data = response?.data || [];
            setDiscountFee(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error searching discountFee:', error);
            setError('Failed to search discountFee');
        } finally {
            setIsLoading(false);
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

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Cycle through states: null -> asc -> desc -> null
            if (sortOrder === null) {
                setSortOrder('asc');
            } else if (sortOrder === 'asc') {
                setSortOrder('desc');
            } else {
                setSortOrder(null);
                setSortField('');
            }
        } else {
            // New field, start with ascending
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const totalPages = Math.ceil(totalItems / size);

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

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Discounts and Fees
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            className='btn btn-primary btn-sm'
                            data-modal-toggle="#add_discount_fee_modal"
                        >
                            <i className="ki-outline ki-plus-squared"></i>
                            New Discount/Fee
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">
                            DiscountFee Overview
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
                                        placeholder="Search discountFee"
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
                                        className='w-[20px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('id')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            ID {getSortIcon('id')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[250px] cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Name {getSortIcon('name')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[120px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('type')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Type {getSortIcon('type')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[80] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('value')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Value {getSortIcon('value')}
                                        </div>
                                    </th>
                                    <th className='w-[120px] text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discountFee.length > 0 ? (
                                    discountFee.map((discountFee, discountFeeIndex) => (
                                        <tr
                                            key={discountFeeIndex}
                                            className={`${discountFeeIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                        >
                                            <td>
                                                {discountFee.id}
                                            </td>
                                            <td>
                                                {discountFee.name}
                                            </td>
                                            <td className='text-center'>
                                                {discountFee.type}
                                            </td>
                                            <td className='text-center capitalize'>
                                                <div className="flex flex-col gap-1">
                                                    {(discountFee.percentage ? `${(discountFee.percentage * 100).toFixed(2)}%` : `RM ${discountFee.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)}
                                                </div>
                                            </td>
                                            <td>
                                                
                                            </td>
                                            {/* <td className='text-center'>
                                                <div className="flex justify-around gap-2">
                                                    <button
                                                        className="btn-view btn btn-sm btn-secondary"
                                                        onClick={() => handleViewProduct(discountFee.id)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="btn-delete btn btn-sm btn-icon btn-danger"
                                                        data-modal-toggle="#delete_item_modal"
                                                        onClick={() => setSelectedDiscountFee({ id: discountFee.id, name: discountFee.name })}
                                                    >
                                                        <i className="ki-outline ki-trash"></i>
                                                    </button>
                                                </div>
                                            </td> */}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center text-gray-500">
                                            No discountFee available
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

                {/* <DiscountFeesTable /> */}
                <AddDiscountFeeModal
                    refreshTableFunction={handleRefreshTable}
                />
            </div>
        </>
    );
}

export default DiscountFeeMain;
