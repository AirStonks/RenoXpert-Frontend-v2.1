
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import KTComponents from "../../metronic/core";
import useFetchRenoProgress from "../../hook/useFetchRenoProgress";
import { DefectInspectionForm, Permission, RenoProgress, User } from "../../types";
import { permissionIndex } from "../../services/api";
import { Slide, toast } from "react-toastify";
import ClipboardJS from "clipboard";
import Loading from "../../components/Loading";
import RPMDetailV2 from "./components/RPMDetailV2";
import RPMDetailV3 from "./components/RPMDetailV3";
import DIRLinkManagementModal from "./components/Modals/DIRLinkManagementModal";
import ProjectDateManagementModal from "./components/Modals/ProjectDateManagementModal";

function ProgressMgnt() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { renoProgressDetail, loading, error } = useFetchRenoProgress(renoProgressId);
    const [renoProgress, setRenoProgress] = useState<RenoProgress | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [users, setUsers] = useState<User[]>([]);

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
        document.title = "Project Detail | RenoXpert";

        const initFunctions = async () => {
            if (renoProgressDetail) {
                await setRenoProgress(renoProgressDetail); // Assign renoProgressDetail to renoProgress
                await getPermissions();

                // handleSearchRenoProgress(renoProgressDetail.id);
            }

            await new Promise(resolve => setTimeout(resolve, 1));

            KTComponents.init();
        }

        const getPermissions = async () => {
            try {
                const response = await permissionIndex();
                if (response?.data.length > 0) {
                    setPermissions(response.data);
                } else {
                    notify('error', 'Failed to fetch permissions');
                }
            } catch (error) {
                notify('error', 'Failed to fetch permissions');
            }
        };

        initFunctions();

        const clipboard = new ClipboardJS('.copy-link');

        clipboard.on('success', function (e) {
            notify('success', 'Copied to clipboard!');
            e.clearSelection();
        });

        return () => {
            clipboard.destroy();
        };

    }, [renoProgressDetail]); // This effect runs when renoProgressDetail changes

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/reno-progress/overview');
        }
    };

    const handleUpdateDIForm = (newFormData: DefectInspectionForm) => {
        if (renoProgress) {
            setRenoProgress({
                ...renoProgress,
                defect_inspection_form: newFormData
            });
        }
    };

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!renoProgress) return <div>An unexpected error occured</div>;

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            <div className="flex justify-between items-center flex-wrap mb-6">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                    <span className="text-2xl font-bold text-gray-900">
                        Reno Progress Detail
                    </span>
                </div>
                <div className="flex gap-3">
                    <span className="badge badge-xs badge-outline">v{renoProgress.rpm_version}</span>
                    <div className="dropdown" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click">
                        <button className="dropdown-toggle btn btn-icon btn-outline btn-light btn-sm" >
                            <i className="ki-filled ki-dots-vertical"></i>
                        </button>

                        <div className="dropdown-content menu menu-default w-full max-w-64 py-2" data-dropdown-dismiss="true">
                            <div className="menu-item">
                                <button
                                    className="menu-link"
                                    data-modal-toggle="#dir_link_mgnt_modal"
                                >
                                    <span className="menu-title">
                                        <div className="flex gap-2 items-center">
                                            <i className="ki-filled ki-compass text-lg"></i>
                                            <span>DIR MO Access Management</span>
                                        </div>
                                    </span>
                                </button>
                            </div>
                            <div className="menu-item">
                                {/* <Link
                                to={/purchase-orders/print/payment-voucher/${poId}}
                                className="menu-link"
                            >
                                <span className="menu-title">
                                    <div className="flex gap-2 items-center">
                                        <i className="ki-filled ki-file-down text-lg"></i>
                                        <span>Print Payment Voucher</span>
                                    </div>
                                </span>
                            </Link> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {renoProgress.rpm_version === 1 || renoProgress.rpm_version === 2 ?
                <RPMDetailV2
                    renoProgress={renoProgress}
                    setRenoProgress={setRenoProgress}
                    permissions={permissions}
                    users={users}
                    setUsers={setUsers}
                />
                :
                null
            }

            <DIRLinkManagementModal
                diForm={renoProgress.defect_inspection_form}
                setDiForm={handleUpdateDIForm}
            />

            <ProjectDateManagementModal
                renoProgress={renoProgress}
                setRenoProgress={setRenoProgress}
            />
        </>
    )

    if (renoProgress.rpm_version === 1 || renoProgress.rpm_version === 2) {
        return (
            <RPMDetailV2
                renoProgress={renoProgress}
                permissions={permissions}
                users={users}
            />
        )
    } else if (renoProgress.rpm_version === 3) {
        return (
            <RPMDetailV3 />
        )
    }
}

export default ProgressMgnt;

