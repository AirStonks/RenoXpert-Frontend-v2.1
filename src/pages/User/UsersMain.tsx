// src\pages\User\UsersMain.tsx

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { User } from "../../types";
import { deactivateUser, userIndex } from "../../services/api";
import Loading from "../../components/Loading";
import { useUser } from "../../context/UserContext";
import { Slide, toast } from "react-toastify";
import { KTModal } from "../../metronic/core";

type SortOrder = 'asc' | 'desc' | null;

function UsersMain() {
    const navigate = useNavigate();

    const { currentUser, loading, error } = useUser();

    const [users, setUsers] = useState<User[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
        document.title = "Users | RenoXpert";
        initUserTable(page, size, searchTerm, sortOrder, sortField);
    }, [page, size, searchTerm, sortOrder, sortField]);

    const initUserTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await userIndex(size, page, searchTerm, order, field);
            const data = response?.data || [];
            setUsers(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initUserTable(page, size, searchTerm, sortOrder, sortField);
    };

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        try {
            setIsLoading(true);
            const response = await userIndex(size, page, value);

            const data = response?.data || [];
            setUsers(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error searching users:', error);
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

    const handleDeactivateUser = async (userId: number) => {
        try {
            const response = await deactivateUser(userId);

            if (response?.success) {
                initUserTable(page, size, searchTerm);
                notify('success', 'User deactivated successfully!');

                const deactiveModalEL = document.getElementById('deactive_user_modal') as HTMLElement;
                const deactiveModal = KTModal.getInstance(deactiveModalEL);

                deactiveModal.hide();
            }

        } catch (error) {
            console.error('Error deactivating user:', error);
        }
    };

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <span className="text-2xl font-bold text-gray-900">
                        User Overview
                    </span>
                </div>
                <div className="flex gap-2">
                    <Link
                        to={'/users/add'}
                        className="btn btn-info btn-sm"
                    >
                        Add User
                    </Link>
                    
                    <Link
                        to={'/users/add/owner'}
                        className="btn btn-warning btn-sm disabled"
                    >
                        Add Owner
                    </Link>
                    
                </div>
            </div>

            <div className="card">
                <div className="card-header flex-wrap gap-2">
                    <div className="card-title">
                        User Overview
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
                                    placeholder="Search users"
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
                                    className='w-[60px] text-center cursor-pointer hover:bg-gray-50'
                                    onClick={() => handleSort('name')}
                                >
                                </th>
                                <th
                                    className='w-[175px] text-center cursor-pointer hover:bg-gray-50'
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        User {getSortIcon('name')}
                                    </div>
                                </th>
                                <th
                                    className='w-[175px] text-center cursor-pointer hover:bg-gray-50'
                                    onClick={() => handleSort('phone_no')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Phone No. {getSortIcon('phone_no')}
                                    </div>
                                </th>
                                <th
                                    className='w-[175px] text-center cursor-pointer hover:bg-gray-50'
                                    onClick={() => handleSort('email')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Email {getSortIcon('email')}
                                    </div>
                                </th>
                                <th
                                    className='w-[150px] text-center cursor-pointer hover:bg-gray-50'
                                    onClick={() => handleSort('type')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        User Type {getSortIcon('type')}
                                    </div>
                                </th>
                                <th
                                    className='w-[100px] text-center cursor-pointer hover:bg-gray-50'
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Status {getSortIcon('status')}
                                    </div>
                                </th>
                                <th className='w-[120px] text-center'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user, userIndex) => (
                                    <tr
                                        key={userIndex}
                                        className={`${userIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                    >
                                        <td></td>
                                        <td>
                                            <span>{user.name}</span>
                                        </td>
                                        <td>
                                            +60 {user.phone_no}
                                        </td>
                                        <td>
                                            {user.email}
                                        </td>
                                        <td className="text-center">
                                            {user.type}
                                        </td>
                                        <td className="text-center">
                                            {user.status}
                                        </td>
                                        <td>
                                            <div className="flex justify-around gap-2">
                                                <Link
                                                    to={'/users/' + user.id}
                                                    className="btn btn-sm btn-light"
                                                >
                                                    View
                                                </Link>

                                                {/* do not display it if user.status === 'deactivated' */}
                                                {((currentUser?.type === 'super-admin' && user.type !== 'super-admin') ||
                                                    (currentUser?.type === 'admin' && user.type === 'staff')) &&
                                                    user.status !== 'deactivated' && (
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            data-tooltip="#remove_tooltip"
                                                            data-modal-toggle="#deactive_user_modal"
                                                            onClick={() => setSelectedUser(user)}
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center text-gray-500">
                                        No users available
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

            <div className="modal" data-modal="true" id="deactive_user_modal">
                <div className="modal-content max-w-[600px] top-[20%]">
                    <div className="modal-header">
                        <h3 className="modal-title">
                            Deactivate User
                        </h3>
                        <button className="btn btn-xs btn-icon btn-light" data-modal-dismiss="true">
                            <i className="ki-outline ki-cross">
                            </i>
                        </button>
                    </div>
                    <div className="modal-body mb-4">
                        <h3 className="text-lg font-medium text-gray-900 text-center my-6">
                            <i className="ki-solid ki-information-3 text-7xl text-warning"></i>
                        </h3>

                        <div className="text-2sm text-center text-gray-700 mb-2">
                            Are you sure to deactivate this user?
                        </div>

                        <div className="text-2sm text-center font-bold text-gray-700 mb-6">
                            <div className="flex flex-col">
                                <span>{selectedUser?.name_first} {selectedUser?.name_last}</span>
                                <span className="font-semibold text-gray-500">{selectedUser?.email}</span>
                                <span className="font-semibold text-gray-700">+60 {selectedUser?.phone_no}</span>
                            </div>
                        </div>

                        <div className="flex justify-center items-center gap-4">
                            <button className="btn btn-light" data-modal-dismiss="true">
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleDeactivateUser(Number(selectedUser?.id))}
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default UsersMain;