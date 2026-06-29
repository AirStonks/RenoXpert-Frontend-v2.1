import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { campaignIndex } from '../../services/api';
import { Campaign } from '../../types';
import { 
    Plus, 
    Eye, 
    Edit, 
    Trash2, 
    Calendar, 
    Users, 
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Target,
    Clock,
    CheckCircle
} from 'lucide-react';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

type SortOrder = "asc" | "desc"
type SortField = "id" | "title" | "start_date" | "end_date" | "status" | "slot_total" | "created_at"

interface StatusConfig {
    label: string;
    color: string;
    textColor: string;
}

const statusConfig: Record<string, StatusConfig> = {
    unpublished: { label: "Unpublished", color: "bg-gray-50 border-gray-300", textColor: "text-gray-600" },
    published: { label: "Published", color: "bg-green-50 border-green-300", textColor: "text-green-600" },
    started: { label: "Started", color: "bg-blue-50 border-blue-300", textColor: "text-blue-600" },
    "fully-redeemed": { label: "Fully Redeemed", color: "bg-yellow-50 border-yellow-300", textColor: "text-yellow-600" },
    ended: { label: "Ended", color: "bg-red-50 border-red-300", textColor: "text-red-600" },
};


export default function CampaignMain() {
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const navigate = useNavigate();
    
    // State management
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [sortField] = useState<SortField>("created_at");
    const [sortOrder] = useState<SortOrder>("desc");
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<{ id: string, title: string } | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    useEffect(() => {
        document.title = "Campaigns | RenoXpert";
        fetchCampaigns(1, 10, '', 'desc', 'created_at');
    }, []);

    const fetchCampaigns = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string,
    ) => {
        try {
            setIsLoading(true);

            const response = await campaignIndex(size, page, searchTerm, order, field);
            const data: Campaign[] = response?.data || [];

            setCampaigns(data);
            setTotalItems(response?.totalCount || 0);
            setIsLoading(false);

        } catch (error) {
            console.error("Error fetching campaigns:", error);
            setIsLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString("en-MY", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const toggleRowExpansion = (id: string) => {
        setExpandedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);
            fetchCampaigns(1, size, value, sortOrder, sortField);
        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        fetchCampaigns(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1);
        fetchCampaigns(1, newSize, searchTerm, sortOrder, sortField);
    };

    const handleViewDetails = (id: string) => {
        navigate(LOCAL_PATH_PREFIX + `campaigns/${id}`);
    };

    const handleDeleteClick = (campaign: Campaign) => {
        setSelectedCampaign({ id: campaign.id!, title: campaign.title! });
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedCampaign) return;
        
        try {
            // TODO: Implement delete API call
            console.log('Deleting campaign:', selectedCampaign.id);
            setShowDeleteModal(false);
            setSelectedCampaign(null);
            await fetchCampaigns(page, size, searchTerm, sortOrder, sortField);
        } catch (error) {
            console.error('Error deleting campaign:', error);
        }
    };

    const totalPages = Math.ceil(totalItems / size);

    const SkeletonRow = () => (
        <tr className="border-b">
            <td className="px-4 py-3">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
                <div className="flex gap-2">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-6 z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Target className="h-8 w-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-800">Campaign Management</h1>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button 
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => fetchCampaigns(page, size, searchTerm, sortOrder, sortField)}
                        >
                            <RefreshCw className="h-4 w-4 inline mr-2" />
                            Refresh
                        </button>
                        <button 
                            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => navigate(`${LOCAL_PATH_PREFIX}campaigns/add`)}
                        >
                            <Plus className="h-4 w-4 inline mr-2" />
                            Add Campaign
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                            <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                        </div>
                        <Target className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {campaigns.filter((campaign) => campaign.status === "active").length}
                            </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Slots Used</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {campaigns.reduce((sum, campaign) => sum + (campaign.slot_used || 0), 0)}
                            </p>
                        </div>
                        <Users className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Draft Campaigns</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {campaigns.filter((campaign) => campaign.status === "draft").length}
                            </p>
                        </div>
                        <Clock className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 text-gray-800 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 w-12"></th>
                            <th className="px-6 py-4 font-semibold">Campaign</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">Start Date</th>
                            <th className="px-6 py-4 font-semibold">End Date</th>
                            <th className="px-6 py-4 font-semibold">Slots</th>
                            <th className="px-6 py-4 font-semibold">Created</th>
                            <th className="px-6 py-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading
                            ? Array.from({ length: size }).map((_, index) => <SkeletonRow key={index} />)
                            : campaigns.map((campaign) => (
                                <React.Fragment key={campaign.id}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleRowExpansion(campaign.id!)}
                                                className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
                                            >
                                                {expandedRows.includes(campaign.id!) ? (
                                                    <ChevronUp className="h-5 w-5" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{campaign.title || 'Untitled Campaign'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                                    statusConfig[campaign.status || 'draft']?.color || 'bg-gray-50 border-gray-300'
                                                } ${
                                                    statusConfig[campaign.status || 'draft']?.textColor || 'text-gray-600'
                                                }`}
                                            >
                                                {statusConfig[campaign.status || 'draft']?.label || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-900">{formatDate(campaign.start_date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-900">{formatDate(campaign.end_date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {campaign.slot_used || 0} / {campaign.slot_total || 0}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {campaign.slot_remaining || 0} remaining
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-900">{formatDate(campaign.created_at)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(campaign.id!)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => navigate(`${LOCAL_PATH_PREFIX}campaigns/${campaign.id}/edit`)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-all duration-200"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(campaign)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRows.includes(campaign.id!) && (
                                        <tr className="border-b">
                                            <td colSpan={8} className="px-6 py-4">
                                                <div className="bg-gray-50 rounded-lg p-6 transition-all duration-300 ease-in-out">
                                                    <h3 className="text-base font-semibold text-gray-800 mb-4">Campaign Details</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
                                                                Campaign Information
                                                            </h4>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Title</p>
                                                                <p className="text-gray-600">{campaign.title || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Status</p>
                                                                <span
                                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        statusConfig[campaign.status || 'draft']?.color || 'bg-gray-50 border-gray-300'
                                                                    } ${
                                                                        statusConfig[campaign.status || 'draft']?.textColor || 'text-gray-600'
                                                                    }`}
                                                                >
                                                                    {statusConfig[campaign.status || 'draft']?.label || 'Unknown'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Description</p>
                                                                <p className="text-gray-600">{campaign.description || 'No description provided'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
                                                                Timeline & Capacity
                                                            </h4>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Start Date</p>
                                                                <p className="text-gray-600">{formatDate(campaign.start_date)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">End Date</p>
                                                                <p className="text-gray-600">{formatDate(campaign.end_date)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Slot Usage</p>
                                                                <div className="mt-2 space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                                                                            Used: {campaign.slot_used || 0}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700">
                                                                            Total: {campaign.slot_total || 0}
                                                                        </span>
                                                                    </div>
                                                                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700">
                                                                        Remaining: {campaign.slot_remaining || 0}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-gray-700 border-b border-gray-200 pb-1">
                                                                System Information
                                                            </h4>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Campaign ID</p>
                                                                <p className="text-gray-600 font-mono">{campaign.id}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Created</p>
                                                                <p className="text-gray-600">{formatDate(campaign.created_at)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-700">Last Updated</p>
                                                                <p className="text-gray-600">{formatDate(campaign.updated_at)}</p>
                                                            </div>
                                                            {campaign.published_at && (
                                                                <div>
                                                                    <p className="font-medium text-gray-700">Published</p>
                                                                    <p className="text-gray-600">{formatDate(campaign.published_at)}</p>
                                                                    {campaign.published_by && (
                                                                        <p className="text-gray-500 text-xs">by {campaign.published_by.name}</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!isLoading && campaigns.length > 0 && (
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
                                        className={`px-3 py-1 border rounded-lg ${page === currentPage
                                            ? 'bg-blue-500 text-white'
                                            : 'hover:bg-gray-100'
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
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Delete Campaign</h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete the campaign <strong>"{selectedCampaign?.title}"</strong>? 
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}