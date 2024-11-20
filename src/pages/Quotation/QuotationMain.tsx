// src\pages\Quotation\QuotationMain.tsx

import { useNavigate } from 'react-router-dom';
import Button from '../../components/Buttons/Button';
import { useEffect, useState } from 'react';
import { Quotation } from '../../types';
import { quotationIndex, removeQuotation } from '../../services/api';
import Loading from '../../components/Loading';
import DeleteModal from '../../components/Modals/DeleteModal';

function QuotationMain() {
    const navigate = useNavigate();

    const [quotations, setQuotations] = useState<Quotation[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const [selectedQuotation, setSelectedQuotation] = useState<{ id: number | string, name: string } | null>(null);

    useEffect(() => {
        document.title = "Quotations | RenoXpert";
        initQuotationTable(page, size);

        // Cleanup function to clear localStorage on unmount
        return () => {
            localStorage.removeItem('include_packages');
        };
    }, [page, size]);

    const initQuotationTable = async (page: number, size: number, searchTerm?: string) => {
        try {
            setIsLoading(true);
            const response = await quotationIndex(size, page, searchTerm);

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
        initQuotationTable(page, size, searchTerm);
    };

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        try {
            setIsLoading(true);
            const response = await quotationIndex(size, page, value);

            const data = response?.data || [];
            setQuotations(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error searching quotations:', error);
            setError('Failed to search quotations');
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
                        Quotation Overview
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <Button
                            url='/quotations/create'
                            btnText='Create Quotation'
                            btnSize='btn-sm'
                            icon='ki-outline ki-plus-squared'
                        />
                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">
                            Quotation Overview
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
                                    <th className='w-[10px] text-center'>ID</th>
                                    <th className='w-[150px] text-center'>Name</th>
                                    <th className='w-[300px] text-center'>Description</th>
                                    <th className='w-[110px] text-center'>Total Amount</th>
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
                                                <div className="flex flex-col">
                                                    <span>{quotation.id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {quotation.name}
                                            </td>
                                            <td>
                                                {quotation.description}
                                            </td>
                                            <td className='text-center'>
                                                RM {quotation.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex justify-around gap-2">
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => handleViewQuotation(quotation.id)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="btn-delete btn btn-sm btn-icon btn-danger"
                                                        data-tooltip="#remove_tooltip"
                                                        data-action="delete"
                                                        data-id={quotation.id}
                                                        data-name={quotation.name}
                                                        data-modal-toggle="#delete_item_modal"
                                                        onClick={() => setSelectedQuotation({ id: quotation.id, name: quotation.name })}
                                                    >
                                                        <i className="ki-outline ki-trash"></i>
                                                    </button>
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

            <DeleteModal
                item={selectedQuotation}
                modalTitle='Remove Quotation'
                modalPrompt='Are you sure to permanently remove this package:'
                notifySuccess='Quotation Removed Successfully!'
                notifyError='Quotation remove failed'
                navigateUrl='/quotations'
                deleteFunction={handleRemoveQuotation}
            />
        </>
    );
}

export default QuotationMain;
