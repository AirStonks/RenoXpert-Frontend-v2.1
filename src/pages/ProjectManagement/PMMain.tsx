import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changeRenoProgressEndDate, changeRenoProgressStartDate, renoProgressIndex } from "../../services/api";
import { RenoProgress } from "../../types";
import { Slide, toast } from "react-toastify";

type SortOrder = 'asc' | 'desc' | null;

function PMMain() {
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

    // const [selectedProduct, setSelectedProduct] = useState<{ id: number | string, name: string } | null>(null);

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
        document.title = "Project Management | RenoXpert";
        initRenoProgressTable(page, size, searchTerm, sortOrder, sortField);
    }, [page, size, searchTerm, sortOrder, sortField]);

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
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size
    };

    const toProgressDetail = (id: number) => {
        navigate(`/reno-progress/${id}`);
    }

    const handleChangeStartDate = async (event: React.ChangeEvent<HTMLInputElement>, renoProgressId: number) => {
        const startDate = event.target.value;
        try {
            const response = await changeRenoProgressStartDate(renoProgressId, startDate);

            if (response?.success) {
                notify('success', 'Start date updated successfully');
                setRenoProgress((prevData) =>
                    prevData.map((item) =>
                        item.id === renoProgressId ? { ...item, start_date: startDate } : item
                    )
                );
            }

        } catch (error) {

            if (error.status === 400) {
                notify('error', error.response.data.message);
            } else {
                notify('error', 'Something went wrong');
            }

        }
    }

    const handleChangeEndDate = async (event: React.ChangeEvent<HTMLInputElement>, renoProgressId: number) => {
        const endDate = event.target.value;
        try {
            const response = await changeRenoProgressEndDate(renoProgressId, endDate);

            if (response?.success) {
                notify('success', 'End date updated successfully');
                setRenoProgress((prevData) =>
                    prevData.map((item) =>
                        item.id === renoProgressId ? { ...item, end_date: endDate } : item
                    )
                );
            }

        } catch (error) {
            if (error.status === 400) {
                notify('error', error.response.data.message);
            } else {
                notify('error', 'Something went wrong');
            }
        }
    }

    return (
        <>
            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <span className="text-2xl font-bold text-gray-900">
                        Project Management
                    </span>
                </div>
            </div>

            {/* <Link to={'/reno-progress/1'} className="btn btn-primary">
                [TEMP] Reno Progress 1
            </Link> */}

            <div className="card">
                <div className="card-header">
                    <div className="card-title">
                        Project Overview
                    </div>
                </div>
                <div className="card-table">
                    <table className="table align-middle text-gray-700 font-medium text-sm">
                        <thead>
                            <tr>
                                <th className='w-[10px] text-center'>ID</th>
                                <th className='w-[100px] text-center'>Sales</th>
                                <th className='w-[100px] text-center'>Payment Progress</th>
                                <th className='w-[100px] text-center'>Condo</th>
                                <th className='w-[100px] text-center'>Pre-Reno</th>
                                <th className='w-[100px] text-center'>Reno</th>
                                <th className='w-[100px] text-center'>Post-Reno</th>
                                <th className='w-[100px] text-center'>Completion</th>
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
                                            {progress.id}
                                        </td>
                                        <td className="text-center">
                                            <Link
                                                to={'/sales/' + progress.sale_id}
                                                state={{ fromUrl: '/reno-progress' }}
                                                onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                                className="link text-orange-500"
                                            >
                                                {progress.sale.sales_no}
                                            </Link>
                                        </td>
                                        <td className="text-center">
                                            <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                {/* Issued progress bar (outer) */}
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                                    style={{
                                                        width: `${100 - progress.sale.remaining_percentage * 100}%`,
                                                        height: '8px'
                                                    }}
                                                />

                                                {/* Paid progress bar (inner) */}
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                    style={{
                                                        width: `${progress.sale.paid_percentage * 100}%`,
                                                        height: '8px'
                                                    }}
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-center">
                                                <span className="text-xs badge badge-xs badge-pill badge-outline badge-success">{progress.sale.paid_percentage * 100}%</span>
                                                <span className="text-xs badge badge-xs badge-pill badge-outline border-blue-200 bg-blue-50 text-blue-400">{100 - (progress.sale.remaining_percentage * 100)}%</span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-semibold mb-1">{progress.sale.order.property.name}</span>
                                                <span className="badge badge-xs badge-pill text-xs text-gray-600">
                                                    {progress.sale.order.block}-{progress.sale.order.floor}-{progress.sale.order.unit_no}
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
                                                        width: `${progress.reno_completion * 100}%`,
                                                        height: '8px'
                                                    }}
                                                />

                                                {/* Paid progress bar (inner) */}
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                    style={{
                                                        width: `${progress.reno_completion * 100}%`,
                                                        height: '8px'
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs">{(progress.reno_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
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
                                                {/* Issued progress bar (outer) */}
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                                    style={{
                                                        width: `${((progress.pre_reno_completion * 0.2) + (progress.reno_completion * 0.7) + (progress.post_reno_completion * 0.1)) * 100}%`,
                                                        height: '8px'
                                                    }}
                                                />

                                                {/* Paid progress bar (inner) */}
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                    style={{
                                                        width: `${((progress.pre_reno_completion * 0.2) + (progress.reno_completion * 0.7) + (progress.post_reno_completion * 0.1)) * 100}%`,
                                                        height: '8px'
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs">{(((progress.pre_reno_completion * 0.2) + (progress.reno_completion * 0.7) + (progress.post_reno_completion * 0.1)) * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} className="text-center text-gray-500">
                                        No Project available
                                    </td>
                                </tr>
                            )}
                            {/* <tr>
                                <td className="text-center">1</td>
                                <td className="text-center">
                                    <Link
                                        to={'/sales/1'}
                                        className="link text-orange-500"
                                    >
                                        S000001
                                    </Link>
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mt-1 mb-1 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `80%`,
                                                height: '8px'
                                            }}
                                        />

                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `30%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                </td>
                                <td className="text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold mb-1">Ara Tre'</span>
                                        <span className="badge badge-xs badge-pill text-xs text-gray-600">B-15-15</span>
                                    </div>
                                </td>
                                <td className="text-center">
                                    <input type="date" className="input input-sm" />
                                </td>
                                <td className="text-center">
                                    <input type="date" className="input input-sm" />
                                </td>
                                <td className="text-center">1M 29D</td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `60%`,
                                                height: '8px'
                                            }}
                                        />

                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `25%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">60%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `15%`,
                                                height: '8px'
                                            }}
                                        />

                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">20%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />

                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">0%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `8%`,
                                                height: '8px'
                                            }}
                                        />

                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">8%</span>
                                </td>
                            </tr>
                            <tr>
                                <td className="text-center">2</td>
                                <td className="text-center">
                                    <Link
                                        to={'/sales/2'}
                                        className="link text-orange-500"
                                    >
                                        S000002
                                    </Link>
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mt-1 mb-1 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `100%`,
                                                height: '8px'
                                            }}
                                        />

                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `70%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                </td>
                                <td className="text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold mb-1">Meta City</span>
                                        <span className="badge badge-xs badge-pill text-xs text-gray-600">A-22-08</span>
                                    </div>
                                </td>
                                <td className="text-center">
                                    <input type="date" className="input input-sm" />
                                </td>
                                <td className="text-center">
                                    <input type="date" className="input input-sm" />
                                </td>
                                <td className="text-center">28D</td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `100%`,
                                                height: '8px'
                                            }}
                                        />

                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `100%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">100%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `70%`,
                                                height: '8px'
                                            }}
                                        />

                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `60%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">70%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />

                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `0%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">0%</span>
                                </td>
                                <td className="text-center">
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                            style={{
                                                width: `72%`,
                                                height: '8px'
                                            }}
                                        />

                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `68%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs">72%</span>
                                </td>
                            </tr> */}
                        </tbody>
                    </table>
                </div>
            </div>

        </>
    )
}

export default PMMain;