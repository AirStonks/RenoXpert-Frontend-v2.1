import React, { useState, useEffect } from 'react';
import {
    Eye,
    Clock,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { InvestorInterest } from '../../types';
import { investorInterestIndex } from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ClipboardJS from 'clipboard';

type SortOrder = 'asc' | 'desc';
type SortField = 'id' | 'name' | 'address';


const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const PUBLIC_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_PUBLIC_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_PUBLIC_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? 'localhost:5173/public/'
                : null;

const statusConfig = {
    new: { label: "New", color: "bg-[#F9A533]", textColor: "text-white" },
    reviewed: { label: "Reviewed", color: "bg-blue-500", textColor: "text-white" },
    contacted: { label: "Contacted", color: "bg-green-500", textColor: "text-white" },
    closed: { label: "Closed", color: "bg-gray-500", textColor: "text-white" },
};

interface StoredConfig {
    page: number;
    size: number;
    searchTerm: string;
    sortField: SortField;
    sortOrder: SortOrder;
    expiresAt: number;
}

const getInitialState = (): StoredConfig => {
    const savedState = localStorage.getItem('propertyMainConfig');
    const defaultState: StoredConfig = {
        page: 1,
        size: 10,
        searchTerm: '',
        sortField: 'name',
        sortOrder: 'asc',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    if (savedState) {
        const parsedState: StoredConfig = JSON.parse(savedState);
        const currentTime = Date.now();

        if (currentTime > parsedState.expiresAt) {
            localStorage.removeItem('propertyMainConfig');
            return defaultState;
        }
        return parsedState;
    }
    return defaultState;
};

function IIFMain() {
    const navigate = useNavigate();
    const [investorInterests, setInvestorInterests] = useState<InvestorInterest[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(getInitialState().page);
    const [size, setSize] = useState<number>(getInitialState().size);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>(getInitialState().searchTerm);
    const [sortField, setSortField] = useState<SortField>(getInitialState().sortField);
    const [sortOrder, setSortOrder] = useState<SortOrder>(getInitialState().sortOrder);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

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
        document.title = 'Investor Interest Forms Overview | RenoXpert';

        fetchInvestorInterests(page, size, searchTerm, sortOrder, sortField);

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };

    }, []);

    const fetchInvestorInterests = async (
        page: number,
        size: number,
        searchTerm: string,
        order: SortOrder,
        field: SortField
    ) => {
        try {
            setIsLoading(true);
            const response = await investorInterestIndex(size, page, searchTerm, order, field);
            const data = response?.data || [];
            setInvestorInterests(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching investorInterests:', error);
            setError('Failed to load investorInterests');
            notify('error', 'Failed to load investorInterests');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-MY", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const toggleRowExpansion = (id: number) => {
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    const SkeletonRow = () => (
        <tr className="border-b">
            <td className="px-4 py-3">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
            </td>
        </tr>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-6 z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Investor Interest Forms</h1>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            className="btn btn-sm btn-outline btn-info copy-link flex justify-center gap-2"
                            data-clipboard-text={`${PUBLIC_URL}investor-interest-form`}
                        >
                            <i className="ki-filled ki-copy"></i>
                            <span>Copy Interest Form Link</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 text-gray-800 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 w-12"></th>
                            <th className="px-6 py-4">Submittor</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Property</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Submitted</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            Array.from({ length: size }).map((_, index) => (
                                <SkeletonRow key={index} />
                            ))
                        ) : (
                            investorInterests.map((submission) => (
                                <React.Fragment key={submission.id}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleRowExpansion(Number(submission.id))}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                {expandedRows.includes(Number(submission.id)) ? (
                                                    <ChevronUp className="h-5 w-5" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{submission.full_name}</p>
                                                {/* <p className="text-sm text-gray-600">{submission.id}</p> */}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm text-gray-900">{submission.email}</p>
                                                <p className="text-sm text-gray-600">{submission.mobile_number}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{submission.property_name}</p>
                                                <p className="text-sm text-gray-600">{submission.unit_type}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusConfig[submission.status].color} ${statusConfig[submission.status].textColor}`}
                                            >
                                                {statusConfig[submission.status].label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {formatDate(submission.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => navigate(`${LOCAL_PATH_PREFIX}investor-interest-forms/${submission.id}`)}
                                                className="flex items-center px-3 py-2 bg-gradient-to-r from-[#D71E42] to-[#F05A22] text-white rounded-lg hover:from-[#B91C3C] hover:to-[#DC2626] transition-all duration-300 text-sm"
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRows.includes(Number(submission.id)) && (
                                        <tr className="border-b">
                                            <td colSpan={7} className="px-6 py-4">
                                                <div
                                                    className="bg-gray-50 rounded-lg p-6 transition-all duration-300 ease-in-out"
                                                    aria-expanded="true"
                                                >
                                                    <h3 className="text-base font-semibold text-gray-800 mb-4">Submission Details</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="font-medium text-gray-700">Full Name</p>
                                                            <p className="text-gray-600">{submission.full_name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">Email</p>
                                                            <p className="text-gray-600">{submission.email}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">Mobile Number</p>
                                                            <p className="text-gray-600">{submission.mobile_number}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">InvestorInterest Name</p>
                                                            <p className="text-gray-600">{submission.property_name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">Unit Type</p>
                                                            <p className="text-gray-600">{submission.unit_type}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">Keys Collected</p>
                                                            <p className="text-gray-600">{submission.keys_collected}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">Preferred Contact</p>
                                                            <p className="text-gray-600">{submission.preferred_contact}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">Preferred Time</p>
                                                            <p className="text-gray-600">{submission.preferred_time?.replace("-", " ") || '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default IIFMain;