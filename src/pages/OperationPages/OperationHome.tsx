import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRPMDIForms, fetchQCForms, retrieveRenoProgresses, userDetail } from "../../services/operationApi";
import { DefectInspectionForm, QCForm, RenoProgress, User } from "../../types";
import Loading from "../../components/Loading";
import KTComponents from "../../metronic/core";
import { logoutOperation } from "../../services/auth";
import { Slide, toast } from "react-toastify";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/op/' : '/';

type SortOrder = 'asc' | 'desc' | null;

function OperationHome() {
    const [activeTab, setActiveTab] = useState('tab_1_1');
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [user, setUser] = useState<User>(null);
    const [renoProgresses, setRenoProgresses] = useState<RenoProgress[] | null>(null);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [qcForms, setQCForms] = useState<QCForm[] | null>(null);
    const [diForms, setDIForms] = useState<DefectInspectionForm[] | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [size, setSize] = useState<number>(5);
    const [sortField, setSortField] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);

    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState('');

    const toggleStatus = (status: string, tab: string) => {
        const newFilter = status === filterStatus ? '' : status;
        setPage(1);
        setSearchTerm('');

        setFilterStatus(prevStatus => (prevStatus === status ? null : status));

        if (tab === 'tab_1_1') {
            initRenoProgress(1, size, searchTerm, sortOrder, sortField, newFilter);
        } else if (tab === 'tab_1_2') {
            initDiForms(1, size, searchTerm, sortOrder, sortField, newFilter);
        } else if (tab === 'tab_1_3') {
            //
        }

    };

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
        document.title = "Operation Home | RenoXpert";
        KTComponents.init();

        const initFunction = async () => {
            await getUserDetail();
            await getRenoProgress();
            // await getDIForms();
            // await getQCForms();
        }

        initFunction();
    }, []);

    const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);
        setPage(1);

        // Debounce logic remains the same
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(async () => {
            try {
                setLoading(true);

                if (activeTab === 'tab_1_1') {
                    const response = await retrieveRenoProgresses(size, 1, value);

                    const data: RenoProgress[] = response?.data || [];
                    setRenoProgresses(data);

                    setTotalItems(response?.totalCount || 0);

                } else if (activeTab === 'tab_1_2') {
                    const response = await fetchRPMDIForms(size, 1, value);

                    const data: DefectInspectionForm[] = response?.data || [];
                    setDIForms(data);

                    setTotalItems(response?.totalCount || 0);
                }
            } catch (error) {
                console.error('Error searching renoProgress:', error);
            } finally {
                setLoading(false);
            }
        }, 500);
    };

    const initRenoProgress = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string,
        status?: string
    ) => {
        try {
            setLoading(true);
            const response = await retrieveRenoProgresses(size, page, searchTerm, order, field, status);
            const data = response?.data || [];
            setRenoProgresses(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching renoProgress:', error);
            notify('error', 'Failed to load renoProgress');
        } finally {
            setLoading(false);
        }
    }

    const initDiForms = async (
        page: number,
        size: number,
        searchTerm?: string,
        order?: string,
        field?: string,
        status?: string
    ) => {
        try {
            setLoading(true);
            const response = await fetchRPMDIForms(size, page, searchTerm, order, field, status, true);
            const data = response?.data || [];
            setDIForms(data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.error('Error fetching renoProgress:', error);
            notify('error', 'Failed to load renoProgress');
        } finally {
            setLoading(false);
        }
    }

    const getUserDetail = async () => {
        setLoading(true);
        try {
            const response = await userDetail();

            setUser(response);

        } catch (error) {
            console.log(error);

        }
        setLoading(false);
    }

    const getRenoProgress = async () => {
        setLoading(true);
        try {
            const response = await retrieveRenoProgresses();

            setRenoProgresses(response.data);
            setTotalItems(response?.totalCount || 0);
        } catch (error) {
            console.log(error);
        }
        setLoading(false);
    }

    const getDIForms = async () => {
        setLoading(true);
        try {
            const response = await fetchRPMDIForms(5, 1, '', 'asc', '', '', true);

            if (response.success) {
                setDIForms(response.data);
            }

        } catch (error) {
            console.log(error);
        }
        setLoading(false);
    }

    const getQCForms = async () => {
        setLoading(true);
        try {
            const response = await fetchQCForms();

            if (response.success) {
                setQCForms(response.data);
            }

        } catch (error) {
            console.log(error);
        }
        setLoading(false);
    }

    const handleLogout = async () => {
        try {
            await logoutOperation();
            // Redirect to login page or home page
            window.location.href = LOCAL_PATH_PREFIX; // Adjust the redirection path as needed
        } catch (error) {
            console.error('Logout failed:', error);
            // Optionally show an error message to the user
        }
    };

    const handlePageChange = (newPage: number, tab: string) => {
        if (newPage < 1 || newPage > Math.ceil(totalItems / size)) return;
        setPage(newPage);

        if (tab === 'tab_1_1') {
            initRenoProgress(newPage, size, searchTerm, sortOrder, sortField, filterStatus);
        } else if (tab === 'tab_1_2') {
            initDiForms(newPage, size, searchTerm, sortOrder, sortField, filterStatus);
        } else if (tab === 'tab_1_3') {
            //
        }
    };

    const handleSizeChange = (newSize: number, tab: string) => {
        setSize(newSize);
        setPage(1); // Reset to the first page when changing the page size

        if (tab === 'tab_1_1') {
            initRenoProgress(1, newSize, searchTerm, sortOrder, sortField, filterStatus);
        } else if (tab === 'tab_1_2') {
            initDiForms(1, newSize, searchTerm, sortOrder, sortField, filterStatus);
        } else if (tab === 'tab_1_3') {
            //
        }
    };

    const handleChangeTab = (tab: string) => {
        setPage(1);
        setSize(5);
        setSearchTerm('');

        setActiveTab(tab);
        setFilterStatus('');

        if (tab === 'tab_1_1') {
            initRenoProgress(1, 5, '', 'asc', '', '');
        } else if (tab === 'tab_1_2') {
            initDiForms(1, 5, '', 'asc', '', '');
        } else if (tab === 'tab_1_3') {
            //
        }
    }

    const totalPages = Math.ceil(totalItems / size);

    return (
        <>
            {loading && <Loading />}

            <div className="flex w-full px-2 mb-4">
                <span className="text-slate-950 text-xl font-bold">Operation Home</span>
            </div>

            <div className="flex w-full px-4">
                <div className="card w-full rounded-b-none shadow-none border-none bg-slate-950">
                    <div className="card-body flex flex-col">
                        {user ?
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-gray-200 text-xl font-bold capitalize">{user.name}</span>
                                    <span className="text-gray-300 text-sm font-medium">+60 {user.phone_no.replace(/(\d{2})\d{4}(\d{3})/, '$1***$2')}</span>
                                </div>
                                <div className="text-danger">
                                    <button
                                        className="btn btn-icon"
                                        onClick={handleLogout}
                                    >
                                        <i className="ki-filled ki-entrance-right text-xl font-semibold"></i>
                                    </button>
                                </div>
                            </div>
                            :
                            <div className="animate-pulse flex flex-col gap-4">
                                <span className="h-4 bg-slate-700 rounded text-xl font-bold capitalize"></span>
                                <span className="h-2 bg-slate-700 rounded text-gray-300 text-sm font-medium w-1/2"></span>
                            </div>
                        }
                    </div>
                </div>
            </div>

            <div className="card w-full">
                <div className="card-body p-4">
                    <div className="flex flex-col">
                        <div className="tabs gap-8 mb-4" data-tabs="true">
                            <button
                                className={`tab py-1 pb-4 ${activeTab === 'tab_1_1' ? 'active' : ''}`}
                                onClick={() => handleChangeTab('tab_1_1')}
                            >
                                <span>Reno Tracker</span>
                            </button>
                            <button
                                className={`tab py-1 pb-4 ${activeTab === 'tab_1_2' ? 'active' : ''}`}
                                onClick={() => handleChangeTab('tab_1_2')}
                            >
                                <span>Defect Inspection</span>
                            </button>
                            <button
                                className={`tab py-1 pb-4 ${activeTab === 'tab_1_3' ? 'active' : ''}`}
                                onClick={() => handleChangeTab('tab_1_3')}
                            >
                                <span>QC</span>
                            </button>
                        </div>


                        <div className={activeTab === 'tab_1_1' ? '' : 'hidden'} id="tab_1_1">
                            <div className="flex flex-col gap-4">
                                <div className="flex">
                                    <label className="input border-none">
                                        <i className="ki-filled ki-magnifier"></i>
                                        <input
                                            placeholder="Search units"
                                            type="text"
                                            value={searchTerm}
                                            onChange={handleSearch}
                                        />
                                    </label>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        className="btn btn-sm btn-light rounded-full disabled"
                                        data-drawer-toggle="#drawer_2_4"
                                    >
                                        <i className="ki-filled ki-sort"></i>
                                        Sort
                                    </button>
                                    <button
                                        className={`btn btn-sm rounded-full ${filterStatus === 'in_progress' ? 'btn-success btn-outline' : 'btn-light'}`}
                                        onClick={() => toggleStatus('in_progress', 'tab_1_1')}
                                    >
                                        WIP
                                        {
                                            filterStatus === 'in_progress' &&
                                            <i className="ki-filled ki-cross"></i>
                                        }
                                    </button>
                                    <button
                                        className={`btn btn-sm rounded-full ${filterStatus === 'done' ? 'btn-success btn-outline' : 'btn-light'}`}
                                        onClick={() => toggleStatus('done', 'tab_1_1')}
                                    >
                                        Done
                                        {
                                            filterStatus === 'done' &&
                                            <i className="ki-filled ki-cross"></i>
                                        }
                                    </button>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {
                                        loading ? (
                                            <div className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200">
                                                <div className="card-body flex justify-between items-center p-4">
                                                    <div className="flex items-center gap-4">
                                                        {/* Icon placeholder */}
                                                        <div className="relative size-[36px] shrink-0">
                                                            <div className="w-full h-full rounded-lg bg-slate-200"></div>
                                                        </div>

                                                        {/* Text content placeholders */}
                                                        <div className="flex flex-col gap-1">
                                                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                                                        </div>
                                                    </div>

                                                    {/* Right side content placeholders */}
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-end">
                                                            <div className="h-5 w-12 bg-slate-200 rounded-full"></div>
                                                        </div>
                                                        <div className="h-4 w-20 bg-slate-200 rounded"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            renoProgresses &&
                                                renoProgresses.filter((progress) =>
                                                    !filterStatus || progress.status === filterStatus
                                                ).length > 0 ? (
                                                renoProgresses
                                                    .filter((progress) =>
                                                        !filterStatus || progress.status === filterStatus
                                                    )
                                                    .map((progress, index) => (
                                                        <Link
                                                            to={LOCAL_PATH_PREFIX + 'reno/progress/' + progress.id}
                                                            className="card shadow-none rounded-lg" key={index}
                                                        >
                                                            <div className="card-body flex justify-between items-center p-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="relative size-[36px] shrink-0">
                                                                        <svg className="w-full h-full stroke-info-clarity fill-info-light" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill="#EFF6FF">
                                                                            </path>
                                                                            <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="#1B84FF" strokeOpacity="0.2">
                                                                            </path>
                                                                        </svg>
                                                                        <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                                            <i className="ki-outline ki-tablet-text-down ps-px text-info"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <h3 className="text-gray-900 text-xs font-medium">
                                                                            {progress.property.block}-{progress.property.floor}-{progress.property.unit_no}
                                                                        </h3>
                                                                        <div className="flex">
                                                                            <span className="text-gray-900 text-xs">{progress.property.name}</span>
                                                                            <span></span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex justify-end">
                                                                        <div className="badge badge-pill badge-sm">
                                                                            WIP
                                                                        </div>
                                                                    </div>
                                                                    {/* <span className="text-gray-900 text-xs">
                                                                        {(((progress.pre_reno_completion * 0.2) + (progress.p1_completion * 0.175) + (progress.p2a_completion * 0.175) + (progress.p2b_completion * 0.175) + (progress.iot_completion * 0.175) + (progress.post_reno_completion * 0.1)) * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% Completed
                                                                    </span> */}
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))
                                            ) : (
                                                <span className="text-center text-gray-700 text-sm font-semibold">No progress found</span>
                                            )
                                        )
                                    }
                                </div>

                                {totalPages > 0 && (
                                    <div className="flex flex-col gap-2 justify-center items-center">
                                        <div className="flex items-center gap-2">
                                            Show
                                            <select
                                                className="select select-sm w-16"
                                                name="perpage"
                                                value={size}
                                                onChange={(e) => handleSizeChange(parseInt(e.target.value), 'tab_1_1')}
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
                                            {/* <span>{(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}</span> */}
                                            <div className="pagination">
                                                {/* Previous Page Button */}
                                                <button
                                                    className={`btn ${page === 1 ? 'disabled' : ''}`}
                                                    onClick={() => handlePageChange((page - 1), 'tab_1_1')}
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
                                                                    onClick={() => handlePageChange(1, 'tab_1_1')}
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
                                                                    onClick={() => handlePageChange(currentPage, 'tab_1_1')}
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
                                                                    onClick={() => handlePageChange(totalPages, 'tab_1_1')}
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
                                                    onClick={() => handlePageChange((page + 1), 'tab_1_1')}
                                                >
                                                    <i className="ki-outline ki-black-right"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={activeTab === 'tab_1_2' ? '' : 'hidden'} id="tab_1_2">
                            <div className="flex flex-col gap-4">
                                <div className="flex">
                                    <label className="input border-none">
                                        <i className="ki-filled ki-magnifier"></i>
                                        <input
                                            placeholder="Search units"
                                            type="text"
                                            value={searchTerm}
                                            onChange={handleSearch}
                                        />
                                    </label>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        className="btn btn-sm btn-light rounded-full disabled"
                                        data-drawer-toggle="#drawer_2_4"
                                    >
                                        <i className="ki-filled ki-sort"></i>
                                        Sort
                                    </button>
                                    <button
                                        className={`btn btn-sm rounded-full ${filterStatus === 'not_submitted' ? 'btn-success btn-outline' : 'btn-light'}`}
                                        onClick={() => toggleStatus('not_submitted', 'tab_1_2')}
                                    >
                                        Not Submitted
                                        {
                                            filterStatus === 'not_submitted' &&
                                            <i className="ki-filled ki-cross"></i>
                                        }
                                    </button>
                                    <button
                                        className={`btn btn-sm rounded-full ${filterStatus === 'submitted' ? 'btn-success btn-outline' : 'btn-light'}`}
                                        onClick={() => toggleStatus('submitted', 'tab_1_2')}
                                    >
                                        Completed
                                        {
                                            filterStatus === 'submitted' &&
                                            <i className="ki-filled ki-cross"></i>
                                        }
                                    </button>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {
                                        loading ? (
                                            <div className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200">
                                                <div className="card-body flex justify-between items-center p-4">
                                                    <div className="flex items-center gap-4">
                                                        {/* Icon placeholder */}
                                                        <div className="relative size-[36px] shrink-0">
                                                            <div className="w-full h-full rounded-lg bg-slate-200"></div>
                                                        </div>
                                                        {/* Text content placeholders */}
                                                        <div className="flex flex-col gap-1">
                                                            <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                                                        </div>
                                                    </div>
                                                    {/* Right side content placeholders */}
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-end">
                                                            <div className="h-5 w-12 bg-slate-200 rounded-full"></div>
                                                        </div>
                                                        <div className="h-4 w-20 bg-slate-200 rounded"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            diForms &&
                                                diForms.filter((diForm) =>
                                                    !filterStatus || diForm.status === filterStatus
                                                ).length > 0 ? (
                                                diForms
                                                    .filter((diForm) =>
                                                        !filterStatus || diForm.status === filterStatus
                                                    )
                                                    .map((diForm: DefectInspectionForm, index: number) => (
                                                        <Link
                                                            to={LOCAL_PATH_PREFIX + `reno/defect-inspection-form/${diForm.id}`}
                                                            className="card shadow-none rounded-lg" key={index}
                                                        >
                                                            <div className="card-body flex justify-between items-center p-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="relative size-[36px] shrink-0">
                                                                        <svg className={`w-full h-full stroke-${diForm.status === 'submitted' ? 'success' : 'warning'}-clarity fill-${diForm.status === 'submitted' ? 'success' : 'warning'}-light`} fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill={`#${diForm.status === 'submitted' ? 'e6fce3' : 'fcf9e3'}`}>
                                                                            </path>
                                                                            <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="#1B84FF" strokeOpacity="0.2">
                                                                            </path>
                                                                        </svg>
                                                                        <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                                            <i className={`ki-outline ki-tab-tablet ps-px text-${diForm.status === 'submitted' ? 'success' : 'warning'}`}></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <h3 className="text-gray-900 text-xs font-medium">
                                                                            {diForm.property.block}-{diForm.property.level}-{diForm.property.unit}
                                                                        </h3>
                                                                        <div className="flex">
                                                                            <span className="text-gray-900 text-xs">{diForm.property.property_name}</span>
                                                                            <span></span>
                                                                        </div>
                                                                        {diForm.status === 'submitted' && (
                                                                            <div className="flex">
                                                                                <span className="text-gray-600 text-xs italic">Submitted by: {diForm.contractor_name}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex justify-end">
                                                                        <div className={`badge badge-pill badge-sm badge-outline badge-${diForm.status === 'submitted' ? 'success' : 'warning'}`}>
                                                                            {diForm.status === 'submitted' ? 'Submitted' : 'Not Submitted'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))
                                            ) : (
                                                <span className="text-center text-gray-700 text-sm font-semibold">No progress found</span>
                                            )
                                        )
                                    }
                                </div>

                                {totalPages > 0 && (
                                    <div className="flex flex-col gap-2 justify-center items-center">
                                        <div className="flex items-center gap-2">
                                            Show
                                            <select
                                                className="select select-sm w-16"
                                                name="perpage"
                                                value={size}
                                                onChange={(e) => handleSizeChange(parseInt(e.target.value), 'tab_1_2')}
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
                                            {/* <span>{(page - 1) * size + 1}-{Math.min(page * size, totalItems)} of {totalItems}</span> */}
                                            <div className="pagination">
                                                {/* Previous Page Button */}
                                                <button
                                                    className={`btn ${page === 1 ? 'disabled' : ''}`}
                                                    onClick={() => handlePageChange((page - 1), 'tab_1_2')}
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
                                                                    onClick={() => handlePageChange(1, 'tab_1_2')}
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
                                                                    onClick={() => handlePageChange(currentPage, 'tab_1_2')}
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
                                                                    onClick={() => handlePageChange(totalPages, 'tab_1_2')}
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
                                                    onClick={() => handlePageChange(page + 1, 'tab_1_2')}
                                                >
                                                    <i className="ki-outline ki-black-right"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={activeTab === 'tab_1_3' ? '' : 'hidden'} id="tab_1_3">
                            <span>QC Form</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="drawer drawer-bottom flex flex-col rounded-t-lg" data-drawer="true" id="drawer_2_4">
                <div className="py-4">
                    <div className="card-group">
                        <button
                            className="btn btn-clear"
                        >
                            <span className="text-gray-900 font-normal">By Start Date</span>
                        </button>
                    </div>
                    <div className="card-group">
                        <button
                            className="btn btn-clear"
                        >
                            <span className="text-gray-900 font-normal">By Completion</span>
                        </button>
                    </div>
                    <div className="card-group">
                        <button
                            className="btn btn-clear"
                        >
                            <span className="text-gray-900 font-normal">By Status</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* <div className="flex flex-col w-full px-4">
                <div className="flex flex-col" data-tabs="true">
                    <div className="btn-tabs mb-4">
                        <button className="btn active" data-tab-toggle="#tab_1">DI Form</button>
                        <button className="btn" data-tab-toggle="#tab_2">QC Form</button>
                    </div>


                    <div className="" id="tab_1">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-bold text-slate-900">DI Forms</span>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {!diForms ? <Loading /> :
                                diForms.length === 0 ? <div className="text-center w-full">No Defect Inspection Forms available</div> :
                                    diForms.map((diForm, index) => (
                                        <Link
                                            to={diForm.status === 'saved' ? `/reno/defect-inspection-form?diFormId=${diForm.id}` : `/reno/defect-inspection-forms/${diForm.id}/detail`}
                                            key={index}
                                            className="card w-full sm:w-[calc(50%-0.5rem)] cursor-pointer"
                                        >
                                            <div className="card-body flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-600">
                                                                Property Under Defect Inspection:
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium">
                                                                {diForm.property.block}-{diForm.property.level}-{diForm.property.unit} ({diForm.property.property_name})
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-600">
                                                                Last Update:
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium">
                                                                {diForm.updated_at
                                                                    ? new Intl.DateTimeFormat('en-GB', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    }).format(new Date(diForm.updated_at))
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="status">
                                                    <span className={`badge badge-pill badge-outline gap-1 items-center`}>
                                                        {diForm.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                            }
                        </div>
                    </div>

                    <div className="hidden" id="tab_2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-bold text-slate-900">QC Forms</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                            {!qcForms ? <Loading /> :
                                qcForms.length === 0 ? <div className="text-center w-full">No QC Forms available</div> :
                                    qcForms.map((qcForm, index) => (
                                        <Link
                                            to={qcForm.status === 'saved' ? `/reno/qc-form?qcFormId=${qcForm.id}` : `/reno/qc-forms/${qcForm.id}/detail`}
                                            key={index}
                                            className="card w-full sm:w-[calc(50%-0.5rem)] cursor-pointer"
                                        >
                                            <div className="card-body flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-600">
                                                                Property Under QC:
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium">
                                                                {qcForm.property.block}-{qcForm.property.level}-{qcForm.property.unit} ({qcForm.property.property_name})
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-600">
                                                                Last Update:
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium">
                                                                {qcForm.updated_at
                                                                    ? new Intl.DateTimeFormat('en-GB', {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    }).format(new Date(qcForm.updated_at))
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="status">
                                                    <span className={`badge badge-pill badge-outline gap-1 items-center`}>
                                                        {qcForm.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                            }
                        </div>
                    </div>
                </div>
            </div> */}
        </>
    )
}

export default OperationHome;