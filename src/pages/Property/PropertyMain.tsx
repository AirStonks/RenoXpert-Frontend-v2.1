import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyIndex, removeProperty } from '../../services/api';
import { Property } from '../../types';
import { toast } from 'react-toastify';
import DeleteModal from '../../components/Modals/DeleteModal';
import CreatePropertyModal from '../../components/Modals/CreatePropertyModal';
// import EditPropertyModal from '../../components/Modals/EditPropertyModal';
import React from 'react';
import {
    ChevronDownIcon,
    ChevronUpIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/solid';
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';


const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

type SortOrder = 'asc' | 'desc';
type SortField = 'id' | 'name' | 'address';

function PropertyMain() {
    const navigate = useNavigate();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

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

    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(getInitialState().page);
    const [size, setSize] = useState<number>(getInitialState().size);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>(getInitialState().searchTerm);
    const [sortField, setSortField] = useState<SortField>(getInitialState().sortField);
    const [sortOrder, setSortOrder] = useState<SortOrder>(getInitialState().sortOrder);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<{ id: number | string; name: string; property?: Property } | null>(null);

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
        const config: StoredConfig = {
            page,
            size,
            searchTerm,
            sortField,
            sortOrder,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
        localStorage.setItem('propertyMainConfig', JSON.stringify(config));
    }, [page, size, searchTerm, sortField, sortOrder]);

    useEffect(() => {
        document.title = 'Properties | RenoXpert';
        fetchProperties(page, size, searchTerm, sortOrder, sortField);
    }, []);

    const fetchProperties = async (
        page: number,
        size: number,
        searchTerm: string,
        order: SortOrder,
        field: SortField
    ) => {
        try {
            setIsLoading(true);
            const response = await propertyIndex(size, page, searchTerm, order, field);
            const data = response?.data || [];
            setProperties(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching properties:', error);
            setError('Failed to load properties');
            notify('error', 'Failed to load properties');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setPage(1);
        await fetchProperties(1, size, searchTerm, sortOrder, sortField);
        notify('success', 'Properties refreshed');
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);
            await fetchProperties(1, size, value, sortOrder, sortField);
        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        fetchProperties(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1);
        fetchProperties(1, newSize, searchTerm, sortOrder, sortField);
    };

    const handleSortChange = (field: SortField) => {
        const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortOrder(newOrder);
        fetchProperties(page, size, searchTerm, newOrder, field);
    };

    const toggleRowExpansion = (id: number) => {
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    const handleRemoveProperty = async (propertyId: number) => {
        try {
            const response = await removeProperty(propertyId);
            if (response?.success) {
                notify('success', 'Property removed successfully');
                fetchProperties(page, size, searchTerm, sortOrder, sortField);
                return { success: true };
            }
            notify('error', 'Property removal failed');
            return { success: false };
        } catch (error) {
            notify('error', 'Property removal failed');
            return { success: false, message: 'Property removal failed' };
        }
    };

    const formatAddress = (property: Property) => {
        const addressParts = [
            property.address,
            property.street,
            property.postcode,
            property.city,
            property.state
        ].filter(part => part !== null && part !== '');
        return addressParts.join(', ') || '-';
    };

    const totalPages = Math.ceil(totalItems / size);

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white shadow-md rounded-lg p-4 mb-6 z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Property Overview</h1>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search properties..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-10 pr-4 py-2 w-full md:w-64 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={sortField}
                            onChange={(e) => handleSortChange(e.target.value as SortField)}
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="name">Name</option>
                            <option value="id">ID</option>
                            <option value="address">Address</option>
                        </select>
                        <button
                            onClick={handleRefresh}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            data-modal-toggle="#create_property_modal"
                        >
                            <PlusIcon className="h-5 w-5" />
                            New Property
                        </button>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
                    <p>{error}</p>
                    <button onClick={handleRefresh} className="mt-2 underline hover:text-red-900">
                        Try Again
                    </button>
                </div>
            )}

            {/* List View */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 text-gray-800 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 w-12"></th>
                            <th
                                className="w-[250px] px-4 py-3 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSortChange('name')}
                            >
                                <div className="flex items-center gap-1">
                                    Name
                                    {sortField === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                </div>
                            </th>
                            <th
                                className="w-[400px] px-4 py-3 cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSortChange('address')}
                            >
                                <div className="flex items-center gap-1">
                                    Address
                                    {sortField === 'address' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                </div>
                            </th>
                            <th className="w-[150px] px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            // Skeleton Loader for List
                            Array.from({ length: 6 }).map((_, index) => (
                                <tr key={index} className="border-b animate-pulse">
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-6"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-64"></div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                                            <div className="h-8 bg-gray-200 rounded w-8"></div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : properties.length > 0 ? (
                            properties.map((property) => (
                                <React.Fragment key={property.id}>
                                    <tr className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleRowExpansion(Number(property.id))}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                {expandedRows.includes(Number(property.id)) ? (
                                                    <ChevronUpIcon className="h-5 w-5" />
                                                ) : (
                                                    <ChevronDownIcon className="h-5 w-5" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium">{property.name}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-600">{formatAddress(property)}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-sm flex items-center gap-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                                                    data-modal-toggle="#edit_property_modal"
                                                    onClick={() => navigate(`${LOCAL_PATH_PREFIX}properties/${property.id}`)}
                                                >
                                                    View Detail
                                                </button>
                                                <button
                                                    className="btn btn-sm flex items-center justify-center bg-red-500 text-white rounded hover:bg-red-600 transition"
                                                    data-modal-toggle="#delete_item_modal"
                                                    onClick={() => setSelectedProperty({ id: property.id, name: property.name })}
                                                >
                                                    <TrashIcon className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRows.includes(Number(property.id)) && (
                                        <tr className="border-b">
                                            <td colSpan={5} className="px-6 py-4">
                                                <div
                                                    className="bg-gray-50 rounded-lg p-6 transition-all duration-300 ease-in-out animate-fade-in"
                                                    aria-expanded="true"
                                                >
                                                    <h3 className="text-base font-semibold text-gray-800 mb-4">Property Details</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="font-medium text-gray-700">Full Address</p>
                                                            <p className="text-gray-600">{formatAddress(property)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">Street</p>
                                                            <p className="text-gray-600">{property.street || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">Postcode</p>
                                                            <p className="text-gray-600">{property.postcode || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">City</p>
                                                            <p className="text-gray-600">{property.city || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">State</p>
                                                            <p className="text-gray-600">{property.state || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-700">Property ID</p>
                                                            <p className="text-gray-600">{property.id}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    No properties available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!isLoading && properties.length > 0 && (
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
                                        className={`px-3 py-1 border rounded-lg ${page === currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
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

            {/* Modals */}
            <CreatePropertyModal />
            {/* <EditPropertyModal
                property={selectedProperty?.property}
                onUpdateSuccess={() => fetchProperties(page, size, searchTerm, sortOrder, sortField)}
            /> */}
            <DeleteModal
                item={selectedProperty}
                modalTitle="Remove Property"
                modalPrompt="Are you sure to permanently remove this property:"
                notifySuccess="Property Removed Successfully!"
                notifyError="Property remove failed"
                navigateUrl="/properties"
                deleteFunction={handleRemoveProperty}
            />
        </div>
    );
}

export default PropertyMain;