import React, { useEffect, useRef, useState } from 'react'
import Loading from '../components/Loading';
import { OTPRequest } from '../types';
import { otpRequestsIndex } from '../services/api';

export type SortOrder = 'asc' | 'desc' | null;

interface FilterOption {
    column: string;
    value: string;
    label?: string;
}

function OTPRequestList() {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const [otpRequests, setOtpRequests] = useState<OTPRequest[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filter, setFilter] = useState<FilterOption[]>([]);
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // New state for countdown timers
    const [timers, setTimers] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        document.title = "OTP Request List | RenoXpert";
        initOtpsTable(1, 10, '', null, '');
    }, []);

    // Add timer calculation effect
    useEffect(() => {
        const interval = setInterval(() => {
            const updatedTimers: { [key: string]: string } = {};
            const updatedRequests = otpRequests.map(otp => {
                const timeLeft = otp.expires_at * 1000 - Date.now();
                if (timeLeft <= 0 && otp.status !== 'verified') {
                    return { ...otp, status: 'expired' };
                }
                updatedTimers[otp.uuid] = formatTimeLeft(timeLeft);
                return otp;
            });
            setOtpRequests(updatedRequests);
            setTimers(updatedTimers);
        }, 1000);

        return () => clearInterval(interval);
    }, [otpRequests]);

    const formatTimeLeft = (milliseconds: number): string => {
        if (milliseconds <= 0) return 'Expired';
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const initOtpsTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string,
    ) => {
        try {
            setIsLoading(true);
            const response = await otpRequestsIndex(size, page, searchTerm, order, field);
            const data = response?.data || [];
            setOtpRequests(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching OTPs:', error);
            setError('Failed to load OTPs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initOtpsTable(page, size, searchTerm, sortOrder, sortField);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        initOtpsTable(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size
        initOtpsTable(1, newSize, searchTerm, sortOrder, sortField);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Cycle through states: null -> asc -> desc -> null
            if (sortOrder === null) {
                setSortOrder('asc');
                initOtpsTable(page, size, searchTerm, 'asc', field);
            } else if (sortOrder === 'asc') {
                setSortOrder('desc');
                initOtpsTable(page, size, searchTerm, 'desc', field);
            } else {
                setSortOrder(null);
                setSortField('');
                initOtpsTable(page, size, searchTerm, null, '');
            }
        } else {
            // New field, start with ascending
            setSortField(field);
            setSortOrder('asc');
            initOtpsTable(page, size, searchTerm, 'asc', field);
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

    // Rest of your existing functions remain the same until formatDateTime
    const formatDateTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const dateOptions: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        };
        const formattedDate = date.toLocaleDateString('en-US', dateOptions)
            .replace(/(\d+)/, '$1 ');
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        const formattedTime = `${displayHours}:${displayMinutes} ${period}`;
        return { date: formattedDate, time: formattedTime };
    };

    const totalPages = Math.ceil(totalItems / size);

    return (
        <>
            {isLoading && <Loading />}
            <div className="flex flex-col gap-6 p-4 bg-gray-50 rounded-lg shadow-sm">
                <div className="flex justify-between items-center flex-wrap bg-white p-4 rounded-lg shadow">
                    <span className="text-2xl font-bold text-gray-900">
                        OTP Requests
                    </span>
                    <button
                        className="btn btn-primary flex items-center gap-2"
                        onClick={handleRefreshTable}
                    >
                        <i className="ki-solid ki-arrows-circle text-lg"></i>
                        Refresh
                    </button>
                </div>

                <div className="card bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="card-header flex-wrap gap-2 p-4 border-b">
                        <div className="card-title text-lg font-semibold text-gray-800">
                            OTPs Requested by Users
                        </div>
                    </div>
                    <div className="card-table overflow-x-auto">
                        <table className="table w-full text-gray-700 font-medium text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className='w-[100px] p-3'>Mobile No.</th>
                                    <th className='w-[80px] text-center p-3'>OTP Code</th>
                                    <th className='w-[80px] text-center p-3'>Status</th>
                                    <th className='w-[80px] text-center p-3'>Time Left</th>
                                    <th className='w-[100px] p-3'>Expired At</th>
                                    <th className='w-[100px] p-3'>Requested At</th>
                                    <th className='w-[100px] p-3'>SMS ID</th>
                                    <th className='w-[160px] p-3'>UUID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {otpRequests.length > 0 ? (
                                    otpRequests.map((otp, index) => {
                                        const expiresAt = formatDateTime(otp.expires_at);
                                        const createdAt = formatDateTime(otp.created_at);

                                        return (
                                            <tr
                                                key={index}
                                                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
                                            >
                                                <td className='p-3'>
                                                    <span className="font-mono">{otp.mobile}</span>
                                                </td>
                                                <td className='text-center p-3'>
                                                    <span className="font-mono font-bold">{otp.code}</span>
                                                </td>
                                                <td className='text-center p-3'>
                                                    <span className={`badge badge-pill p-2 capitalize
                                                        ${otp.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''} 
                                                        ${otp.status === 'expired' ? 'bg-red-100 text-red-800' : ''} 
                                                        ${otp.status === 'verified' ? 'bg-green-100 text-green-800' : ''} 
                                                        rounded-full`}
                                                    >
                                                        {otp.status.replace(/-/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className='text-center p-3'>
                                                    {otp.status === 'verified' || otp.status === 'expired' ? (
                                                        <span>&nbsp;</span> // Displays nothing (just a space for alignment)
                                                    ) : (
                                                        <span className={`font-mono font-semibold ${timers[otp.uuid] === 'Expired'
                                                            ? 'text-red-600'
                                                            : 'text-blue-600'
                                                            }`}>
                                                            {timers[otp.uuid] || 'Loading...'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className='p-3'>
                                                    <div className="flex flex-col">
                                                        <span className='text-gray-900'>{expiresAt.time}</span>
                                                        <span className='text-gray-500'>{expiresAt.date}</span>
                                                    </div>
                                                </td>
                                                <td className='p-3'>
                                                    <div className="flex flex-col">
                                                        <span className='text-gray-900'>{createdAt.time}</span>
                                                        <span className='text-gray-500'>{createdAt.date}</span>
                                                    </div>
                                                </td>
                                                <td className='p-3'>
                                                    <span className="font-mono">{otp.sms_id}</span>
                                                </td>
                                                <td className='p-3'>
                                                    <span className="font-mono text-xs">{otp.uuid}</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="text-center text-gray-500 p-6">
                                            No OTP requests available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="card-footer p-4 border-t flex justify-between items-center text-gray-600 text-sm">
                        <div className="flex items-center gap-2">
                            Show
                            <select
                                className="select select-sm w-16 border-gray-300 rounded-md"
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
                            <div className="pagination flex gap-1">
                                <button
                                    className={`btn p-2 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                >
                                    <i className="ki-outline ki-black-left"></i>
                                </button>
                                {/* Simplified pagination for brevity */}
                                <button
                                    className={`btn p-2 ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
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

export default OTPRequestList