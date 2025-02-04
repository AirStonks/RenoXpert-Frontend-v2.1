import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import Header from "./components/Header";
import { JobTask, PhaseJob, RenoProgress } from "../../types";
import { KTAccordion } from "../../metronic/core";
import Loading from "../../components/Loading";
import { Slide, toast } from "react-toastify";
import { changeTaskStatus, fetchRenoProgressDetail, fetchTaskDocuments, removeTaskDocument, updateSelectedTaskComments, uploadTaskDocuments } from "../../services/operationApi";
import imageCompression from 'browser-image-compression';

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

const headerData = { title: 'Reno Progress', backUrl: '/op/home' }
const maxFiles = 10; // Maximum number of files allowed

interface AttachmentTaskLabel {
    phase: string;
    job: string;
    task: string;
}

function RenoProgressManagement() {
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;

    const [renoProgress, setRenoProgress] = useState<RenoProgress>(null);
    const [loading, setLoading] = useState(false);


    const [pendingUploadItems, setPendingUploadItems] = useState<File[]>(null);
    const [dragging, setDragging] = useState(false);
    const [documentItems, setDocumentItems] = useState<[]>(null);
    const [selectedDocumentTaskId, setSelectedDocumentTaskId] = useState<number>(null);
    const [selectedTaskLabel, setSelectedTaskLabel] = useState<AttachmentTaskLabel>({ phase: '', job: '', task: '' });
    const [selectedTask, setSelectedTask] = useState<JobTask>(null);
    const [documentManageMode, setDocumentManageMode] = useState(false);

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

    const getRenoProgress = async () => {
        setLoading(true);

        try {
            const response = await fetchRenoProgressDetail(renoProgressId);

            if (response?.success) {
                setRenoProgress(response.data);
            }

        } catch (error) {
            console.log(error);
        }

        setLoading(false);
    }

    useEffect(() => {
        document.title = "Reno Progress | RenoXpert";


        const initData = async () => {
            await getRenoProgress();
        }

        initData();
        KTAccordion.init();

    }, []);

    // Handle file selection from input
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {

        // const fileInput = event.target;
        // if (!fileInput.files || fileInput.files.length === 0) {
        //     return;
        // }

        // try {
        //     const options = {
        //         maxSizeMB: 2, // Max file size (in MB)
        //         maxWidthOrHeight: 1920, // Max image width/height
        //         useWebWorker: true, // Use a web worker to compress the image in the background
        //     };

        //     // Compress the image using browser-image-compression
        //     const compressedFile = await imageCompression(event.target.files[0], options);

        //     const compressedImage = new File(
        //         [compressedFile],
        //         event.target.files[0].name,
        //         { type: event.target.files[0].type }
        //     );

        // } catch (error) {
        //     notify('error', 'Error uploading file.');
        // }

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
    const removeFile = (index: number) => {
        setPendingUploadItems((prevItems) => prevItems.filter((_, i) => i !== index));
    };

    const removeServerFile = async (taskId: number, documentIndex: number) => {
        setLoading(true);

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

        setLoading(false);
    }

    // Clear all files
    const clearAllFiles = () => {
        setPendingUploadItems([]);
    };

    // Upload files (placeholder function)
    const uploadFiles = async (taskId: number) => {
        setLoading(true);

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

        setLoading(false);
    };

    const formatFileSize = (size: number) => {
        const KB = 1024;
        const MB = KB * 1024;
        if (size >= MB) {
            return `${(size / MB).toFixed(2)} MB`;
        }
        return `${(size / KB).toFixed(2)} KB`;
    };

    const handleOpenDocumentModal = async (taskId: number, phase: string, job: string, task: string) => {
        setSelectedDocumentTaskId(taskId);
        setSelectedTaskLabel({
            phase: phase,
            job: job,
            task: task
        })

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

    const handleCloseModal = () => {
        setPendingUploadItems(null);
        setDocumentItems(null);
        setSelectedTaskLabel({ phase: '', job: '', task: '' });
        setSelectedTask(null);
    }

    const handleOpenModal = (task: JobTask, phaseName: string, jobName: string, taskName: string) => {
        setSelectedTaskLabel({
            phase: phaseName,
            job: jobName,
            task: taskName
        });

        setSelectedTask(task);
    }

    const handleChangeTaskComment = async () => {
        setLoading(true);

        try {
            const response = await updateSelectedTaskComments(renoProgressId, Number(selectedTask.id), selectedTask.owner_comment, selectedTask.internal_comment);
            const updatedTask: JobTask = response.data;

            setRenoProgress((prevRenoProgress) => ({
                ...prevRenoProgress,
                phases: prevRenoProgress.phases.map((phase) => ({
                    ...phase,
                    jobs: phase.jobs.map((job) => ({
                        ...job,
                        tasks: job.tasks.map((task) => {
                            if (Number(task.id) === Number(selectedTask.id)) {
                                return updatedTask;  // Directly return the updatedTask, not an object
                            }
                            return task;  // Ensure all other tasks are unchanged
                        }),
                    })),
                })),
            }));

            notify('success', 'Comments updated successfully.');

        } catch (error) {
            console.log(error);
        }

        setLoading(false);
    }

    const handleChangeTaskStatus = async (e: React.ChangeEvent<HTMLSelectElement>, selectedTaskId: number) => {
        const status = e.target.value;

        setLoading(true);

        try {
            const response = await changeTaskStatus(renoProgressId, Number(selectedTaskId), status);
            const updatedTask: JobTask = response.data;

            if (response?.success) {

                setRenoProgress((prevRenoProgress) => ({
                    ...prevRenoProgress,
                    phases: prevRenoProgress.phases.map((phase) => ({
                        ...phase,
                        jobs: phase.jobs.map((job) => ({
                            ...job,
                            tasks: job.tasks.map((task) => {
                                if (Number(task.id) === Number(selectedTask.id)) {
                                    return updatedTask;  // Directly return the updatedTask, not an object
                                }
                                return task;  // Ensure all other tasks are unchanged
                            }),
                        })),
                    })),
                }));

                setSelectedTask(updatedTask);


                notify('success', 'Status updated successfully');
            }
        } catch (error) {
            notify('error', 'Failed to update status');
        }

        setLoading(false);
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

    return (
        <>
            <Header {...headerData} />

            {loading && <Loading />}

            <div className="card w-full shadow-none mb-4">
                <div className="card-body flex flex-col p-4">
                    <div className="flex justify-between">
                        <div className="flex flex-col">
                            <span className="text-slate-900 text-xl font-bold capitalize">
                                {renoProgress?.property?.block}-{renoProgress?.property?.floor}-{renoProgress?.property?.unit_no}
                            </span>

                            <span className="text-slate-700 text-sm font-medium mb-5">
                                {renoProgress?.property?.name}
                            </span>
                        </div>
                        <div className="flex">
                            <button className="btn btn-secondary btn-sm">
                                View Owner Detail
                            </button>
                        </div>
                    </div>

                    <span className="text-sm font-semibold block mb-2">
                        Complete: {(((renoProgress?.pre_reno_completion * 0.2) + (renoProgress?.reno_completion * 0.7) + (renoProgress?.post_reno_completion * 0.1)) * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </span>

                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                            style={{
                                width: `${(((renoProgress?.pre_reno_completion * 0.2) + (renoProgress?.reno_completion * 0.7) + (renoProgress?.post_reno_completion * 0.1)) * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
                                height: '8px'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="card w-full shadow-none mb-4">
                <div className="card-header p-4">
                    <div className="card-title text-sm">
                        Forms
                    </div>
                </div>
                <div className="card-body p-4">
                    <div className="flex items-center mb-2">
                        <span className="text-sm text-gray-600 items-center">Quick access to the forms.</span>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to={`/reno/defect-inspection-form?progressId=${renoProgressId}`}
                            className="btn btn-info btn-sm"
                        >
                            DI Form
                        </Link>
                        <button
                            className="btn btn-info btn-sm"
                        >
                            QC Form
                        </button>
                    </div>
                </div>
            </div>

            <div className="card w-full shadow-none">
                <div className="card-body p-4 flex flex-col gap-4" data-accordion="true">
                    <span className="">Progress</span>

                    {renoProgress &&
                        renoProgress.phases.map((phase, phaseIndex) => {
                            let currentPhase = '';
                            let currentPhaseCompletion = '';
                            if (phaseIndex === 0) {
                                currentPhase = 'pre_reno';
                                currentPhaseCompletion = 'pre_reno_completion';
                            } else if (phaseIndex === 1) {
                                currentPhase = 'p1';
                                currentPhaseCompletion = 'p1_completion';
                            } else if (phaseIndex === 2) {
                                currentPhase = 'p2a';
                                currentPhaseCompletion = 'p2a_completion';
                            } else if (phaseIndex === 3) {
                                currentPhase = 'p2b';
                                currentPhaseCompletion = 'p2b_completion';
                            } else if (phaseIndex === 4) {
                                currentPhase = 'iot';
                                currentPhaseCompletion = 'iot_completion';
                            } else if (phaseIndex === 5) {
                                currentPhase = 'post_reno';
                                currentPhaseCompletion = 'post_reno_completion';
                            }
                            return (
                                <div className="flex flex-col gap-5" key={phaseIndex}>
                                    <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id={phase.id}>
                                        <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + phase.id}>
                                            <div className="flex flex-col items-start">
                                                <span className="text-sm text-gray-900 font-medium">
                                                    {phase.name}
                                                </span>
                                            </div>
                                            <div className="flex">
                                                <div className="flex mr-24">
                                                </div>
                                                <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                            </div>
                                        </button>
                                        <div className="accordion-content hidden border-t" id={"package_content_" + phase.id}>

                                            <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
                                                <div className="flex flex-col justify-center divide-y divide-slate-200 [&>*]:py-4">
                                                    <div className="w-full max-w-3xl mx-auto">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-semibold block">Phase Completion: {(renoProgress[currentPhaseCompletion] * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                                                {/* <Link
                                                                    to={`/owner/reno/progress/${renoProgressId}/phase/${currentPhase}/attachments`}
                                                                    className="btn btn-info btn-xs"
                                                                >
                                                                    View Photos
                                                                </Link> */}
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                                <div
                                                                    className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300"
                                                                    style={{
                                                                        width: `${renoProgress[currentPhaseCompletion] * 100}%`,
                                                                        height: '8px'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-full max-w-3xl mx-auto">
                                                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-300">
                                                            {/* <div className="-my-6"> */}
                                                            {phase.jobs
                                                                .sort((a, b) => b.priority - a.priority) // Sort jobs by priority (higher number comes first)
                                                                .map((job, jobIndex) => {
                                                                    const jobProgress = calculateJobProgress(job);

                                                                    return (
                                                                        <div className="relative" key={jobIndex}>
                                                                            <div className="md:flex items-center space-x-4">
                                                                                <div className="flex items-center space-x-4">
                                                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow">
                                                                                        <svg className="fill-emerald-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                                                                                            <path d="M8 0a8 8 0 1 0 8 8 8.009 8.009 0 0 0-8-8Zm0 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
                                                                                        </svg>
                                                                                    </div>
                                                                                    <div className="ml-14">
                                                                                        <span className="text-indigo-500 text-base font-bold mr-2">{job.name}</span>
                                                                                        {/* <span className="text-slate-500 ">opened the request</span> */}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="ml-14 mb-4">
                                                                                <span className="text-sm font-semibold block mb-2">Progress: {jobProgress.toFixed(2)}%</span>
                                                                                <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                                                    <div
                                                                                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                                                        style={{
                                                                                            width: `${jobProgress}%`,
                                                                                            height: '8px'
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div className="ml-14 mb-4">
                                                                                {job.tasks.map((task, taskIndex) => (
                                                                                    <div className="flex flex-col mb-8" key={taskIndex}>
                                                                                        <div className="flex mb-1 items-center gap-2">
                                                                                            <span className="text-sm font-bold">{task.name} {currentPhase === 'p1' || currentPhase === 'iot' ? task.area : 'no'}</span>
                                                                                        </div>
                                                                                        {(currentPhase === 'p1' || currentPhase === 'iot') &&
                                                                                            <div className="flex mb-1 items-center gap-2">
                                                                                                <span className="text-xs text-gray-500 font-semibold">Room/Area: </span>
                                                                                                <span className="text-xs text-gray-500 font-semibold">{task.area}</span>
                                                                                            </div>
                                                                                        }
                                                                                        <div className="flex mb-1 items-center gap-2">
                                                                                            <span className="text-xs text-gray-500 font-semibold">Lastest Date: </span>
                                                                                            <span className="text-xs text-gray-500 font-semibold">{task.updated_at}</span>
                                                                                        </div>
                                                                                        <div className="flex mb-1 items-center gap-2">
                                                                                            <span className="text-xs text-gray-500 font-semibold">Internal Comment: </span>
                                                                                            <span className="text-xs text-gray-500 font-semibold">{task.internal_comment || '-'}</span>
                                                                                        </div>
                                                                                        <div className="flex mb-1 items-center gap-2">
                                                                                            <span className="text-xs text-gray-500 font-semibold">Owner Comment: </span>
                                                                                            <span className="text-xs text-gray-500 font-semibold">{task.owner_comment || '-'}</span>
                                                                                        </div>
                                                                                        <div className="flex mb-2 items-center gap-2">
                                                                                            <span className="text-xs text-gray-500 font-semibold">Status: </span>
                                                                                            <span className="text-xs text-gray-500 font-semibold">{task.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            {task.is_defect_form || task.is_qc_form ?
                                                                                                ''
                                                                                                :
                                                                                                <>
                                                                                                    <button
                                                                                                        className="btn btn-primary btn-xs"
                                                                                                        data-modal-toggle="#status_modal"
                                                                                                        onClick={() => handleOpenModal(task, phase.name, job.name, task.name)}
                                                                                                    >
                                                                                                        Status
                                                                                                    </button>
                                                                                                    <button
                                                                                                        className="btn btn-success btn-xs"
                                                                                                        data-modal-toggle="#attachment_modal"
                                                                                                        onClick={() => handleOpenDocumentModal(Number(task.id), phase.name, job.name, task.name)}
                                                                                                    >
                                                                                                        Attachments
                                                                                                    </button>
                                                                                                </>
                                                                                            }
                                                                                            <button
                                                                                                className="btn btn-info btn-xs"
                                                                                                data-modal-toggle="#comment_modal"
                                                                                                onClick={() => handleOpenModal(task, phase.name, job.name, task.name)}
                                                                                            >
                                                                                                Comments
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>

            <div className="modal" data-modal="true" data-modal-backdrop-static="true" id="status_modal">
                <div className="modal-content modal-center-y md:max-w-[800px]">
                    <div className="modal-header py-2 px-5">
                        <span className="text-gray-900 font-semibold">Status</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                            onClick={handleCloseModal}
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>

                    <div className="modal-body overflow-y-auto scrollable-y p-3">
                        <div className="flex flex-col flex-wrap border border-gray-200 rounded gap-2 p-3 mb-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center">
                                    <span className="text-lg font-semibold">{selectedTaskLabel.task}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Phase:</span>
                                    <span className="text-sm">{selectedTaskLabel.phase}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Job:</span>
                                    <span className="text-sm">{selectedTaskLabel.job}</span>
                                </div>
                            </div>
                        </div>

                        {selectedTask &&
                            <div className="flex flex-col mb-4">
                                <div className="flex flex-col flex-wrap lg:flex-nowrap">
                                    <label className="form-label max-w-32">
                                        Status
                                    </label>
                                    <select
                                        className="select select-bordered w-full max-w-xs"
                                        name="status"
                                        value={selectedTask.status}
                                        onChange={(e) => handleChangeTaskStatus(e, Number(selectedTask.id))}
                                    >
                                        <option value="not_started">Not Started</option>
                                        <option value="started">Started</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>}
                    </div>

                    <div className="modal-footer justify-end">
                    </div>
                </div>
            </div>

            <div className="modal" data-modal="true" data-modal-backdrop-static="true" id="attachment_modal">
                <div className="modal-content modal-overlay md:max-w-[800px]">
                    <div className="modal-header py-2 px-5">
                        <span className="text-gray-900 font-semibold">Attachments</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                            onClick={handleCloseModal}
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body overflow-y-auto scrollable-y p-3">
                        <div className="flex flex-col flex-wrap border border-gray-200 rounded gap-2 p-3 mb-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center">
                                    <span className="text-lg font-semibold">{selectedTaskLabel.task}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Phase:</span>
                                    <span className="text-sm">{selectedTaskLabel.phase}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Job:</span>
                                    <span className="text-sm">{selectedTaskLabel.job}</span>
                                </div>
                            </div>
                        </div>

                        <label
                            className={`flex bg-center w-full p-1 lg:p-2 bg-no-repeat bg-[length:550px] border border-gray-300 rounded-xl border-dashed branding-bg mb-4 
                                ${dragging ? 'border-primary border-1 bg-gray-100' : ''}`} // Add custom styles when dragging
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            htmlFor="file-upload"
                        >
                            <div className="flex flex-col place-items-center place-content-center text-center rounded w-full">
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
                                <span
                                    className="text-gray-900 text-xs font-medium hover:text-primary-active mb-px cursor-pointer"
                                >
                                    Click or Drag & Drop
                                </span>

                                <span className="text-2xs text-gray-700 text-nowrap">
                                    max size: 50MB | max files: {maxFiles}
                                </span>
                            </div>
                        </label>

                        {pendingUploadItems !== null ?
                            pendingUploadItems.length > 0 && (
                                <div className="flex flex-col flex-wrap border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5 mb-4">
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

                        <div className="flex flex-col flex-wrap border border-gray-200 rounded gap-2 p-3">
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

            <div className="modal" data-modal="true" data-modal-backdrop-static="true" id="comment_modal">
                <div className="modal-content modal-center-y md:max-w-[800px]">
                    <div className="modal-header py-2 px-5">
                        <span className="text-gray-900 font-semibold">Commetns</span>
                        <button
                            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                            data-modal-dismiss="true"
                            onClick={handleCloseModal}
                        >
                            <i className="ki-filled ki-cross"></i>
                        </button>
                    </div>
                    <div className="modal-body overflow-y-auto scrollable-y p-3">
                        <div className="flex flex-col flex-wrap border border-gray-200 rounded gap-2 p-3 mb-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center">
                                    <span className="text-lg font-semibold">{selectedTaskLabel.task}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Phase:</span>
                                    <span className="text-sm">{selectedTaskLabel.phase}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Job:</span>
                                    <span className="text-sm">{selectedTaskLabel.job}</span>
                                </div>
                            </div>
                        </div>

                        {selectedTask && <>
                            <div className="flex flex-col mb-4">
                                <div className="flex flex-col flex-wrap lg:flex-nowrap">
                                    <label className="form-label max-w-32">
                                        Owner Comment
                                    </label>
                                    <span className="text-xs text-gray-500 font-semibold mb-2">** This comment will be visible to owner</span>
                                    <input
                                        className="input"
                                        name="owner_comment"
                                        type="text"
                                        value={selectedTask.owner_comment ? selectedTask.owner_comment : ''}
                                        onChange={(e) => setSelectedTask({ ...selectedTask, owner_comment: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2">
                                    <label className="form-label max-w-32">
                                        Internal Comment
                                    </label>
                                    <input
                                        className="input"
                                        name="internal_comment"
                                        type="text"
                                        value={selectedTask.internal_comment ? selectedTask.internal_comment : ''}
                                        onChange={(e) => setSelectedTask({ ...selectedTask, internal_comment: e.target.value })}
                                    />
                                </div>
                            </div>
                        </>}

                    </div>

                    <div className="modal-footer justify-end">
                        <div className="flex gap-2">
                            <button
                                className="btn btn-secondary btn-sm"
                                data-modal-dismiss="true"
                                onClick={handleCloseModal}
                            >
                                Cancel
                            </button>

                            <button
                                className="btn btn-primary btn-sm"
                                onClick={handleChangeTaskComment}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RenoProgressManagement;