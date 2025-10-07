import React, { useEffect, useRef, useState } from 'react';
import { Eye, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { KayanaHeightsInterest } from '../../types';
import { kayanaHeigInterestIndex } from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ClipboardJS from 'clipboard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

type SortOrder = 'asc' | 'desc';
type SortField = 'id' | 'name' | 'address';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const FORM_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_FORM_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_FORM_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? 'localhost:5173/form/'
                : null;

const statusConfig = {
    new: { label: "New", color: "bg-[#F9A533]", textColor: "text-white" },
    reviewed: { label: "Reviewed", color: "bg-blue-500", textColor: "text-white" },
    contacted: { label: "Contacted", color: "bg-green-500", textColor: "text-white" },
    closed: { label: "Closed", color: "bg-gray-500", textColor: "text-white" },
};

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 10;
const DEFAULT_SORT_FIELD: SortField = 'name';
const DEFAULT_SORT_ORDER: SortOrder = 'asc';

function KayaHeigIIFMain() {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<KayanaHeightsInterest[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
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
        document.title = 'Kayana Heights Interest | RenoXpert';

        fetchSubmissions(DEFAULT_PAGE, DEFAULT_SIZE, searchTerm, DEFAULT_SORT_ORDER, DEFAULT_SORT_FIELD);

        const clipboard = new ClipboardJS('.copy-link');
        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSubmissions = async (
        page: number,
        size: number,
        searchTerm: string,
        order: SortOrder,
        field: SortField
    ) => {
        try {
            setIsLoading(true);
            const response = await kayanaHeigInterestIndex(size, page, searchTerm, order, field);
            const data = response?.data || [];
            setSubmissions(data);
        } catch (error) {
            console.error('Error fetching kayana heights interests:', error);
            notify('error', 'Failed to load submissions');
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

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(async () => {
            fetchSubmissions(DEFAULT_PAGE, DEFAULT_SIZE, value, DEFAULT_SORT_ORDER, DEFAULT_SORT_FIELD);
        }, 500);
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
                    <h1 className="text-2xl font-bold text-gray-800">Kayana Heights Interest Forms</h1>
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-none">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by Name, Tower or Unit Type"
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-10 pr-4 py-2 w-full lg:w-72 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            className="btn btn-sm btn-outline btn-info copy-link flex justify-center gap-2"
                            data-clipboard-text={`${FORM_URL}kayana-heights-interest-form`}
                        >
                            <i className="ki-filled ki-copy"></i>
                            <span>Copy Form Link</span>
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
                            <th className="px-6 py-4">Unit</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Submitted</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            Array.from({ length: DEFAULT_SIZE }).map((_, index) => (
                                <SkeletonRow key={index} />
                            ))
                        ) : (
                            submissions.map((submission) => (
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
                                                <p className="text-sm font-medium text-gray-900">Tower {submission.tower}, Floor {submission.floor}</p>
                                                <p className="text-sm text-gray-600">{submission.unit_type}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusConfig[submission.status || 'new'].color} ${statusConfig[submission.status || 'new'].textColor}`}
                                            >
                                                {statusConfig[submission.status || 'new'].label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {submission.created_at ? formatDate(submission.created_at) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => navigate(`${LOCAL_PATH_PREFIX}kayana-heights-interest-forms/${submission.id}`)}
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
                                                            <p className="font-medium text-gray-700">Tower</p>
                                                            <p className="text-gray-600">{submission.tower}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">Floor</p>
                                                            <p className="text-gray-600">{submission.floor}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">Unit Type</p>
                                                            <p className="text-gray-600">{submission.unit_type}</p>
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

export default KayaHeigIIFMain;
