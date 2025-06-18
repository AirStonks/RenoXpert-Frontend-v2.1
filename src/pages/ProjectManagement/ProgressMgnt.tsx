
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import KTComponents from "../../metronic/core";
import useFetchRenoProgress from "../../hook/useFetchRenoProgress";
import { DefectInspectionForm, Permission, RenoProgress, User } from "../../types";
import { fetchOldVersionRenoProgress, permissionIndex, sendRenoToLark } from "../../services/api";
import { Slide, toast } from "react-toastify";
import ClipboardJS from "clipboard";
import Loading from "../../components/Loading";
import RPMDetailV2 from "./components/RPMDetailV2";
import RPMDetailV3 from "./components/RPMDetailV3";
import DIRLinkManagementModal from "./components/Modals/DIRLinkManagementModal";
import ProjectDateManagementModal from "./components/Modals/ProjectDateManagementModal";
import AccessPermissionModal from "./components/Modals/AccessPermissionModal";
import ConvertRenoProgressModal from "./components/Modals/ConvertRenoProgressModal";
import { CalendarIcon } from "lucide-react";
import DateManagementModal from "./components/Modals/DateManagementModal";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

function ProgressMgnt() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isOldVersion, setIsOldVersion] = useState<boolean>(false);

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
                // if header have /old-ver
                if (window.location.href.includes('/old-ver')) {
                    setIsLoading(true);
                    try {
                        const response = await fetchOldVersionRenoProgress(renoProgressId);
                        const oldRenoProgress: RenoProgress = response.data;

                        if (response?.data) {
                            setRenoProgress(oldRenoProgress); // Assign renoProgressDetail to renoProgress
                            setIsOldVersion(true);
                        }
                    } catch (error) {
                        setRenoProgress(renoProgressDetail);
                    } finally {
                        setIsLoading(false);
                    }
                } else {
                    setRenoProgress(renoProgressDetail); // Assign renoProgressDetail to renoProgress
                }
                await getPermissions();
            }

            // await new Promise(resolve => setTimeout(resolve, 1));

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

    }, [renoProgressDetail, renoProgressId]); // This effect runs when renoProgressDetail changes

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate(LOCAL_PATH_PREFIX + 'reno-progress/overview');
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

    const handleSendRenoToLark = async () => {
        try {
            const response = await sendRenoToLark(renoProgressId!);

            if (response?.success) {

                setRenoProgress({
                    ...renoProgress,
                    sent_to_lark_date: response.data.sent_to_lark_date
                });

                notify('success', 'Reno has been sent to Lark successfully.');
                return;
            }
        } catch (error) {
            notify('error', 'Failed to send Reno to Lark.');
        }
    }

    if (loading) return <Loading />;
    if (error) return <div>{error}</div>;
    if (!renoProgress) return <div>An unexpected error occured</div>;

    return (
        <>
            {/* Loading Overlay */}
            {isLoading && <Loading />}

            {isOldVersion && (
                <div className="badge badge-warning badge-lg text-xl badge-outline w-full font-semibold">
                    You are viewing an old version of the Reno Progress, PLEASE DO NOT PERFORM ANY ACTIONS HERE.
                </div>
            )}

            <div className="flex justify-between items-center flex-wrap my-2">
                <div className="flex gap-4 items-center">
                    <button className='text-gray-800 dark:text-gray-400' onClick={handleBackClick}>
                        <i className="ki-solid ki-arrow-left"></i>
                    </button>
                </div>
                <div className="flex gap-3">
                    <span className="text-2xl font-bold text-gray-900">
                        Reno Progress Detail for {renoProgress.property.name} [{renoProgress.sale.order.block}-{renoProgress.sale.order.floor}-{renoProgress.sale.order.unit_no}] ({renoProgress.sale.order.user.name})
                    </span>
                </div>
                <div className="flex gap-3">
                    <span
                        className={`badge badge-xs badge-outline cursor-default ${renoProgress.rpm_version === 3
                            ? 'bg-gradient-to-r from-gray-200 to-yellow-300 font-bold shadow-2xl border-yellow-200 rounded-full uppercase px-3 py-1.5 text-slate-500'
                            : ''
                            }`}
                    >
                        v{renoProgress.rpm_version}
                    </span>
                    {renoProgress.rpm_version !== 3 && !isOldVersion && (
                        <div className="flex">
                            <button
                                className="btn btn-sm btn-primary"
                                data-modal-toggle="#reno-progress-convert-modal"
                            >
                                Convert to v3
                            </button>
                        </div>
                    )}
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
                            {renoProgress.rpm_version === 3 && (
                                <div className="menu-item">
                                    <button
                                        className="menu-link"
                                        data-modal-toggle="#access-permission-modal"
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <i className="ki-filled ki-lock text-lg"></i>
                                                <span>Access Permission</span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            )}
                            {renoProgress.is_converted && !isOldVersion && (
                                <div className="menu-item">
                                    <button
                                        className="menu-link"
                                        onClick={() => window.open('/reno-progress/' + renoProgress.id + '/old-ver', '_blank')}
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <i className="ki-filled ki-archive text-lg"></i>
                                                <span>View Old Version in new tab</span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            )}

                            {renoProgress.rpm_version === 3 && (
                                <div className="menu-item">
                                    <button
                                        className="menu-link"
                                        data-modal-toggle="#date-management-modal"
                                    >
                                        <span className="menu-title">
                                            <div className="flex gap-2 items-center">
                                                <i className="ki-filled ki-calendar text-lg"></i>
                                                <span>Date Management</span>
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div >

            {
                renoProgress.rpm_version === 1 || renoProgress.rpm_version === 2 ? (
                    <>
                        <RPMDetailV2
                            renoProgress={renoProgress}
                            setRenoProgress={setRenoProgress}
                            permissions={permissions}
                            users={users}
                            setUsers={setUsers}
                        />

                        {!isOldVersion &&
                            <DIRLinkManagementModal
                                diForm={renoProgress.defect_inspection_form}
                                setDiForm={handleUpdateDIForm}
                            />
                        }

                        <ProjectDateManagementModal
                            renoProgress={renoProgress}
                            setRenoProgress={setRenoProgress}
                        />

                        <ConvertRenoProgressModal
                            renoProgressId={Number(renoProgress.id)}
                        />
                    </>
                ) : (
                    <>
                        <RPMDetailV3
                            renoProgress={renoProgress}
                            setRenoProgress={setRenoProgress}
                        />

                        <AccessPermissionModal
                            permissions={permissions}
                            setPermissions={setPermissions}
                            renoProgress={renoProgress}
                            setRenoProgress={setRenoProgress}
                            users={users}
                            setUsers={setUsers}
                        />

                        <DateManagementModal
                            renoProgress={renoProgress}
                            setRenoProgress={setRenoProgress}
                        />
                    </>
                )
            }
        </>
    )
}

export default ProgressMgnt;

