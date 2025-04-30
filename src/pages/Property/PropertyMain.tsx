// src\pages\Contact\ContactMain.tsx

import { useEffect, useState } from 'react';
import CreatePropertyModal from '../../components/Modals/CreatePropertyModal';
import { useNavigate } from 'react-router-dom';
import { propertyIndex, removeProperty } from '../../services/api';
import { Property } from '../../types';
import EditPropertyModal from '../../components/Modals/EditPropertyModal';
import DeleteModal from '../../components/Modals/DeleteModal';

type SortOrder = 'asc' | 'desc' | null;

function PropertyMain() {
    const navigate = useNavigate();

    const [properties, setPropertys] = useState<Property[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);

    const [selectedProperty, setSelectedProperty] = useState<{ id: number | string, name: string, property?: Property } | null>(null);

    useEffect(() => {
        document.title = "Property | RenoXpert";
        initPropertyTable(page, size, searchTerm, sortOrder, sortField);

    }, [page, size, searchTerm, sortOrder, sortField]);

    const initPropertyTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await propertyIndex(size, page, searchTerm, order, field);
            const data = response?.data || [];
            setPropertys(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching properties:', error);
            setError('Failed to load properties');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initPropertyTable(page, size, searchTerm, sortOrder, sortField);
    };

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        try {
            setIsLoading(true);
            const response = await propertyIndex(size, page, value);

            const data = response?.data || [];
            setPropertys(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error searching properties:', error);
            setError('Failed to search properties');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        initPropertyTable(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size
        initPropertyTable(1, newSize, searchTerm, sortOrder, sortField);
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

    const handleRemoveProperty = async (propertyId: number) => {
        try {
            const response = await removeProperty(propertyId);

            if (response?.success) {
                initPropertyTable(page, size);
                return { success: true };
            }
            return { success: false };

        } catch (error) {
            console.log(error);
            return { success: false, message: 'Property removal failed' };
        }
    }

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Property List
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            className='btn btn-primary btn-sm'
                            data-modal-toggle="#create_property_modal"
                        >
                            <i className="ki-outline ki-plus-squared"></i>
                            New Property
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">
                            Property Overview
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
                                        placeholder="Search properties"
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
                                        className='w-[250px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Name {getSortIcon('name')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[700px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('address')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Address {getSortIcon('address')}
                                        </div>
                                    </th>
                                    <th className='w-[150px] text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {properties.length > 0 ? (
                                    properties.map((property, propertyIndex) => {
                                        const addressParts = [
                                            property.address,
                                            property.street,
                                            property.postcode,
                                            property.city,
                                            property.state
                                        ].filter(part => part !== null && part !== '')

                                        return (
                                            <tr
                                                key={propertyIndex}
                                                className={`${propertyIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                            >
                                                <td className='text-center'>
                                                    {property.id}
                                                </td>
                                                <td>
                                                    {property.name}
                                                </td>
                                                <td>
                                                    {addressParts.join(', ')}
                                                </td>
                                                <td className='text-center'>
                                                    <div className="flex justify-around gap-2">
                                                        <button
                                                            className="btn-view btn btn-sm btn-secondary"
                                                            data-modal-toggle="#edit_property_modal"
                                                            onClick={() => setSelectedProperty({ id: property.id, name: property.name, property })}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="btn-delete btn btn-sm btn-icon btn-danger"
                                                            data-modal-toggle="#delete_item_modal"
                                                            onClick={() => setSelectedProperty({ id: property.id, name: property.name })}
                                                        >
                                                            <i className="ki-outline ki-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center text-gray-500">
                                            No properties available
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

                <CreatePropertyModal />

                {/* Call initPropertyTable() function */}
                <EditPropertyModal
                    property={selectedProperty?.property}
                    onUpdateSuccess={() => initPropertyTable(page, size)}
                />

                <DeleteModal
                    item={selectedProperty}
                    modalTitle='Remove Property'
                    modalPrompt='Are you sure to permanently remove this property:'
                    notifySuccess='Property Removed Successfully!'
                    notifyError='Property remove failed'
                    navigateUrl='/properties'
                    deleteFunction={handleRemoveProperty}
                />
            </div>
        </>
    );
}

export default PropertyMain;
