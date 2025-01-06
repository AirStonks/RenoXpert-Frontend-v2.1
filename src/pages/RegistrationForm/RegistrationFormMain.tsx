import { useEffect, useRef, useState } from "react";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";
import Loading from "../../components/Loading";
import { useNavigate } from "react-router-dom";
import { OwnerRegistrationForm } from "../../types";
import { approveRegistrationForm, registrationFormIndex, rejectRegistrationForm } from "../../services/api";
import { Link } from "react-router-dom";

const APP_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_APP_URL
        : import.meta.env.VITE_APP_ENV === "staging"
            ? import.meta.env.VITE_STAGING_APP_URL
            : import.meta.env.VITE_APP_ENV === "local"
                ? import.meta.env.VITE_LOCAL_APP_URL
                : null;

type SortOrder = 'asc' | 'desc' | null;

function RegistrationFormMain() {
    const navigate = useNavigate();
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [regForms, setRegForm] = useState<OwnerRegistrationForm[]>([]); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(10);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);

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
        document.title = "Owner Registration Forms | RenoXpert";
        const clipboard = new ClipboardJS('.copy-link');

        initRegFormTable(1, 10, '', null, '');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };

    }, []);

    const initRegFormTable = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string
    ) => {
        try {
            setIsLoading(true);
            const response = await registrationFormIndex(size, page, searchTerm, order, field);

            const data = response?.data || [];
            setRegForm(data);

            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching regForms:', error);
            setError('Failed to load regForms');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshTable = async () => {
        initRegFormTable(page, size, searchTerm, sortOrder, sortField);
    };

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        // Debounce logic remains the same
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            setPage(1);

            try {
                setIsLoading(true);
                const response = await registrationFormIndex(size, 1, value, sortOrder, sortField);

                const data = response?.data || [];
                setRegForm(data);
                setTotalItems(response?.totalCount || 0);
            } catch (error) {
                console.error('Error searching products:', error);
                setError('Failed to search products');
            } finally {
                setIsLoading(false);
            }

        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);
        initRegFormTable(newPage, size, searchTerm, sortOrder, sortField);
    };

    const handleSizeChange = (newSize: number) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size
        initRegFormTable(1, newSize, searchTerm, sortOrder, sortField);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Cycle through states: null -> asc -> desc -> null
            if (sortOrder === null) {
                setSortOrder('asc');
                initRegFormTable(page, size, searchTerm, 'asc', field);
            } else if (sortOrder === 'asc') {
                setSortOrder('desc');
                initRegFormTable(page, size, searchTerm, 'desc', field);
            } else {
                setSortOrder(null);
                setSortField('');
                initRegFormTable(page, size, searchTerm, null, '');
            }
        } else {
            // New field, start with ascending
            setSortField(field);
            setSortOrder('asc');
            initRegFormTable(page, size, searchTerm, 'asc', field);
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

    const handleApproveRegForm = async (id: number) => {
        try {
            const response = await approveRegistrationForm(Number(id));

            if (response?.data.success) {
                notify('success', 'Registration form approved');
                handleRefreshTable();
            }
        } catch (error) {
            notify('error', 'Registration form approval failed');
            console.log(error);
        }
    }

    const handleRejectRegForm = async (id: number) => {
        try {
            const response = await rejectRegistrationForm(Number(id));

            if (response?.data.success) {
                notify('success', 'Registration form rejected');
                handleRefreshTable();
            }
        } catch (error) {
            notify('error', 'Registration form rejection failed');
            console.log(error);
        }
    }

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center flex-wrap">
                    <span className="text-2xl font-bold text-gray-900">
                        Registration Form Requests
                    </span>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            className="btn btn-sm btn-outline btn-info copy-link flex justify-center gap-2"
                            data-clipboard-text={`${APP_URL}owner/reno-registration-form`}
                        >
                            <i className="ki-filled ki-copy"></i>
                            <span>Copy Registration Link</span>
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header flex-wrap gap-2">
                        <div className="card-title">
                            Owner Registration Form Overview
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
                                        placeholder="Search packages"
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
                                    <input className="regForm-2" name="check" type="checkbox" value="1" />
                                    <span className="switch-label regForm-1">Push Alerts</span>
                                </label> */}
                            </div>
                        </div>
                    </div>
                    <div className="card-table">
                        <table className="table align-middle text-gray-700 font-medium text-sm">
                            <thead>
                                <tr>
                                    {/* <th
                                        className='w-[150px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Owner Name {getSortIcon('name')}
                                        </div>
                                    </th> */}
                                    <th className='w-[150px] text-center'>Owner Name</th>
                                    <th
                                        className='w-[80px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('form_no')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Form No {getSortIcon('form_no')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[100px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('phone_no')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Phone No. {getSortIcon('phone_no')}
                                        </div>
                                    </th>
                                    <th
                                        className='w-[150px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Email {getSortIcon('email')}
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
                                    <th
                                        className='w-[100px] text-center cursor-pointer hover:bg-gray-50'
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Submitted At {getSortIcon('created_at')}
                                        </div>
                                    </th>
                                    <th className='w-[80px] text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regForms.length > 0 ? (
                                    regForms.map((regForm, regFormIndex) => (
                                        <tr
                                            key={regFormIndex}
                                            className={`${regFormIndex % 2 === 0 ? '' : 'bg-gray-100'}`}
                                        >
                                            <td>
                                                {regForm.user.name_first} {regForm.user.name_last}
                                            </td>
                                            <td>
                                                {regForm.form_no}
                                            </td>
                                            <td className='text-center'>
                                                {regForm.user.country_code} {regForm.user.phone_no}
                                            </td>
                                            <td className='text-center'>
                                                {regForm.user.email}
                                            </td>
                                            <td className='text-center'>
                                                <span className={`badge badge-pill p-2 cursor-default
                                                    ${regForm.status === 'rejected' ? 'badge-danger' : ''} 
                                                    ${regForm.status === 'approved' ? 'badge-success' : ''} 
                                                    badge-outline`}
                                                >
                                                    {regForm.status.charAt(0).toUpperCase() + regForm.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className='text-center'>
                                                {regForm.created_at
                                                    ? new Date(regForm.created_at).toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })
                                                    : 'N/A'}
                                            </td>
                                            <td className='text-center'>
                                                <div className="flex justify-around gap-2">
                                                    <Link
                                                        to={'/registration-forms/' + regForm.id}
                                                        className="btn-edit btn btn-sm btn-light"
                                                    >
                                                        View
                                                    </Link>

                                                    {regForm.status !== 'approved' && regForm.status !== 'rejected' ?
                                                        <>
                                                            {regForm.other_property === null &&
                                                                <button
                                                                    className="btn-delete btn btn-sm btn-success ${!regForm.property ? 'disabled' : ''}"
                                                                    data-action="approve"
                                                                    data-id="${data.id}"
                                                                    data-modal-toggle="#confirm_item_modal"
                                                                    onClick={() => handleApproveRegForm(Number(regForm.id))}
                                                                >
                                                                    Approve
                                                                </button>
                                                            }
                                                            <button
                                                                className="btn-delete btn btn-sm btn-danger"
                                                                onClick={() => handleRejectRegForm(Number(regForm.id))}
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                        :
                                                        (regForm.status === 'approved' ?
                                                            <Link
                                                                to={`/orders/create?formId=${regForm.id}`}
                                                                className="btn-create-quotation btn btn-sm btn-info"
                                                            >
                                                                Create Quotation
                                                            </Link>
                                                            :
                                                            ''
                                                        )
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center text-gray-500">
                                            No regForms available
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
        </>
    );
}

export default RegistrationFormMain;