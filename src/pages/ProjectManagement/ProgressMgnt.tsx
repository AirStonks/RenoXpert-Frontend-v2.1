import { useLocation, useNavigate, useParams } from "react-router-dom";
import useFetchRenoProgress from "../../hook/useFetchRenoProgress";
import Loading from "../../components/Loading";
import { useCallback, useEffect, useRef, useState } from "react";
import KTComponents, { KTAccordion, KTTabs } from "../../metronic/core";
import { JobTask, PhaseJob, RenoProgress } from "../../types";
import { changeInternalComment, changeOwnerComment, changeRenoProgressContractorDate, changeRenoProgressContractorHandoverDate, changeRenoProgressContractualDate, changeRenoProgressContractualHandoverDate, changeTaskStatus, fetchRenoProgress, fetchTaskDocuments, removeTaskDocument, toggleTaskInstall, toggleTaskSupply, toggleTaskVisibility, uploadTaskDocuments } from "../../services/api";
import ClipboardJS from "clipboard";
import { Slide, toast } from "react-toastify";
import { Link } from "react-router-dom";

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

    const [pendingUploadItems, setPendingUploadItems] = useState<File[]>(null);
    const [dragging, setDragging] = useState(false);
    const [documentItems, setDocumentItems] = useState<[]>(null);
    const [selectedDocumentTaskId, setSelectedDocumentTaskId] = useState<number>(null);
    const [documentManageMode, setDocumentManageMode] = useState(false);

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

                // handleSearchRenoProgress(renoProgressDetail.id);
            }

            await new Promise(resolve => setTimeout(resolve, 1));

            KTComponents.init();
        }

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
            navigate('/reno-progress');
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

    const handleOwnerCommentChange = async (e: React.ChangeEvent<HTMLInputElement>, taskId: number) => {
        const { value } = e.target;

        console.log(value);


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
            setIsLoading(false);
        }
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
                setIsLoading(false);
            }
        } catch (error) {
            notify('error', 'Failed to update status');
            setIsLoading(false);
        }
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

    // Handle file removal
    const removeFile = (index) => {
        setPendingUploadItems((prevItems) => prevItems.filter((_, i) => i !== index));
    };

    const removeServerFile = async (taskId: number, documentIndex: number) => {
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
    }

    // Clear all files
    const clearAllFiles = () => {
        setPendingUploadItems([]);
    };

    // Upload files (placeholder function)
    const uploadFiles = async (taskId: number) => {

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

        try {
            const response = await fetchTaskDocuments(renoProgressId, taskId);

            if (response?.success) {

                if (response?.data === null) {
                    setDocumentItems([]);
                } else {
                    setDocumentItems(response?.data);
                }
            }

        } catch (error) {
            console.log(error);
        }
    }

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

    const handleChangeDate = async (event: React.ChangeEvent<HTMLInputElement>, renoProgressId: number, userType: string, dateType: string = 'date', datePoint: string = 'start') => {
        const date = event.target.value;
        setIsLoading(true);
        try {
            let response;

            if (userType === 'contractual') {
                if (dateType === 'date') {
                    response = await changeRenoProgressContractualHandoverDate(renoProgressId, date);
                } else {
                    if (datePoint === 'start') {
                        response = await changeRenoProgressContractualDate(renoProgressId, dateType, date);
                    } else {
                        response = await changeRenoProgressContractualDate(renoProgressId, dateType, null, date);
                    }
                }
            } else if (userType === 'contractor') {
                if (dateType === 'date') {
                    response = await changeRenoProgressContractorHandoverDate(renoProgressId, date);
                } else {
                    if (datePoint === 'start') {
                        response = await changeRenoProgressContractorDate(renoProgressId, dateType, date);
                    } else {
                        response = await changeRenoProgressContractorDate(renoProgressId, dateType, null, date);
                    }
                }
            }

            if (response?.success) {
                notify('success', 'Date updated successfully');
                setRenoProgress(response.data);
            }

            setIsLoading(false);

        } catch (error) {

            if (error.status === 400) {
                notify('error', error.response.data.message);
            } else {
                notify('error', 'Something went wrong');
            }

            setIsLoading(false);
        }
    }

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
                                <span className="text-lg font-semibold">Pre Reno</span>
                                <span className="text-xs">{(renoProgress.pre_reno_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                {/* Issued progress bar (outer) */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                    style={{
                                        width: `${renoProgress.pre_reno_completion * 100}%`,
                                        height: '8px'
                                    }}
                                />

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
                                <span className="text-lg font-semibold">Reno</span>
                                <span className="text-xs">{(renoProgress.reno_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                {/* Issued progress bar (outer) */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                    style={{
                                        width: `${renoProgress.reno_completion * 100}%`,
                                        height: '8px'
                                    }}
                                />

                                {/* Paid progress bar (inner) */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                    style={{
                                        width: `${renoProgress.reno_completion * 100}%`,
                                        height: '8px'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-lg font-semibold">Post Reno</span>
                                <span className="text-xs">{(renoProgress.post_reno_completion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                {/* Issued progress bar (outer) */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-blue-200 transition-all duration-300"
                                    style={{
                                        width: `${renoProgress.post_reno_completion * 100}%`,
                                        height: '8px'
                                    }}
                                />

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
                            Property
                        </div>
                    </div>
                    <div className="card-body">
                        <table className="table-auto">
                            <tbody>
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
            </div>

            <div className="flex flex-col">
                <div className="text-xl font-semibold mb-2">
                    Project Management
                </div>

                <div>
                    <div className="tabs mb-5" data-tabs="true">
                        <button
                            className={`tab ${activeTab === 'pre_reno_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pre_reno_tab')}
                        >
                            Pre Reno
                        </button>
                        <button
                            className={`tab ${activeTab === 'reno_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reno_tab')}
                        >
                            Reno
                        </button>
                        <button
                            className={`tab ${activeTab === 'post_reno_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('post_reno_tab')}
                        >
                            Post Reno
                        </button>
                        <button
                            className={`tab ${activeTab === 'rpm_handover_tab' ? 'active' : ''}`}
                            onClick={() => setActiveTab('rpm_handover_tab')}
                        >
                            RPM Handover
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
                                                            <span className="font-semibold">{jobProgress.toFixed(2)}%</span>
                                                        </div>
                                                        <i className="ki-outline ki-plus text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                        <i className="ki-outline ki-minus text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                    </div>
                                                </button>
                                                <div className="accordion-content hidden border-t" id={"package_content_" + job.id}>
                                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[220px]'>Product</th>
                                                                <th className='w-[80px] text-center'>Owner Visibility</th>
                                                                <th className='w-[100px] text-center'>Status</th>
                                                                <th className='w-[100px] text-center'>Last Update Date</th>
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
                                                                                checked={task.is_visible}
                                                                                value={`${task.is_visible}`}
                                                                                onChange={() => handleToggleVisibility(Number(task.id))}
                                                                            />
                                                                        </label>
                                                                    </td>
                                                                    <td>
                                                                        <div className="flex flex-col items-center">
                                                                            {task.is_defect_form ?
                                                                                <Link
                                                                                    to={`/reno-progress/${renoProgress.id}/defect-inspection-report`}
                                                                                    className="btn btn-info btn-sm"
                                                                                >
                                                                                    DIR Overview
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
                                                                        {task.is_defect_form ?
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
                                                                            name={`0.jobs.${jobIndex}.tasks.${taskIndex}.owner_comment`}
                                                                            value={task.owner_comment}
                                                                            onChange={(e) => handleOwnerCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`0.jobs.${jobIndex}.tasks.${taskIndex}.internal_comment`}
                                                                            value={task.internal_comment}
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
                    <div className={activeTab === 'reno_tab' ? '' : 'hidden'} id="reno_tab">
                        <div className="flex flex-col gap-5" data-accordion="true">
                            {renoProgress.phases[1].jobs
                                .sort((a, b) => b.priority - a.priority) // Sort jobs by priority
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
                                                            <span className="font-semibold">{jobProgress.toFixed(2)}%</span>
                                                        </div>
                                                        <i className="ki-outline ki-plus text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                        <i className="ki-outline ki-minus text-gray-600 text-2sm accordion-active:block hidden"></i>
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
                                                                <th className='w-[100px] text-center'>Last Update Date</th>
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
                                                                                checked={task.is_visible}
                                                                                value={`${task.is_visible}`}
                                                                            // onChange={() => handleVisibilityToggle(product.id)}
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
                                                                            value={task.owner_comment}
                                                                            onChange={(e) => handleOwnerCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`1.jobs.${jobIndex}.tasks.${taskIndex}.internal_comment`}
                                                                            value={task.internal_comment}
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
                            {renoProgress.phases[2].jobs
                                .sort((a, b) => b.priority - a.priority) // Sort jobs by priority (higher number comes first)
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
                                                            <span className="font-semibold">{jobProgress.toFixed(2)}%</span>
                                                        </div>
                                                        <i className="ki-outline ki-plus text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                        <i className="ki-outline ki-minus text-gray-600 text-2sm accordion-active:block hidden"></i>
                                                    </div>
                                                </button>
                                                <div className="accordion-content hidden border-t" id={"package_content_" + job.id}>
                                                    <table className="table align-middle text-gray-700 font-medium text-sm">
                                                        <thead>
                                                            <tr>
                                                                <th className='w-[220px]'>Product</th>
                                                                <th className='w-[80px] text-center'>Owner Visibility</th>
                                                                <th className='w-[100px] text-center'>Status</th>
                                                                <th className='w-[100px] text-center'>Last Update Date</th>
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
                                                                                checked={task.is_visible}
                                                                                value={`${task.is_visible}`}
                                                                            // onChange={() => handleVisibilityToggle(product.id)}
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
                                                                            value={task.owner_comment}
                                                                            onChange={(e) => handleOwnerCommentChange(e, Number(task.id))}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            className="input"
                                                                            name={`2.jobs.${jobIndex}.tasks.${taskIndex}.internal_comment`}
                                                                            value={task.internal_comment}
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
                    <div className={activeTab === 'rpm_handover_tab' ? '' : 'hidden'} id="rpm_handover_tab">
                        <div className="flex flex-col gap-5" data-accordion="true">
                            {/* {renoProgress.phases[3].jobs
                                .sort((a, b) => b.priority - a.priority) // Sort jobs by priority (higher number comes first)
                                .map((job, jobIndex) => {
                                    const jobProgress = calculateJobProgress(job); // Get the job progress
                                    return (
                                        <div className="flex item-center" key={job.id}>
                                            <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id=
                                                {job.id}>
                                                <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" +
                                                    job.id}>
                                                </button>
                                                <div className="accordion-content hidden border-t" id={"package_content_" + job.id}>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })} */}
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="document_modal">
                <div className="modal-content h-full max-w-[800px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Document Overview</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                            onClick={handleCloseDocumentModal}
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body overflow-y-auto scrollable-y">
                        <div className="flex flex-col">
                            <div
                                className={`flex bg-center w-full p-5 lg:p-7 bg-no-repeat bg-[length:550px] border border-gray-300 rounded-xl border-dashed branding-bg mb-8 
                                    ${dragging ? 'border-primary border-1 bg-gray-100' : ''}`} // Add custom styles when dragging
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className="flex flex-col place-items-center place-content-center text-center rounded-xl w-full">
                                    <div className="flex items-center mb-2.5">
                                        <div className="relative size-11 shrink-0">
                                            <svg
                                                className="w-full h-full stroke-brand-clarity fill-light"
                                                fill="none"
                                                height="48"
                                                viewBox="0 0 44 48"
                                                width="44"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                                                <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="" strokeOpacity="0.2"></path>
                                            </svg>
                                            <div className="absolute leading-none left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
                                                <i className="ki-filled ki-picture text-xl ps-px text-brand"></i>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input for file selection */}
                                    <input
                                        type="file"
                                        id="file-upload"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="text-gray-900 text-xs font-medium hover:text-primary-active mb-px cursor-pointer"
                                    >
                                        Click or Drag & Drop
                                    </label>

                                    <span className="text-2xs text-gray-700 text-nowrap">
                                        max size: 50MB | max files: {maxFiles}
                                    </span>
                                </div>
                            </div>

                            {pendingUploadItems !== null ?
                                pendingUploadItems.length > 0 && (
                                    <div className="flex flex-col flex-wrap border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5 mb-8">
                                        <div className="flex justify-between items-center">
                                            <div className="modal-title">Pending Upload Items</div>
                                            <div className="flex gap-4">
                                                <button
                                                    className="btn btn-xs btn-secondary btn-outline"
                                                    onClick={clearAllFiles}
                                                >
                                                    Clear All
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-success btn-outline"
                                                    onClick={() => uploadFiles(selectedDocumentTaskId)}
                                                >
                                                    Upload Items
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            {pendingUploadItems.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between flex-wrap grow border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5"
                                                >
                                                    <div className="flex items-center flex-wrap gap-3.5">
                                                        <div className="relative size-[50px] shrink-0">
                                                            <svg
                                                                className="w-full h-full stroke-gray-300 fill-gray-100"
                                                                fill="none"
                                                                height="48"
                                                                viewBox="0 0 44 48"
                                                                width="44"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill=""></path>
                                                                <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke=""></path>
                                                            </svg>
                                                            <div className="absolute leading-none start-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4 rtl:translate-x-2/4">
                                                                <i className="ki-filled ki-sms text-xl text-gray-500"></i>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <a
                                                                className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                                                                href={URL.createObjectURL(file)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {file.name}
                                                            </a>
                                                            <span className="text-2sm text-gray-700">
                                                                {formatFileSize(file.size)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => removeFile(index)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                                :
                                ''
                            }

                            <div className="flex flex-col flex-wrap border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5">
                                <div className="flex justify-between items-center">
                                    <div className="modal-title">
                                        Document Items
                                    </div>
                                    <div className="flex gap-4">
                                        {documentItems !== null ? documentItems && documentItems.length > 0 ?
                                            documentManageMode === false ?
                                                <button
                                                    className="btn btn-xs btn-primary btn-outline"
                                                    onClick={() => setDocumentManageMode(true)}
                                                >
                                                    Manage
                                                </button>
                                                :
                                                <button
                                                    className="btn btn-xs btn-secondary btn-outline"
                                                    onClick={() => setDocumentManageMode(false)}
                                                >
                                                    Cancel
                                                </button>
                                            :
                                            ''
                                            :
                                            ''
                                        }

                                    </div>
                                </div>
                                {documentItems !== null ?
                                    documentItems && documentItems.length > 0 ?
                                        documentItems.map((item: any, index: number) => (
                                            <div className="flex flex-col gap-4" key={index}>
                                                <div className="flex items-center justify-between flex-wrap grow border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5">
                                                    <div className="flex items-center flex-wrap gap-3.5">
                                                        <div className="relative size-[50px] shrink-0">
                                                            <svg className="w-full h-full stroke-gray-300 fill-gray-100" fill="none" height="48" viewBox="0 0 44 48" width="44" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M16 2.4641C19.7128 0.320509 24.2872 0.320508 28 2.4641L37.6506 8.0359C41.3634 10.1795 43.6506 14.141 43.6506 
                                                                18.4282V29.5718C43.6506 33.859 41.3634 37.8205 37.6506 39.9641L28 45.5359C24.2872 47.6795 19.7128 47.6795 16 45.5359L6.34937 
                                                                39.9641C2.63655 37.8205 0.349365 33.859 0.349365 29.5718V18.4282C0.349365 14.141 2.63655 10.1795 6.34937 8.0359L16 2.4641Z" fill="">
                                                                </path>
                                                                <path d="M16.25 2.89711C19.8081 0.842838 24.1919 0.842837 27.75 2.89711L37.4006 8.46891C40.9587 10.5232 43.1506 14.3196 43.1506 
                                                                18.4282V29.5718C43.1506 33.6804 40.9587 37.4768 37.4006 39.5311L27.75 45.1029C24.1919 47.1572 19.8081 47.1572 16.25 45.1029L6.59937 
                                                                39.5311C3.04125 37.4768 0.849365 33.6803 0.849365 29.5718V18.4282C0.849365 14.3196 3.04125 10.5232 6.59937 8.46891L16.25 2.89711Z" stroke="">
                                                                </path>
                                                            </svg>
                                                            <div className="absolute leading-none start-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4 rtl:translate-x-2/4">
                                                                <i className="ki-filled ki-sms text-xl text-gray-500">
                                                                </i>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <a
                                                                className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                                                                href={AWS_S3_URL + (item.file_url)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {item.original_name}
                                                            </a>
                                                            <span className="text-2sm text-gray-700">
                                                                {formatFileSize(item.size)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {documentManageMode === true &&
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => removeServerFile(selectedDocumentTaskId, index)}
                                                        >
                                                            Remove
                                                        </button>
                                                    }
                                                </div>
                                            </div>
                                        ))
                                        :
                                        <span>No Items</span>
                                    :
                                    <Loading />
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal p-14" data-modal="true" data-modal-backdrop-static="true" id="date_management_modal">
                <div className="modal-content h-full max-w-[900px]">
                    <div className="modal-header py-4 px-5">
                        <span className="text-lg text-gray-900 font-bold">Date Management</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body overflow-y-auto scrollable-y flex gap-4">
                        <div className="card flex-1">
                            <div className="card-header">
                                <div className="card-title">
                                    Contractual
                                </div>
                            </div>
                            <div className="card-group">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            P1 Start Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractual_p1_start_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractual', 'p1')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            P1 End Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractual_p1_end_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractual', 'p1', 'end')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </div>
                            <div className="card-group">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            P2 Start Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractual_p2_start_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractual', 'p2')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            P2 End Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractual_p2_end_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractual', 'p2', 'end')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </div>
                            <div className="card-group">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            QC Start Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractual_qc_start_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractual', 'qc')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            QC End Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractual_qc_end_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractual', 'qc', 'end')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </div>
                            <div className="card-group">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Post Cleaning Start Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractual_pc_start_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractual', 'pc')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Post Cleaning End Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractual_pc_end_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractual', 'pc', 'end')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </div>
                            <div className="card-group">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Hand Over Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractual_handover_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractual')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </div>
                        </div>

                        <div className="card flex-1">
                            <div className="card-header">
                                <div className="card-title">
                                    Contractor
                                </div>
                            </div>
                            <div className="card-group">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            P1 Start Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractor_p1_start_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractor', 'p1')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            P1 End Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractor_p1_end_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractor', 'p1', 'end')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </div>
                            <div className="card-group">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            P2 Start Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractor_p2_start_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractor', 'p2')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            P2 End Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractor_p2_end_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractor', 'p2', 'end')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </div>
                            <div className="card-group">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            QC Start Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractor_qc_start_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractor', 'qc')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            QC End Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractor_qc_end_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractor', 'qc', 'end')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </div>
                            <div className="card-group">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Post Cleaning Start Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractor_pc_start_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractor', 'pc')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Post Cleaning End Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractor_pc_end_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractor', 'pc', 'end')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </div>
                            <div className="card-group">
                                <tbody>
                                    <tr>
                                        <td className="text-sm text-gray-600 pb-3 pe-4 lg:pe-8 font-semibold">
                                            Hand Over Date:
                                        </td>
                                        <td className="text-sm text-gray-900 pb-3">
                                            <input
                                                type="date"
                                                className="input input-sm"
                                                value={renoProgress.contractor_handover_date || ''}
                                                onChange={(e) => handleChangeDate(e, Number(renoProgress.id), 'contractor')}
                                            // onClick={(e) => e.stopPropagation()} // Prevent tr onClick
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ProgressMgnt;

