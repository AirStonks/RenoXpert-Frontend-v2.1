import { useLocation, useNavigate, useParams } from "react-router-dom";
import useFetchRenoProgress from "../../hook/useFetchRenoProgress";
import Loading from "../../components/Loading";
import { useEffect, useRef, useState } from "react";
import KTComponents, { KTDropdown } from "../../metronic/core";
import { DefectInspectionForm, Permission, PhaseJob, RenoProgress, User } from "../../types";
import { addUserItemPermission, changeInternalComment, changeOwnerComment, changeRenoProgressGeneralPermission, changeTaskStatus, changeUserItemPermission, fetchRenoProgress, fetchTaskDocuments, liveUploadTaskAttachment, permissionIndex, removeTaskDocument, removeUserItemPermission, toggleTaskVisibility, uploadTaskDocuments, uploadTaskExternalDocuments, userIndex } from "../../services/api";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";
import { Link } from "react-router-dom";
import imageCompression from 'browser-image-compression';
import ProjectDateManagementModal from "./components/Modals/ProjectDateManagementModal";
import DIRLinkManagementModal from "./components/Modals/DIRLinkManagementModal";

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

function ProgressMgnt() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const [activeTab, setActiveTab] = useState('pre_reno_tab');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { renoProgressDetail, loading, error } = useFetchRenoProgress(renoProgressId);
    const [renoProgress, setRenoProgress] = useState<RenoProgress | null>(null);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [pendingUploadItems, setPendingUploadItems] = useState<File[]>(null);
    const [dragging, setDragging] = useState(false);
    const [draggingExternal, setDraggingExternal] = useState(false);
    const [documentItems, setDocumentItems] = useState<any[]>(null);
    const [selectedDocumentTaskId, setSelectedDocumentTaskId] = useState<number>(null);
    const [documentManageMode, setDocumentManageMode] = useState(false);
    const [externalDocumentManageMode, setExternalDocumentManageMode] = useState(false);

    const [externalDocumentItems, setExternalDocumentItems] = useState<any[]>(null);
    const [pendingExternalUploadItems, setPendingExternalUploadItems] = useState<File[]>([]);

    const maxFiles = 10; // Maximum number of files allowed

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


    if (!renoProgressId) return null; // Early return for null orderId

    const handleBackClick = () => {
        if (state) {
            navigate(state.fromUrl);
        } else {
            navigate('/reno-progress/overview');
        }
    };

    const handleRefresh = async () => {

        try {
            const response = await fetchRenoProgress(renoProgressId);

            if (response?.success) {
                setRenoProgress(response.data);
            }

        } catch (error) {
            console.log(error);
        }
    }

    const handleSearchPermissionUser = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Debounce logic remains the same
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            const dropdownEl = document.querySelector('#search_user_dropdown') as HTMLElement;
            const dropdown = KTDropdown.getInstance(dropdownEl);

            try {
                const response = await userIndex(5, 1, value);
                setUsers(response.data);

            } catch (error) {
                notify('error', error.message);
            } finally {
                dropdown.show();
            }

        }, 500);
    }

    const handleSelectPermissionUser = async (userId: number) => {

        try {
            const response = await addUserItemPermission(userId, 1, Number(renoProgress.resource_item_id));

            if (response?.success) {
                const dropdownEl = document.querySelector('#search_user_dropdown') as HTMLElement;
                const dropdown = KTDropdown.getInstance(dropdownEl);

                dropdown.hide();
                handleRefresh();

                notify('success', 'User added successfully');
            }

        } catch (error) {
            notify('error', error.response.data.message);
        }
    }

    const handleChangeGeneralPermission = async (permissionId: number) => {
        try {
            const response = await changeRenoProgressGeneralPermission(Number(renoProgress.id), permissionId);

            if (response?.success) {
                setRenoProgress(response.data);
                notify('success', 'Permission updated successfully');
            }

        } catch (error) {
            notify('error', error.response.data.message);
        }
    }

    const handleChangePermission = async (userId: number, itemId: number, permissionId: number) => {

        try {
            const response = await changeUserItemPermission(userId, itemId, permissionId);

            if (response?.success) {
                handleRefresh();
                notify('success', 'Permission updated successfully');
            }

        } catch (error) {
            notify('error', error.response.data.message);
        }
    }

    const handleRemoveUserPermission = async (userId: number, itemId: number) => {

        try {
            const response = await removeUserItemPermission(userId, itemId);

            if (response?.success) {
                handleRefresh();
                notify('success', 'Permission removed successfully');
            }

        } catch (error) {
            notify('error', error.response.data.message);
        }
    }

    const handleOwnerCommentChange = async (e: React.ChangeEvent<HTMLInputElement>, taskId: number) => {
        const { value } = e.target;

        // More efficient state update
        setRenoProgress(prevRenoProgress => {
            const updatedPhases = prevRenoProgress.phases.map(phase => ({
                ...phase,
                jobs: phase.jobs.map(job => ({
                    ...job,
                    tasks: job.tasks.map(task =>
                        task.id.toString() === taskId.toString()
                            ? { ...task, owner_comment: value }
                            : task
                    )
                }))
            }));

            return {
                ...prevRenoProgress,
                phases: updatedPhases
            };
        });

        // Debounce logic remains the same
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            try {
                await changeOwnerComment(renoProgressId, taskId, value);
                console.log(renoProgress);

            } catch (error) {
                console.error('Error updating internal comment:', error);

                // Optional: Revert the local state if the API call fails
                setRenoProgress(prevRenoProgress => {
                    const revertedPhases = prevRenoProgress.phases.map(phase => ({
                        ...phase,
                        jobs: phase.jobs.map(job => ({
                            ...job,
                            tasks: job.tasks.map(task =>
                                task.id === taskId.toString()
                                    ? { ...task, internal_comment: task.owner_comment }
                                    : task
                            )
                        }))
                    }));

                    return {
                        ...prevRenoProgress,
                        phases: revertedPhases
                    };
                });
            }
        }, 1000);
    };

    const handleInternalCommentChange = async (e: React.ChangeEvent<HTMLInputElement>, taskId: number) => {
        const { value } = e.target;

        // More efficient state update
        setRenoProgress(prevRenoProgress => {
            const updatedPhases = prevRenoProgress.phases.map(phase => ({
                ...phase,
                jobs: phase.jobs.map(job => ({
                    ...job,
                    tasks: job.tasks.map(task =>
                        task.id.toString() === taskId.toString()
                            ? { ...task, internal_comment: value }
                            : task
                    )
                }))
            }));

            return {
                ...prevRenoProgress,
                phases: updatedPhases
            };
        });

        // Debounce logic remains the same
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            try {
                await changeInternalComment(renoProgressId, taskId, value);
            } catch (error) {
                console.error('Error updating internal comment:', error);

                // Optional: Revert the local state if the API call fails
                setRenoProgress(prevRenoProgress => {
                    const revertedPhases = prevRenoProgress.phases.map(phase => ({
                        ...phase,
                        jobs: phase.jobs.map(job => ({
                            ...job,
                            tasks: job.tasks.map(task =>
                                task.id === taskId.toString()
                                    ? { ...task, internal_comment: task.internal_comment }
                                    : task
                            )
                        }))
                    }));

                    return {
                        ...prevRenoProgress,
                        phases: revertedPhases
                    };
                });
            }
        }, 1000);
    };

    const handleChangeStatus = async (e: React.ChangeEvent<HTMLSelectElement>, id: number) => {

        const status = e.target.value;
        setIsLoading(true);

        try {
            const response = await changeTaskStatus(renoProgressId, id, status);

            if (response?.success) {
                await handleRefresh();
                await notify('success', 'Status updated successfully');
                setIsLoading(false);
                // setRenoProgress((prevData) => {
                //     if (!prevData) return null;

                //     // Update the state immutably
                //     return {
                //         ...prevData,
                //         phases: prevData.phases?.map(phase => ({
                //             ...phase,
                //             jobs: phase.jobs?.map(job => ({
                //                 ...job,
                //                 tasks: job.tasks?.map(task => {
                //                     if (Number(task.id) === id) {
                //                         // Toggle the correct property (either is_supplied or is_installed)
                //                         return response.data;
                //                     }
                //                     return task; // Return the task unchanged if it's not the one to update
                //                 }),
                //             })),
                //         })),
                //     };
                // });
            }
        } catch (error) {
            notify('error', 'Failed to update status');
        }
        setIsLoading(false);
    }

    const handleToggleVisibility = async (taskId: number) => {
        setIsLoading(true);
        try {
            const response = await toggleTaskVisibility(renoProgressId, taskId);
            if (response?.success) {
                const updatedRenoProgress = { ...renoProgress };

                // Loop through the phases, jobs, and tasks to find the task by ID
                updatedRenoProgress.phases?.forEach(phase => {
                    phase.jobs?.forEach(job => {
                        const task = job.tasks?.find(t => Number(t.id) === taskId);
                        if (task) {
                            // Toggle the visibility
                            task.is_visible = !task.is_visible;
                        }
                    });
                });

                // Set the updated renoProgress state
                setRenoProgress(updatedRenoProgress);


                await notify('success', 'Status updated successfully');
            }
        } catch (error) {
            notify('error', 'Failed to update status');
        }
        setIsLoading(false);
    }

    // Handle file selection from input
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files ?? []);
        const newPendingUploadItems = [...pendingUploadItems, ...selectedFiles];

        if (newPendingUploadItems.length + documentItems.length > maxFiles) {
            notify('error', `You can only upload up to ${maxFiles} files.`);
            return;
        }
        setPendingUploadItems(newPendingUploadItems);
    };

    // Handle drag over event
    const handleDragOver = (event) => {
        event.preventDefault();
        setDragging(true); // Set dragging state to true when dragging over
    };

    // Handle drag leave event
    const handleDragLeave = () => {
        setDragging(false); // Set dragging state to false when dragging leaves
    };

    // Handle drop event
    const handleDrop = (event) => {
        event.preventDefault();
        const droppedFiles = event.dataTransfer.files;
        if (pendingUploadItems.length + droppedFiles.length + documentItems.length <= maxFiles) {
            setPendingUploadItems((prevItems) => [
                ...prevItems,
                ...Array.from(droppedFiles),
            ]);
        } else {
            notify('error', `You can only upload up to ${maxFiles} files.`);
        }
        setDragging(false); // Reset dragging state when drop occurs
    };

    // Add these handlers
    const handleExternalDragOver = (event) => {
        event.preventDefault();
        setDraggingExternal(true);
    };

    const handleExternalDragLeave = () => {
        setDraggingExternal(false);
    };

    const handleExternalDrop = (event) => {
        event.preventDefault();
        const droppedFiles = event.dataTransfer.files;
        if (pendingExternalUploadItems.length + droppedFiles.length + externalDocumentItems.length <= maxFiles) {
            setPendingExternalUploadItems((prevItems) => [
                ...prevItems,
                ...Array.from(droppedFiles),
            ]);
        } else {
            notify('error', `You can only upload up to ${maxFiles} external files.`);
        }
        setDraggingExternal(false);
    };

    // Handle file removal
    const removeFile = (index) => {
        setPendingUploadItems((prevItems) => prevItems.filter((_, i) => i !== index));
    };

    const removeServerFile = async (taskId: number, documentIndex: number) => {
        setIsLoading(true);

        try {
            const response = await removeTaskDocument(renoProgressId, taskId, documentIndex);

            if (response?.success) {
                setDocumentItems(response.data);

                if (response.data === null) {
                    setDocumentItems([]);
                }

                notify('success', 'File removed successfully.');
            }

        } catch (error) {
            console.log(error);
        }

        setIsLoading(false);
    }

    // Clear all files
    const clearAllFiles = () => {
        setPendingUploadItems([]);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, taskId: number) => {
        const fileInput = event.target;

        setIsLoading(true);

        if (!fileInput.files || fileInput.files.length === 0) {
            setIsLoading(false);
            return;
        }

        try {
            const options = {
                maxSizeMB: 2, // Max file size (in MB)
                maxWidthOrHeight: 1920, // Max image width/height
                useWebWorker: true, // Use a web worker to compress the image in the background
            };

            const compressedFile = await imageCompression(event.target.files[0], options);

            const compressedImage = new File(
                [compressedFile],
                event.target.files[0].name,
                { type: event.target.files[0].type }
            );

            const response = await liveUploadTaskAttachment(renoProgressId, taskId, compressedImage);

            if (response?.success) {
                setDocumentItems(response.data);
                notify('success', 'File uploaded successfully.');
            }

        } catch (error) {
            notify('error', 'Error while uploading file.');
        }

        setIsLoading(false);
    }

    const handleExternalFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files ?? []);
        const newPendingExternalItems = [...pendingExternalUploadItems, ...selectedFiles];

        if (newPendingExternalItems.length + externalDocumentItems.length > maxFiles) {
            notify('error', `You can only upload up to ${maxFiles} external files.`);
            return;
        }
        setPendingExternalUploadItems(newPendingExternalItems);
    };

    // Add clear handler for external pending items
    const clearAllExternalFiles = () => {
        setPendingExternalUploadItems([]);
    };

    // Add remove handler for external pending items
    const removeExternalFile = (index: number) => {
        setPendingExternalUploadItems(prev => prev.filter((_, i) => i !== index));
    };

    // Upload files (placeholder function)
    const uploadFiles = async (taskId: number) => {
        setIsLoading(true);

        try {
            const response = await uploadTaskDocuments(renoProgressId, taskId, pendingUploadItems);

            if (response?.success) {
                setDocumentItems(response.data);
                setPendingUploadItems([]);

                notify('success', 'Files uploaded successfully.');
            }

        } catch (error) {
            console.log(error);
        }

        setIsLoading(false);
    };

    // Upload files (placeholder function)
    const uploadExternalFiles = async (taskId: number) => {
        setIsLoading(true);

        try {
            const response = await uploadTaskExternalDocuments(renoProgressId, taskId, pendingExternalUploadItems);

            if (response?.success) {
                setExternalDocumentItems(response.data);
                setPendingExternalUploadItems([]);

                notify('success', 'Files uploaded successfully.');
            }

        } catch (error) {
            console.log(error);
        }

        setIsLoading(false);
    };

    const formatFileSize = (size: number) => {
        const KB = 1024;
        const MB = KB * 1024;
        if (size >= MB) {
            return `${(size / MB).toFixed(2)} MB`;
        }
        return `${(size / KB).toFixed(2)} KB`;
    };

    const handleOpenDocumentModal = async (taskId: number) => {
        setSelectedDocumentTaskId(taskId);
        setPendingUploadItems([]);
        setPendingExternalUploadItems([]);

        try {
            const response = await fetchTaskDocuments(renoProgressId, taskId);
            if (response?.success) {
                if (response?.data === null) {
                    setDocumentItems([]);
                    setExternalDocumentItems([]);
                } else {
                    setDocumentItems(response.data.attachments || []);
                    setExternalDocumentItems(response.data.external_attachment || []);
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleCloseDocumentModal = () => {
        setPendingUploadItems(null);
        setDocumentItems(null);
    }

    const calculateJobProgress = (job: PhaseJob) => {
        // Define the status weightages
        const statusWeights = {
            not_started: 0,
            started: 0.25,
            in_progress: 0.75,
            completed: 1,
            not_available: 1,
            submitted: 1,
        };

        // Calculate the weighted sum of task statuses using task_weightage
        const weightedSum = job.tasks.reduce((sum, task) => {
            const statusWeight = statusWeights[task.status] || 0;
            const taskWeight = task.task_weightage || 1; // Use task_weightage or default to 1 if not provided
            return sum + (taskWeight * statusWeight);
        }, 0);

        // Calculate total task weight (sum of all task weights)
        const totalWeight = job.tasks.reduce((sum, task) => sum + (task.task_weightage || 1), 0); // Default to 1 if task_weightage is not present

        // Return the progress percentage (multiply by 100 to get percentage)
        return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
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

            <div className="flex mb-6 gap-4">
                <div className="card flex-1">
                    <div className="card-header">
                        <div className="card-title">
                            Project Completion
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="flex flex-col mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-lg text-gray-900 font-semibold">Pre Reno</span>
                                <span className="text-xs">{(renoProgress.pre_reno_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                {/* Paid progress bar (inner) */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                    style={{
                                        width: `${renoProgress.pre_reno_completion * 100}%`,
                                        height: '8px'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-lg text-gray-900 font-semibold">Reno</span>
                            </div>
                            {['p1', 'p2a', 'p2b', 'iot'].map((key) => {
                                const completionKey = `${key}_completion` as keyof RenoProgress; // Type assertion
                                const completionValue = renoProgress[completionKey];

                                // Ensure completionValue is a number
                                if (typeof completionValue !== 'number') {
                                    return null; // Skip rendering if the value is not a number
                                }

                                return (
                                    <div key={key} className="flex flex-col flex-1 mb-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-900 font-semibold">{key.toUpperCase()}</span>
                                            <span className="text-xs">
                                                {(completionValue * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-[8px] relative overflow-hidden">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                style={{ width: `${completionValue * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-lg text-gray-900 font-semibold">Post Reno</span>
                                <span className="text-xs">{(renoProgress.post_reno_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                {/* Paid progress bar (inner) */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                    style={{
                                        width: `${renoProgress.post_reno_completion * 100}%`,
                                        height: '8px'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card flex-1">
                    <div className="card-header">
                        <div className="card-title">
                            Owner & Property
                        </div>
                    </div>
                    <div className="card-body">
                        <table className="table-auto">
                            <tbody>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                        Owner:
                                    </td>
                                    <td className="text-sm text-gray-900 pb-3">
                                        {renoProgress.sale.order.user.name}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                        Property:
                                    </td>
                                    <td className="text-sm text-gray-900 pb-3">
                                        {renoProgress.sale.order.property.name}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                        Unit:
                                    </td>
                                    <td className="text-sm text-gray-900 pb-3">
                                        {renoProgress.sale.order.block}-{renoProgress.sale.order.floor}-{renoProgress.sale.order.unit_no}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                        Address:
                                    </td>
                                    <td className="text-sm text-gray-900 pb-3">
                                        {renoProgress.sale.order.property.address}, {renoProgress.sale.order.property.street}, {renoProgress.sale.order.property.postcode}, {renoProgress.sale.order.property.city}, {renoProgress.sale.order.property.state}
                                    </td>
                                </tr>
                                <tr>
                                </tr>
                                <tr>
                                </tr>
                                <tr>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card flex-1">
                    <div className="card-header">
                        <div className="card-title">
                            Date Management
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="flex flex-col mb-4 gap-2">
                            <span className="text-gray-900 font-semibold">Owner Scheduld:</span>
                            <div className="flex gap-4">
                                <span className="badge badge-lg">
                                    {renoProgress.contractual_start_date
                                        ? new Date(renoProgress.contractual_start_date).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })
                                        : '-'}
                                </span>
                                <span className="text-gray-900">to</span>
                                <span className="badge badge-lg">
                                    {renoProgress.contractual_end_date
                                        ? new Date(renoProgress.contractual_end_date).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })
                                        : '-'}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-gray-900 font-semibold">Sub Contractor Schedule:</span>
                            <div className="flex gap-4">
                                <span className="badge badge-lg">
                                    {renoProgress.contractor_start_date
                                        ? new Date(renoProgress.contractor_start_date).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })
                                        : '-'}
                                </span>
                                <span className="text-gray-900">to</span>
                                <span className="badge badge-lg">
                                    {renoProgress.contractor_end_date
                                        ? new Date(renoProgress.contractor_end_date).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })
                                        : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="card-footer flex justify-center items-center">
                        <Link
                            to={'#date-management'}
                            className="btn-link"
                            data-modal-toggle="#date_management_modal"
                        >
                            View more
                        </Link>
                    </div>
                </div>
                <div className="card flex-[2]">
                    <div className="card-header">
                        <div className="card-title">
                            Permission
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="flex flex-col gap-4">
                            <h2>
                                {/* User/Roles */}
                                User
                            </h2>
                            <div className="dropdow" data-dropdown="true" data-dropdown-placement="bottom-start" data-dropdown-trigger="click" id='search_user_dropdown'>
                                <label className="dropdown-toggle input input-lg">
                                    <input
                                        // placeholder="Search for users, roles to assign permission"
                                        placeholder="Search for users to assign permission"
                                        type="text"
                                        // value={searchTerm}
                                        onChange={handleSearchPermissionUser}
                                    />
                                </label>
                                {/* <button
                                    className="dropdown-toggle btn btn-light w-full flex justify-between items-center"
                                // onClick={handleOpenPropertyDropdown}
                                >
                                    <span>Property</span>
                                    <i className="ki-filled ki-down"></i>
                                </button> */}
                                <div className="dropdown-content w-full max-w-80">
                                    <div className="menu menu-default flex flex-col w-full">
                                        <div className="menu-item">
                                            <span className="text-xs text-gray-600 pl-[19px] mb-2">Users</span>
                                        </div>
                                        {users.length > 0 ? users.map((user, index) => (
                                            <div className="menu-item" key={index} data-id={user.id}>
                                                <button
                                                    className="menu-link gap-4"
                                                    onClick={() => handleSelectPermissionUser(Number(user.id))}
                                                >
                                                    <img
                                                        alt=""
                                                        className="size-9 rounded-full border-1 border-secondary shrink-0"
                                                        src="/media/avatars/default-user.png"
                                                    />
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-gray-900 text-base font-semibold">{user.name}</span>
                                                        <span className="text-gray-600 text-sm">{user.type}</span>
                                                    </div>
                                                </button>
                                            </div>
                                        ))
                                            :
                                            <div className="menu-item">
                                                <div className="flex justify-center items-center cursor-default py-4">
                                                    <span className="text-gray-600 text-sm">No user found</span>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-start">
                                    <span className="text-gray-900 text-base font-semibold">Owner access not supported yet.</span>
                                    <span className="text-gray-600 text-sm"></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative size-[36px] shrink-0">
                                    <img
                                        alt=""
                                        className="size-9 rounded-full border-2 border-primary shrink-0"
                                        src="/media/avatars/default-user.png"
                                    />
                                </div>

                                <div className="flex flex-col items-start">
                                    <span className="text-gray-900 text-base font-semibold">Anyone</span>
                                </div>
                                <div className="ml-auto">
                                    <div className="dropdow" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click" id='permission_dropdown'>
                                        <button
                                            className="dropdown-toggle btn btn-light w-full flex justify-between items-center"
                                        // onClick={handleOpenPropertyDropdown}
                                        >
                                            <span className="menu-title">
                                                {permissions.length > 0 && permissions.map((permission, index) => (
                                                    permission.id === renoProgress.permission_id && (
                                                        <span key={index} className="menu-title">{permission.permission_name}</span>
                                                    )
                                                ))}
                                            </span>
                                            <i className="ki-filled ki-down"></i>
                                        </button>
                                        <div className="dropdown-content w-full max-w-80" data-dropdown-dismiss="true">
                                            <div className="menu menu-default flex flex-col w-full">
                                                <div className="menu-item">
                                                    <span className="text-xs text-gray-600 pl-[19px] mb-2">Permission</span>
                                                </div>
                                                {permissions.length > 0 ? permissions.map((permission, index) => (
                                                    <div className="menu-item" key={index} data-id={permission.id}>
                                                        <button
                                                            className="menu-link"
                                                            onClick={() => handleChangeGeneralPermission(Number(permission.id))}
                                                        >
                                                            <span className="menu-title">{permission.permission_name}</span>
                                                        </button>
                                                    </div>
                                                ))
                                                    :
                                                    <span>Loading</span>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {renoProgress.permissions.map((perm, index) => (
                                <div className="flex items-center gap-4" key={index}>
                                    <div className="relative size-[36px] shrink-0">
                                        <img
                                            alt=""
                                            className="size-9 rounded-full border-1 border-secondary shrink-0"
                                            src="/media/avatars/default-user.png"
                                        />
                                    </div>

                                    <div className="flex flex-col items-start">
                                        <span className="text-gray-900 text-base font-semibold">{perm.name}</span>
                                        <span className="text-gray-600 text-sm">{perm.type}</span>
                                    </div>
                                    <div className="ml-auto">
                                        <div className="dropdow" data-dropdown="true" data-dropdown-placement="bottom-end" data-dropdown-trigger="click" id='permission_dropdown'>
                                            <button
                                                className="dropdown-toggle btn btn-light w-full flex justify-between items-center"
                                            // onClick={handleOpenPropertyDropdown}
                                            >
                                                <span>
                                                    {permissions.length > 0 && permissions.map((permission, index) => (
                                                        permission.id === perm.pivot.permission_id && (
                                                            <span key={index} className="menu-title">{permission.permission_name}</span>
                                                        )
                                                    ))}
                                                </span>
                                                <i className="ki-filled ki-down"></i>
                                            </button>
                                            <div className="dropdown-content w-full max-w-80" data-dropdown-dismiss="true">
                                                <div className="menu menu-default flex flex-col w-full">
                                                    <div className="menu-item">
                                                        <span className="text-xs text-gray-600 pl-[19px] mb-2">Permission</span>
                                                    </div>
                                                    {permissions.length > 0 ? permissions
                                                        .filter(permission => {
                                                            // Check if the current user type is 'owner' and exclude permission.id === 2
                                                            const isOwner = perm.type === 'owner';
                                                            return !isOwner || (isOwner && permission.id !== 2);
                                                        })
                                                        .map((permission, index) => (
                                                            <div className="menu-item" key={index} data-id={permission.id}>
                                                                <button
                                                                    className="menu-link"
                                                                    onClick={() => handleChangePermission(Number(perm.id), Number(perm.pivot.item_id), Number(permission.id))}
                                                                >
                                                                    <span className="menu-title">{permission.permission_name}</span>
                                                                </button>
                                                            </div>
                                                        )) : (
                                                        <span>Loading</span>
                                                    )}
                                                    <div className="menu-item">
                                                        <button
                                                            className="menu-link"
                                                            onClick={() => handleRemoveUserPermission(Number(perm.id), Number(perm.pivot.item_id))}
                                                        >
                                                            <span className="text-danger text-sm font-medium">Remove</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                <div className="text-xl text-gray-900 font-semibold mb-2">
                    Project Management
                </div>

                <div className="mb-16">
                    <div className="tabs mb-5" data-tabs="true">
                        <button
                            className={`tab ${activeTab === 'pre_reno_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pre_reno_tab')}
                        >
                            Pre Reno
                        </button>
                        <button
                            className={`tab ${activeTab === 'p1_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('p1_tab')}
                        >
                            P1
                        </button>
                        <button
                            className={`tab ${activeTab === 'p2a_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('p2a_tab')}
                        >
                            P2-A
                        </button>
                        <button
                            className={`tab ${activeTab === 'p2b_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('p2b_tab')}
                        >
                            P2-B
                        </button>
                        <button
                            className={`tab ${activeTab === 'iot_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('iot_tab')}
                        >
                            IoT
                        </button>
                        <button
                            className={`tab ${activeTab === 'post_reno_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('post_reno_tab')}
                        >
                            Post Reno
                        </button>
                    </div>

                    <div className={activeTab === 'pre_reno_tab' ? '' : 'hidden'} id="pre_reno_tab">
                        <div className="flex flex-col gap-5" data-accordion="true">
                            {renoProgress.phases[0].jobs
                                .sort((a, b) => b.priority - a.priority) // Sort jobs by priority (higher number comes first)
                                .map((job, jobIndex) => {
                                    const jobProgress = calculateJobProgress(job); // Get the job progress
                                    return (
                                        <div className="flex item-center" key={jobIndex}>
                                            <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id={job.id}>
                                                <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + job.id}>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-base text-gray-900 font-medium">
                                                            {job.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <div className="flex mr-24">
                                                            <span className="font-semibold text-gray-600 mr-3">Progress: </span>
                                                            <span className="font-semibold text-gray-900">{jobProgress.toFixed(2)}%</span>
                                                        </div>
                                                        <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                        <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                    </div>
                                                </button>
                                                <div className="accordion-content hidden border-t" id={"package_content_" + job.id}>
                                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[220px]'>Product</th>
                                                                <th className='w-[80px] text-center'>Owner Visibility</th>
                                                                <th className='w-[100px] text-center'>Status</th>
                                                                <th className='w-[100px] text-center'>Updated Date</th>
                                                                <th className='w-[100px] text-center'>Updated By</th>
                                                                <th className='w-[100px] text-center'>Documents</th>
                                                                <th className='w-[150px] text-center'>Comment to Owner</th>
                                                                <th className='w-[150px] text-center'>Internal Comment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {job.tasks.map((task, taskIndex) => (
                                                                <tr key={taskIndex}>
                                                                    <td>{task.name}</td>
                                                                    <td>
                                                                        <label className="switch flex justify-center">
                                                                            <input
                                                                                name="visibility"
                                                                                type="checkbox"
                                                                                checked={task.is_visible ?? false}
                                                                                onChange={() => handleToggleVisibility(Number(task.id))}
                                                                            />
                                                                        </label>
                                                                    </td>
                                                                    <td>
                                                                        <div className="flex flex-col items-center">
                                                                            {task.is_defect_form ?
                                                                                <span>
                                                                                    {renoProgress.defect_inspection_form.status === 'not_submitted' ? 'Not Submitted' : 'Completed'}
                                                                                </span>
                                                                                : task.is_key_form ? (
                                                                                    <select
                                                                                        className="w-full max-w-xs appearance-none"
                                                                                        name="status"
                                                                                        value={task.status}
                                                                                        disabled
                                                                                    >
                                                                                        <option value="not_started">Not Started</option>
                                                                                        <option value="started">Started</option>
                                                                                        <option value="in_progress">In Progress</option>
                                                                                        <option value="completed">Completed</option>
                                                                                        <option value="not_available">Not Available</option>
                                                                                    </select>
                                                                                ) : (
                                                                                    <select
                                                                                        className="select select-bordered w-full max-w-xs"
                                                                                        name="status"
                                                                                        value={task.status}
                                                                                        onChange={(e) => handleChangeStatus(e, Number(task.id))}
                                                                                    >
                                                                                        <option value="not_started">Not Started</option>
                                                                                        <option value="started">Started</option>
                                                                                        <option value="in_progress">In Progress</option>
                                                                                        <option value="completed">Completed</option>
                                                                                        <option value="not_available">Not Available</option>
                                                                                    </select>
                                                                                )}
                                                                        </div>

                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.install_date
                                                                            ? new Date(task.install_date).toLocaleDateString('en-GB', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: 'numeric'
                                                                            })
                                                                            : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.updated_by ? task.updated_by.name : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.is_defect_form ? (
                                                                            <Link
                                                                                to={`/reno-progress/${renoProgress.id}/defect-inspection-report`}
                                                                                className="btn btn-info btn-sm"
                                                                            >
                                                                                DIR Overview
                                                                            </Link>
                                                                        ) : task.is_key_form ? (
                                                                            <Link
                                                                                to={`/reno-progress/${renoProgress.id}/key-management`}
                                                                                className="btn btn-info btn-sm"
                                                                            >
                                                                                Key Management
                                                                            </Link>
                                                                        ) : (
                                                                            <button
                                                                                className="btn btn-primary btn-sm"
                                                                                data-modal-toggle="#document_modal"
                                                                                onClick={() => handleOpenDocumentModal(Number(task.id))}
                                                                            >
                                                                                Add/View
                                                                            </button>
                                                                        )
                                                                        }

                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`0.jobs.${jobIndex}.tasks.${taskIndex}.owner_comment`}
                                                                            value={task.owner_comment || ''}
                                                                            onChange={(e) => handleOwnerCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`0.jobs.${jobIndex}.tasks.${taskIndex}.internal_comment`}
                                                                            value={task.internal_comment || ''}
                                                                            onChange={(e) => handleInternalCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                    <div className={activeTab === 'p1_tab' ? '' : 'hidden'} id="p1_tab">
                        <div className="flex flex-col gap-5" data-accordion="true">
                            {renoProgress.phases[1]?.jobs
                                .sort((a, b) => a.priority - b.priority) // Sort jobs by priority
                                .map((job, jobIndex) => {
                                    const jobProgress = calculateJobProgress(job); // Get the job progress
                                    return (
                                        <div className="flex item-center" key={job.id}>
                                            <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id={job.id}>
                                                <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + job.id}>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-base text-gray-900 font-medium">
                                                            {job.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <div className="flex mr-24">
                                                            <span className="font-semibold text-gray-600 mr-3">Progress: </span>
                                                            <span className="font-semibold text-gray-900">{jobProgress.toFixed(2)}%</span>
                                                        </div>
                                                        <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                        <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                    </div>
                                                </button>
                                                <div className="accordion-content hidden border-t" id={"package_content_" + job.id}>
                                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[220px]'>Product</th>
                                                                <th className='w-[80px] text-center'>Owner Visibility</th>
                                                                <th className='w-[60px] text-center'>Quantity</th>
                                                                <th className='w-[100px] text-center'>Status</th>
                                                                <th className='w-[100px] text-center'>Updated Date</th>
                                                                <th className='w-[100px] text-center'>Updated By</th>
                                                                <th className='w-[100px] text-center'>Documents</th>
                                                                <th className='w-[150px] text-center'>Comment to Owner</th>
                                                                <th className='w-[150px] text-center'>Internal Comment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {job.tasks.map((task, taskIndex) => (
                                                                <tr key={taskIndex}>
                                                                    <td>
                                                                        <div className="flex flex-col">
                                                                            <span>
                                                                                {task.name}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {task.area}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <label className="switch flex justify-center">
                                                                            <input
                                                                                name="visibility"
                                                                                type="checkbox"
                                                                                checked={task.is_visible ?? false}
                                                                                onChange={() => handleToggleVisibility(Number(task.id))}
                                                                            />
                                                                        </label>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.qty}
                                                                    </td>
                                                                    <td>
                                                                        <div className="flex flex-col items-center">
                                                                            <select
                                                                                className="select select-bordered w-full max-w-xs"
                                                                                name="status"
                                                                                value={task.status}
                                                                                onChange={(e) => handleChangeStatus(e, Number(task.id))}
                                                                            >
                                                                                <option value="not_started">Not Started</option>
                                                                                <option value="started">Started</option>
                                                                                <option value="in_progress">In Progress</option>
                                                                                <option value="completed">Completed</option>
                                                                                <option value="not_available">Not Available</option>
                                                                            </select>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.install_date
                                                                            ? new Date(task.install_date).toLocaleDateString('en-GB', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: 'numeric'
                                                                            })
                                                                            : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.updated_by ? task.updated_by.name : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <button
                                                                            className="btn btn-primary btn-sm"
                                                                            data-modal-toggle="#document_modal"
                                                                            onClick={() => handleOpenDocumentModal(Number(task.id))}
                                                                        >
                                                                            Add/View
                                                                        </button>
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`1.jobs.${jobIndex}.tasks.${taskIndex}.owner_comment`}
                                                                            value={task.owner_comment || ''}
                                                                            onChange={(e) => handleOwnerCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`1.jobs.${jobIndex}.tasks.${taskIndex}.internal_comment`}
                                                                            value={task.internal_comment || ''}
                                                                            onChange={(e) => handleInternalCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                    <div className={activeTab === 'p2a_tab' ? '' : 'hidden'} id="p2a_tab">
                        <div className="flex flex-col gap-5" data-accordion="true">
                            {renoProgress.phases[2]?.jobs
                                .sort((a, b) => a.priority - b.priority) // Sort jobs by priority
                                .map((job, jobIndex) => {
                                    const jobProgress = calculateJobProgress(job); // Get the job progress
                                    return (
                                        <div className="flex item-center" key={job.id}>
                                            <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id={job.id}>
                                                <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + job.id}>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-base text-gray-900 font-medium">
                                                            {job.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <div className="flex mr-24">
                                                            <span className="font-semibold text-gray-600 mr-3">Progress: </span>
                                                            <span className="font-semibold text-gray-900">{jobProgress.toFixed(2)}%</span>
                                                        </div>
                                                        <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                        <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                    </div>
                                                </button>
                                                <div className="accordion-content hidden border-t" id={"package_content_" + job.id}>
                                                    <table className="table align-middle text-gray-700 font-medium text-sm border-collapse">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[220px]'>Product</th>
                                                                <th className='w-[80px] text-center'>Owner Visibility</th>
                                                                <th className='w-[60px] text-center'>Quantity</th>
                                                                <th className='w-[100px] text-center'>Status</th>
                                                                <th className='w-[100px] text-center'>Updated Date</th>
                                                                <th className='w-[100px] text-center'>Updated By</th>
                                                                <th className='w-[100px] text-center'>Documents</th>
                                                                <th className='w-[150px] text-center'>Comment to Owner</th>
                                                                <th className='w-[150px] text-center'>Internal Comment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {job.tasks.map((task, taskIndex) => (
                                                                <tr key={taskIndex}>
                                                                    <td>{task.name}</td>
                                                                    <td>
                                                                        <label className="switch flex justify-center">
                                                                            <input
                                                                                name="visibility"
                                                                                type="checkbox"
                                                                                checked={task.is_visible ?? false}
                                                                                onChange={() => handleToggleVisibility(Number(task.id))}
                                                                            />
                                                                        </label>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.qty}
                                                                    </td>
                                                                    <td>
                                                                        <div className="flex flex-col items-center">
                                                                            <select
                                                                                className="select select-bordered w-full max-w-xs"
                                                                                name="status"
                                                                                value={task.status}
                                                                                onChange={(e) => handleChangeStatus(e, Number(task.id))}
                                                                            >
                                                                                <option value="not_started">Not Started</option>
                                                                                <option value="started">Started</option>
                                                                                <option value="in_progress">In Progress</option>
                                                                                <option value="completed">Completed</option>
                                                                                <option value="not_available">Not Available</option>
                                                                            </select>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.install_date
                                                                            ? new Date(task.install_date).toLocaleDateString('en-GB', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: 'numeric'
                                                                            })
                                                                            : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.updated_by ? task.updated_by.name : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <button
                                                                            className="btn btn-primary btn-sm"
                                                                            data-modal-toggle="#document_modal"
                                                                            onClick={() => handleOpenDocumentModal(Number(task.id))}
                                                                        >
                                                                            Add/View
                                                                        </button>
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`1.jobs.${jobIndex}.tasks.${taskIndex}.owner_comment`}
                                                                            value={task.owner_comment || ''}
                                                                            onChange={(e) => handleOwnerCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`1.jobs.${jobIndex}.tasks.${taskIndex}.internal_comment`}
                                                                            value={task.internal_comment || ''}
                                                                            onChange={(e) => handleInternalCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                    <div className={activeTab === 'p2b_tab' ? '' : 'hidden'} id="p2b_tab">
                        <div className="flex flex-col gap-5" data-accordion="true">
                            {renoProgress.phases[3]?.jobs
                                .sort((a, b) => a.priority - b.priority) // Sort jobs by priority
                                .map((job, jobIndex) => {
                                    const jobProgress = calculateJobProgress(job); // Get the job progress
                                    return (
                                        <div className="flex item-center" key={job.id}>
                                            <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id={job.id}>
                                                <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + job.id}>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-base text-gray-900 font-medium">
                                                            {job.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <div className="flex mr-24">
                                                            <span className="font-semibold text-gray-600 mr-3">Progress: </span>
                                                            <span className="font-semibold text-gray-900">{jobProgress.toFixed(2)}%</span>
                                                        </div>
                                                        <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                        <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                    </div>
                                                </button>
                                                <div className="accordion-content hidden border-t" id={"package_content_" + job.id}>
                                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[220px]'>Product</th>
                                                                <th className='w-[80px] text-center'>Owner Visibility</th>
                                                                <th className='w-[60px] text-center'>Quantity</th>
                                                                <th className='w-[100px] text-center'>Status</th>
                                                                <th className='w-[100px] text-center'>Updated Date</th>
                                                                <th className='w-[100px] text-center'>Updated By</th>
                                                                <th className='w-[100px] text-center'>Documents</th>
                                                                <th className='w-[150px] text-center'>Comment to Owner</th>
                                                                <th className='w-[150px] text-center'>Internal Comment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {job.tasks.map((task, taskIndex) => (
                                                                <tr key={taskIndex}>
                                                                    <td>
                                                                        <div className="flex flex-col">
                                                                            <span>
                                                                                {task.name}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {task.area}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <label className="switch flex justify-center">
                                                                            <input
                                                                                name="visibility"
                                                                                type="checkbox"
                                                                                checked={task.is_visible ?? false}
                                                                                onChange={() => handleToggleVisibility(Number(task.id))}
                                                                            />
                                                                        </label>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.qty}
                                                                    </td>
                                                                    <td>
                                                                        <div className="flex flex-col items-center">
                                                                            <select
                                                                                className="select select-bordered w-full max-w-xs"
                                                                                name="status"
                                                                                value={task.status}
                                                                                onChange={(e) => handleChangeStatus(e, Number(task.id))}
                                                                            >
                                                                                <option value="not_started">Not Started</option>
                                                                                <option value="started">Started</option>
                                                                                <option value="in_progress">In Progress</option>
                                                                                <option value="completed">Completed</option>
                                                                                <option value="not_available">Not Available</option>
                                                                            </select>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.install_date
                                                                            ? new Date(task.install_date).toLocaleDateString('en-GB', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: 'numeric'
                                                                            })
                                                                            : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.updated_by ? task.updated_by.name : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <button
                                                                            className="btn btn-primary btn-sm"
                                                                            data-modal-toggle="#document_modal"
                                                                            onClick={() => handleOpenDocumentModal(Number(task.id))}
                                                                        >
                                                                            Add/View
                                                                        </button>
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`1.jobs.${jobIndex}.tasks.${taskIndex}.owner_comment`}
                                                                            value={task.owner_comment || ''}
                                                                            onChange={(e) => handleOwnerCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`1.jobs.${jobIndex}.tasks.${taskIndex}.internal_comment`}
                                                                            value={task.internal_comment || ''}
                                                                            onChange={(e) => handleInternalCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                    <div className={activeTab === 'iot_tab' ? '' : 'hidden'} id="iot_tab">
                        <div className="flex flex-col gap-5" data-accordion="true">
                            {renoProgress.phases[4]?.jobs
                                .sort((a, b) => a.priority - b.priority) // Sort jobs by priority
                                .map((job, jobIndex) => {
                                    const jobProgress = calculateJobProgress(job); // Get the job progress
                                    return (
                                        <div className="flex item-center" key={job.id}>
                                            <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id={job.id}>
                                                <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + job.id}>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-base text-gray-900 font-medium">
                                                            {job.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <div className="flex mr-24">
                                                            <span className="font-semibold text-gray-600 mr-3">Progress: </span>
                                                            <span className="font-semibold text-gray-900">{jobProgress.toFixed(2)}%</span>
                                                        </div>
                                                        <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                        <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                    </div>
                                                </button>
                                                <div className="accordion-content hidden border-t" id={"package_content_" + job.id}>
                                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[220px]'>Product</th>
                                                                <th className='w-[80px] text-center'>Owner Visibility</th>
                                                                <th className='w-[60px] text-center'>Quantity</th>
                                                                <th className='w-[100px] text-center'>Status</th>
                                                                <th className='w-[100px] text-center'>Updated Date</th>
                                                                <th className='w-[100px] text-center'>Updated By</th>
                                                                <th className='w-[100px] text-center'>Documents</th>
                                                                <th className='w-[150px] text-center'>Comment to Owner</th>
                                                                <th className='w-[150px] text-center'>Internal Comment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {job.tasks.map((task, taskIndex) => (
                                                                <tr key={taskIndex}>
                                                                    <td>{task.name}</td>
                                                                    <td>
                                                                        <label className="switch flex justify-center">
                                                                            <input
                                                                                name="visibility"
                                                                                type="checkbox"
                                                                                checked={task.is_visible ?? false}
                                                                                onChange={() => handleToggleVisibility(Number(task.id))}
                                                                            />
                                                                        </label>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.qty}
                                                                    </td>
                                                                    <td>
                                                                        <div className="flex flex-col items-center">
                                                                            <select
                                                                                className="select select-bordered w-full max-w-xs"
                                                                                name="status"
                                                                                value={task.status}
                                                                                onChange={(e) => handleChangeStatus(e, Number(task.id))}
                                                                            >
                                                                                <option value="not_started">Not Started</option>
                                                                                <option value="started">Started</option>
                                                                                <option value="in_progress">In Progress</option>
                                                                                <option value="completed">Completed</option>
                                                                                <option value="not_available">Not Available</option>
                                                                            </select>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.install_date
                                                                            ? new Date(task.install_date).toLocaleDateString('en-GB', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: 'numeric'
                                                                            })
                                                                            : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.updated_by ? task.updated_by.name : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <button
                                                                            className="btn btn-primary btn-sm"
                                                                            data-modal-toggle="#document_modal"
                                                                            onClick={() => handleOpenDocumentModal(Number(task.id))}
                                                                        >
                                                                            Add/View
                                                                        </button>
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`1.jobs.${jobIndex}.tasks.${taskIndex}.owner_comment`}
                                                                            value={task.owner_comment || ''}
                                                                            onChange={(e) => handleOwnerCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`1.jobs.${jobIndex}.tasks.${taskIndex}.internal_comment`}
                                                                            value={task.internal_comment || ''}
                                                                            onChange={(e) => handleInternalCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                    <div className={activeTab === 'post_reno_tab' ? '' : 'hidden'} id="post_reno_tab">
                        <div className="flex flex-col gap-5" data-accordion="true">
                            {renoProgress.phases[5]?.jobs
                                .sort((a, b) => a.priority - b.priority) // Sort jobs by priority (higher number comes first)
                                .map((job, jobIndex) => {
                                    const jobProgress = calculateJobProgress(job); // Get the job progress
                                    return (
                                        <div className="flex item-center" key={job.id}>
                                            <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id={job.id}>
                                                <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + job.id}>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-base text-gray-900 font-medium">
                                                            {job.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex">
                                                        <div className="flex mr-24">
                                                            <span className="font-semibold text-gray-600 mr-3">Progress: </span>
                                                            <span className="font-semibold text-gray-900">{jobProgress.toFixed(2)}%</span>
                                                        </div>
                                                        <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                        <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                    </div>
                                                </button>
                                                <div className="accordion-content hidden border-t" id={"package_content_" + job.id}>
                                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[220px]'>Product</th>
                                                                <th className='w-[80px] text-center'>Owner Visibility</th>
                                                                <th className='w-[100px] text-center'>Status</th>
                                                                <th className='w-[100px] text-center'>Updated Date</th>
                                                                <th className='w-[100px] text-center'>Updated By</th>
                                                                <th className='w-[100px] text-center'>Documents</th>
                                                                <th className='w-[150px] text-center'>Comment to Owner</th>
                                                                <th className='w-[150px] text-center'>Internal Comment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {job.tasks.map((task, taskIndex) => (
                                                                <tr key={taskIndex}>
                                                                    <td>{task.name}</td>
                                                                    <td>
                                                                        <label className="switch flex justify-center">
                                                                            <input
                                                                                name="visibility"
                                                                                type="checkbox"
                                                                                checked={task.is_visible ?? false}
                                                                                onChange={() => handleToggleVisibility(Number(task.id))}
                                                                            />
                                                                        </label>
                                                                    </td>
                                                                    <td>
                                                                        <div className="flex flex-col items-center">
                                                                            {task.is_qc_form ?
                                                                                // <Link
                                                                                //     to={`/reno-progress/${renoProgress.id}/defect-inspection-report`}
                                                                                //     className="btn btn-info btn-sm"
                                                                                // >
                                                                                //     QC Overview
                                                                                // </Link>
                                                                                <Link
                                                                                    to={`/reno/qc-form?progressId=${renoProgress.id}`}
                                                                                    className="btn btn-info btn-sm"
                                                                                >
                                                                                    QC Overview
                                                                                </Link>
                                                                                :
                                                                                // <input
                                                                                //     className="checkbox"
                                                                                //     name="install"
                                                                                //     type="checkbox"
                                                                                //     checked={!!task.is_installed}
                                                                                //     onChange={() => toggleProperty(Number(task.id), Number(renoProgress.phases[0].id), Number(job.id), 'install')}
                                                                                // />
                                                                                <select
                                                                                    className="select select-bordered w-full max-w-xs"
                                                                                    name="status"
                                                                                    value={task.status}
                                                                                    onChange={(e) => handleChangeStatus(e, Number(task.id))}
                                                                                >
                                                                                    <option value="not_started">Not Started</option>
                                                                                    <option value="started">Started</option>
                                                                                    <option value="in_progress">In Progress</option>
                                                                                    <option value="completed">Completed</option>
                                                                                    <option value="not_available">Not Available</option>
                                                                                </select>
                                                                            }
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.install_date
                                                                            ? new Date(task.install_date).toLocaleDateString('en-GB', {
                                                                                day: '2-digit',
                                                                                month: 'short',
                                                                                year: 'numeric'
                                                                            })
                                                                            : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.updated_by ? task.updated_by.name : ''}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {task.is_qc_form ?
                                                                            ''
                                                                            :
                                                                            <button
                                                                                className="btn btn-primary btn-sm"
                                                                                data-modal-toggle="#document_modal"
                                                                                onClick={() => handleOpenDocumentModal(Number(task.id))}
                                                                            >
                                                                                Add/View
                                                                            </button>
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`2.jobs.${jobIndex}.tasks.${taskIndex}.owner_comment`}
                                                                            value={task.owner_comment || ''}
                                                                            onChange={(e) => handleOwnerCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`2.jobs.${jobIndex}.tasks.${taskIndex}.internal_comment`}
                                                                            value={task.internal_comment || ''}
                                                                            onChange={(e) => handleInternalCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="document_modal">
                <div className="modal-content h-full max-w-[1000px] bg-gray-50 rounded-xl shadow-lg">
                    {/* Modal Header */}
                    <div className="modal-header py-5 px-6 border-b border-gray-200 relative">
                        <span className="text-xl text-gray-900 font-semibold">Document Overview</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear absolute top-4 right-4 transition-colors duration-200 hover:bg-gray-200"
                            data-modal-dismiss="true"
                            onClick={handleCloseDocumentModal}
                            aria-label="Close modal"
                        >
                            <i className="ki-filled ki-cross text-gray-600"></i>
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="modal-body overflow-y-auto scrollable-y p-6">
                        <div className="flex flex-row gap-8 h-full max-md:flex-col">
                            {/* Left Column: Internal Attachments */}
                            <div className="flex-1 flex flex-col gap-8">
                                {/* Internal Attachments Upload */}
                                <label
                                    className={`flex w-full p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-xl border-dashed transition-all duration-200 ${dragging ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-400 hover:bg-blue-50'
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    htmlFor="file-upload-regular"
                                >
                                    <div className="flex flex-col place-items-center place-content-center text-center rounded-xl w-full">
                                        <div className="flex items-center mb-2.5">
                                            <div className="relative size-9 shrink-0">
                                                <svg
                                                    className="w-full h-full stroke-blue-200 fill-gray-50"
                                                    fill="none"
                                                    height="48"
                                                    viewBox="0 0 44 48"
                                                    width="44"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z"
                                                        fill=""
                                                    ></path>
                                                    <path
                                                        d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z"
                                                        stroke=""
                                                        strokeOpacity="0.2"
                                                    ></path>
                                                </svg>
                                                <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                    <i className="ki-filled ki-picture text-xl text-blue-500"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            id="file-upload-regular"
                                            multiple
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <span className="text-gray-900 text-sm font-medium hover:text-blue-600 mb-px cursor-pointer">
                                            Click or Drag & Drop
                                        </span>
                                        <span className="text-xs text-gray-600">max size: 50MB | max files: {maxFiles}</span>
                                    </div>
                                </label>

                                {/* Pending Regular Upload Items */}
                                {pendingUploadItems?.length > 0 && (
                                    <div className="flex flex-col border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <div className="font-semibold text-gray-900">Pending Uploads</div>
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-secondary btn-outline transition-colors duration-200 hover:bg-gray-100"
                                                    onClick={clearAllFiles}
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-success transition-colors duration-200 hover:bg-green-600"
                                                    onClick={() => uploadFiles(selectedDocumentTaskId)}
                                                >
                                                    Upload
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                                            {pendingUploadItems.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between border border-gray-200 rounded-lg p-2 even:bg-gray-50 hover:bg-gray-100 transition-all"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <i className="ki-filled ki-sms text-lg text-gray-500"></i>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-gray-900">{file.name}</span>
                                                            <span className="text-xs text-gray-600">{formatFileSize(file.size)}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn btn-xs btn-danger btn-icon transition-colors duration-200 hover:bg-red-600"
                                                        onClick={() => removeFile(index)}
                                                        aria-label={`Remove ${file.name}`}
                                                    >
                                                        <i className="ki-filled ki-trash"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Internal Attachments Display */}
                                <div className="flex flex-col border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5 flex-1 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div className="font-semibold text-gray-900">Internal Attachments</div>
                                        {documentItems?.length > 0 && (
                                            documentManageMode ? (
                                                <button
                                                    className="btn btn-sm btn-secondary btn-outline transition-colors duration-200 hover:bg-gray-100"
                                                    onClick={() => setDocumentManageMode(false)}
                                                >
                                                    Cancel
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-sm btn-primary btn-outline transition-colors duration-200 hover:bg-blue-100"
                                                    onClick={() => setDocumentManageMode(true)}
                                                >
                                                    Manage
                                                </button>
                                            )
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {documentItems === null ? (
                                            <div className="flex items-center justify-center h-full">
                                                <span className="text-gray-600 text-sm">Loading attachments...</span>
                                            </div>
                                        ) : documentItems.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                                                {documentItems.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-50 hover:shadow-sm transition-all"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <i className="ki-filled ki-sms text-lg text-gray-500"></i>
                                                            <div className="flex flex-col">
                                                                <a
                                                                    className="flex items-center gap-2 text-sm text-gray-900 hover:text-blue-600 transition-colors duration-200"
                                                                    href={AWS_S3_URL + item.file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {item.original_name}
                                                                </a>
                                                                <span className="text-xs text-gray-600">{formatFileSize(item.size)}</span>
                                                            </div>
                                                        </div>
                                                        {documentManageMode && (
                                                            <button
                                                                className="btn btn-xs btn-danger btn-icon transition-colors duration-200 hover:bg-red-600"
                                                                onClick={() => removeServerFile(selectedDocumentTaskId, index)}
                                                                aria-label={`Remove ${item.original_name}`}
                                                            >
                                                                <i className="ki-filled ki-trash"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-600 text-sm">No Internal Attachments</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: External Attachments */}
                            <div className="flex-1 flex flex-col gap-8">
                                {/* External Attachments Upload */}
                                <label
                                    className={`flex w-full p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-xl border-dashed transition-all duration-200 ${draggingExternal ? 'border-green-500 bg-green-50' : 'hover:border-green-400 hover:bg-green-50'
                                        }`}
                                    onDragOver={handleExternalDragOver}
                                    onDragLeave={handleExternalDragLeave}
                                    onDrop={handleExternalDrop}
                                    htmlFor="file-upload-external"
                                >
                                    <div className="flex flex-col place-items-center place-content-center text-center rounded-xl w-full">
                                        <div className="flex items-center mb-2.5">
                                            <div className="relative size-9 shrink-0">
                                                <svg
                                                    className="w-full h-full stroke-green-200 fill-gray-50"
                                                    fill="none"
                                                    height="48"
                                                    viewBox="0 0 44 48"
                                                    width="44"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z"
                                                        fill=""
                                                    ></path>
                                                    <path
                                                        d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z"
                                                        stroke=""
                                                        strokeOpacity="0.2"
                                                    ></path>
                                                </svg>
                                                <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                    <i className="ki-filled ki-picture text-xl text-green-500"></i>
                                                </div>
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            id="file-upload-external"
                                            multiple
                                            onChange={handleExternalFileSelect}
                                            className="hidden"
                                        />
                                        <span className="text-gray-900 text-sm font-medium hover:text-green-600 mb-px cursor-pointer">
                                            Click or Drag & Drop
                                        </span>
                                        <span className="text-xs text-gray-600">max size: 50MB | max files: {maxFiles}</span>
                                    </div>
                                </label>

                                {/* Pending External Upload Items */}
                                {pendingExternalUploadItems.length > 0 && (
                                    <div className="flex flex-col border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <div className="font-semibold text-gray-900">Pending Uploads</div>
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-secondary btn-outline transition-colors duration-200 hover:bg-gray-100"
                                                    onClick={clearAllExternalFiles}
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-success transition-colors duration-200 hover:bg-green-600"
                                                    onClick={() => uploadExternalFiles(selectedDocumentTaskId)}
                                                >
                                                    Upload
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                                            {pendingExternalUploadItems.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between border border-gray-200 rounded-lg p-2 even:bg-gray-50 hover:bg-gray-100 transition-all"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <i className="ki-filled ki-sms text-lg text-gray-500"></i>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-gray-900">{file.name}</span>
                                                            <span className="text-xs text-gray-600">{formatFileSize(file.size)}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn btn-xs btn-danger btn-icon transition-colors duration-200 hover:bg-red-600"
                                                        onClick={() => removeExternalFile(index)}
                                                        aria-label={`Remove ${file.name}`}
                                                    >
                                                        <i className="ki-filled ki-trash"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* External Attachments Display */}
                                <div className="flex flex-col border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5 flex-1 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div className="font-semibold text-gray-900">External Attachments</div>
                                        {externalDocumentItems?.length > 0 && (
                                            externalDocumentManageMode ? (
                                                <button
                                                    className="btn btn-sm btn-secondary btn-outline transition-colors duration-200 hover:bg-gray-100"
                                                    onClick={() => setExternalDocumentManageMode(false)}
                                                >
                                                    Cancel
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-sm btn-primary btn-outline transition-colors duration-200 hover:bg-blue-100"
                                                    onClick={() => setExternalDocumentManageMode(true)}
                                                >
                                                    Manage
                                                </button>
                                            )
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {externalDocumentItems === null ? (
                                            <div className="flex items-center justify-center h-full">
                                                <span className="text-gray-600 text-sm">Loading attachments...</span>
                                            </div>
                                        ) : externalDocumentItems.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                                                {externalDocumentItems.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-50 hover:shadow-sm transition-all"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <i className="ki-filled ki-sms text-lg text-gray-500"></i>
                                                            <div className="flex flex-col">
                                                                <a
                                                                    className="flex items-center gap-2 text-sm text-gray-900 hover:text-green-600 transition-colors duration-200"
                                                                    href={item.url || AWS_S3_URL + item.file_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    {item.name || item.original_name}
                                                                </a>
                                                                {item.size && (
                                                                    <span className="text-xs text-gray-600">{formatFileSize(item.size)}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {externalDocumentManageMode && (
                                                            <button
                                                                className="btn btn-xs btn-danger btn-icon transition-colors duration-200 hover:bg-red-600"
                                                                onClick={() => removeServerFile(selectedDocumentTaskId, index)}
                                                                aria-label={`Remove ${item.name || item.original_name}`}
                                                            >
                                                                <i className="ki-filled ki-trash"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-600 text-sm">No External Attachments</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ProjectDateManagementModal
                renoProgress={renoProgress}
                setRenoProgress={setRenoProgress}
            />

            <DIRLinkManagementModal
                diForm={renoProgress.defect_inspection_form}
                setDiForm={handleUpdateDIForm}
            />
        </>
    )
}

export default ProgressMgnt;

