import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { RenoProgress, RPMTask, RPMTaskQC } from '../../../types';
import { Slide, toast } from 'react-toastify';
import { KTAccordion } from '../../../metronic/core/components/accordion/accordion';
import {
    HomeIcon,
    PhoneIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { BottomNav } from './bottom-nav-bar';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { AlertCircleIcon, ClipboardListIcon, HelpCircleIcon } from 'lucide-react';
import RenovationTask from './RenovationTask';
import RenovationQCTask from './RenovationQCTask';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/op/' : '/';

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null;

const formatDate = (date: string) => {
    if (!date) return ''; // Handle undefined or null dates
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
};

const statusColors = {
    'Not Applicable': 'bg-gray-100 text-gray-800',
    'Procurement Done': 'bg-purple-100 text-purple-800',
    'Pending Stocks': 'bg-orange-100 text-orange-800',
    'Delivered': 'bg-teal-100 text-teal-800',
    'Pending Installation': 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'To Rectified': 'bg-indigo-100 text-indigo-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Not Available': 'bg-slate-100 text-slate-800',
};

const statusQcColors = {
    'Not Started': 'bg-gray-100 text-gray-800',
    'Accepted': 'bg-green-100 text-green-800',
    'Accepted with Comment': 'bg-yellow-100 text-yellow-800',
    'To Rectified': 'bg-indigo-100 text-indigo-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Not Applicable': 'bg-gray-100 text-gray-800',
}

interface RPMV3Props {
    renoProgress: RenoProgress;
    setRenoProgress: React.Dispatch<React.SetStateAction<RenoProgress>>;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case "completed":
            return "bg-green-100 text-green-800 hover:bg-green-200";
        case "in-progress":
            return "bg-blue-100 text-blue-800 hover:bg-blue-200";
        case "pending-installation":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        case "not-applicable":
            return "bg-gray-100 text-gray-800 hover:bg-gray-200";
        case "not-available":
            return "bg-slate-100 text-slate-800 hover:bg-slate-200";
        case "procurement-done":
            return "bg-purple-100 text-purple-800 hover:bg-purple-200";
        case "pending-stocks":
            return "bg-orange-100 text-orange-800 hover:bg-orange-200";
        case "delivered":
            return "bg-teal-100 text-teal-800 hover:bg-teal-200";
        case "to-rectified":
            return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
        case "rejected":
            return "bg-red-100 text-red-800 hover:bg-red-200";
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
};

const getStatusTextColor = (status: string) => {
    switch (status) {
        case "completed":
            return "text-green-800";
        case "in-progress":
            return "text-blue-800";
        case "pending-installation":
            return "text-yellow-800";
        case "not-applicable":
            return "text-gray-800";
        case "not-available":
            return "text-slate-800";
        case "procurement-done":
            return "text-purple-800";
        case "pending-stocks":
            return "text-orange-800";
        case "delivered":
            return "text-teal-800";
        case "to-rectified":
            return "text-indigo-800";
        case "rejected":
            return "text-red-800";
        default:
            return "text-gray-800";
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "completed":
            return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
        case "in-progress":
            return <ClockIcon className="h-4 w-4 text-blue-600" />;
        case "pending-installation":
            return <ClockIcon className="h-4 w-4 text-yellow-600" />;
        case "not-applicable":
            return <HelpCircleIcon className="h-4 w-4 text-gray-600" />;
        case "not-available":
            return <XCircleIcon className="h-4 w-4 text-slate-600" />;
        case "procurement-done":
            return <CheckCircleIcon className="h-4 w-4 text-purple-600" />;
        case "pending-stocks":
            return <AlertCircleIcon className="h-4 w-4 text-orange-600" />;
        case "delivered":
            return <CheckCircleIcon className="h-4 w-4 text-teal-600" />;
        case "to-rectified":
            return <AlertCircleIcon className="h-4 w-4 text-indigo-600" />;
        case "rejected":
            return <XCircleIcon className="h-4 w-4 text-red-600" />;
        default:
            return null;
    }
};

const getStatusKey = (status: string | undefined) => {
    if (!status) return 'Not Available';
    switch (status.toLowerCase()) {
        case 'not-applicable':
            return 'Not Applicable';
        case 'procurement-done':
            return 'Procurement Done';
        case 'pending-stocks':
            return 'Pending Stocks';
        case 'delivered':
            return 'Delivered';
        case 'pending-installation':
            return 'Pending Installation';
        case 'in-progress':
            return 'In Progress';
        case 'completed':
            return 'Completed';
        case 'to-rectified':
            return 'To Rectified';
        case 'rejected':
            return 'Rejected';
        default:
            return 'Not Available';
    }
};

function RPMV3({ renoProgress, setRenoProgress }: RPMV3Props) {
    const [selectedTask, setSelectedTask] = useState<RPMTask | null>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [taskMode, setTaskMode] = useState<'renovation' | 'qc'>('renovation');

    const [activeTab, setActiveTab] = useState('room_furnitures'); // Default active tab
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown visibility
    const dropdownRef = useRef<HTMLDivElement>(null); // Ref for dropdown container

    const getStatusKey = (status: string | undefined) => {
        if (!status) return 'Not Available';
        switch (status.toLowerCase()) {
            case 'not-applicable':
                return 'Not Applicable';
            case 'procurement-done':
                return 'Procurement Done';
            case 'pending-stocks':
                return 'Pending Stocks';
            case 'delivered':
                return 'Delivered';
            case 'pending-installation':
                return 'Pending Installation';
            case 'in-progress':
                return 'In Progress';
            case 'completed':
                return 'Completed';
            case 'to-rectified':
                return 'To Rectified';
            case 'rejected':
                return 'Rejected';
            default:
                return 'Not Available';
        }
    };

    const getQcStatusKey = (status: string | undefined) => {
        if (!status) return 'Not Available';
        switch (status.toLowerCase()) {
            case 'not-started':
                return 'Not Started';
            case 'accepted':
                return 'Accepted';
            case 'accepted-with-comment':
                return 'Accepted with Comment';
            case 'to-rectified':
                return 'To Rectified';
            case 'rejected':
                return 'Rejected';
            default:
                return 'Not Available';
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle keyboard navigation for accessibility
    const handleKeyDown = (event: React.KeyboardEvent, category: string) => {
        if (event.key === 'Enter' || event.key === ' ') {
            handleTabSelect(category);
        }
    };

    // Compute steps dynamically using useMemo to avoid unnecessary recalculations
    const overallStatusSteps = useMemo(() => {
        const getJobCompletion = (jobName: string): number => {
            const job = renoProgress.rpm_jobs?.find((job) => job.name === jobName);
            if (!job || !job.rpm_tasks || job.rpm_tasks.length === 0) {
                return 0;
            }
            const allTasksCompleted = job.rpm_tasks.every(
                (task) => task.status?.toLowerCase() === "completed" || task.status?.toLowerCase() === "not-available"
            );
            return allTasksCompleted ? 1 : 0;
        };

        const defectAndPermitStatus =
            getJobCompletion('Defect') === 1 && getJobCompletion('Permit') === 1
                ? 'Completed'
                : 'In Progress';

        const renovationStatus = defectAndPermitStatus === 'In Progress' ? 'Not Started' : 'In Progress';

        return [
            {
                label: 'Sales',
                status: 'Completed',
                date: renoProgress.date_management.sales_date ? formatDate(renoProgress.date_management.sales_date) : 'N/A',
            },
            {
                label: 'Defect & Permit',
                status: defectAndPermitStatus,
                date: renoProgress.date_management.defect_permit_date ? formatDate(renoProgress.date_management.defect_permit_date) : 'TBC',
            },
            {
                label: 'Renovation',
                status: renovationStatus,
                date: renoProgress.date_management.reno_date ? formatDate(renoProgress.date_management.reno_date) : 'TBC',
            },
            {
                label: 'QC',
                status: 'Not Started',
                date: renoProgress.date_management.qc_date ? formatDate(renoProgress.date_management.qc_date) : 'TBC',
            },
            {
                label: 'Cleaning',
                status: 'Not Started',
                date: renoProgress.date_management.cleaning_date ? formatDate(renoProgress.date_management.cleaning_date) : 'TBC',
            },
            {
                label: 'Contractor Handover',
                status: 'Not Started',
                date: renoProgress.date_management.ch_date ? formatDate(renoProgress.date_management.ch_date) : 'TBC',
            },
            {
                label: 'Owner Handover',
                status: 'Not Started',
                date: renoProgress.date_management.oh_date ? formatDate(renoProgress.date_management.oh_date) : 'TBC',
            },
        ];
    }, [renoProgress]);

    const { completedSteps, progressPercentage, currentStep } = useMemo(() => {
        const completed = overallStatusSteps.reduce((count, step) => {
            return step.status === 'Completed' ? count + 1 : count;
        }, 0);
        const total = overallStatusSteps.length;
        const inProgressStep = overallStatusSteps.find(step => step.status === 'In Progress') || { label: 'Renovation', status: 'In Progress', date: 'TBC' };
        return {
            completedSteps: completed,
            progressPercentage: (completed / total) * 100,
            currentStep: inProgressStep,
        };
    }, [overallStatusSteps]);

    const totalSteps = overallStatusSteps.length;

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

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleTabSelect = (tab: string) => {
        setActiveTab(tab);
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        if (renoProgress) {
            KTAccordion.init();
        }
    }, [renoProgress]);

    const handleStatusChange = useCallback(
        (updatedData: RPMTask | RPMTaskQC | RenoProgress, newStatus: string) => {
            if ('job_id' in updatedData) {
                // Treat as RPMTask
                setSelectedTask(updatedData);
                setRenoProgress((prevRenoProgress) => {
                    if (!prevRenoProgress) return prevRenoProgress;

                    const updatedRPMJobs = prevRenoProgress.rpm_jobs.map((rpmJob) => {
                        if (rpmJob.id === updatedData.job_id) {
                            const updatedRPMTasks = rpmJob.rpm_tasks.map((rpmTask) => {
                                if (rpmTask.id === updatedData.id) {
                                    return { ...rpmTask, status: newStatus };
                                }
                                return rpmTask;
                            });
                            return { ...rpmJob, rpm_tasks: updatedRPMTasks };
                        }
                        return rpmJob;
                    });

                    return { ...prevRenoProgress, rpm_jobs: updatedRPMJobs };
                });
            } else if ('rpm_jobs' in updatedData) {
                setRenoProgress(updatedData);
                setSelectedTask({
                    ...selectedTask,
                    status: "completed"
                });
            } else if ('task_id' in updatedData) {
                setRenoProgress((prevRenoProgress) => {
                    if (!prevRenoProgress) return prevRenoProgress;

                    const updatedRPMJobs = prevRenoProgress.rpm_jobs.map((rpmJob) => {
                        const updatedRPMTasks = rpmJob.rpm_tasks.map((rpmTask) => {
                            if (rpmTask.id === updatedData.task_id) {
                                setSelectedTask({
                                    ...rpmTask,
                                    qc_task: updatedData
                                })
                                return { ...rpmTask, qc_task: updatedData };
                            }
                            return rpmTask;
                        });

                        return { ...rpmJob, rpm_tasks: updatedRPMTasks };
                    });

                    return { ...prevRenoProgress, rpm_jobs: updatedRPMJobs };
                });
            }
        },
        [selectedTask, setRenoProgress]
    );

    const handleUpdateComment = useCallback(
        (comment_type: 'internal' | 'external' | 'qc', taskId: string, comment: string) => {

            if (comment_type === 'qc') {
                setRenoProgress((prevRenoProgress) => {
                    if (!prevRenoProgress) return prevRenoProgress;
                    const updatedRPMJobs = prevRenoProgress.rpm_jobs.map((rpmJob) => {
                        const updatedRPMTasks = rpmJob.rpm_tasks.map((rpmTask) => {
                            if (rpmTask.id === taskId) {
                                setSelectedTask({
                                    ...rpmTask,
                                    qc_task: {
                                        ...rpmTask.qc_task,
                                        internal_comment: comment
                                    }
                                })
                                return {
                                    ...rpmTask,
                                    qc_task: {
                                        ...rpmTask.qc_task,
                                        internal_comment: comment
                                    }
                                };
                            }
                            return rpmTask;
                        });

                        return { ...rpmJob, rpm_tasks: updatedRPMTasks };
                    });

                    return { ...prevRenoProgress, rpm_jobs: updatedRPMJobs };
                });
            } else {
                setRenoProgress((prevRenoProgress) => {
                    if (!prevRenoProgress) return prevRenoProgress;
                    const updatedRPMJobs = prevRenoProgress.rpm_jobs.map((rpmJob) => {
                        const updatedRPMTasks = rpmJob.rpm_tasks.map((rpmTask) => {
                            if (rpmTask.id === taskId) {
                                if (comment_type === 'internal') {
                                    return { ...rpmTask, internal_comment: comment };
                                } else if (comment_type === 'external') {
                                    return { ...rpmTask, owner_comment: comment };
                                }
                            }
                            return rpmTask;
                        });
                        return { ...rpmJob, rpm_tasks: updatedRPMTasks };
                    });
                    console.log({ ...prevRenoProgress, rpm_jobs: updatedRPMJobs });

                    return { ...prevRenoProgress, rpm_jobs: updatedRPMJobs };
                });

                setSelectedTask((prevSelectedTask) => {
                    if (!prevSelectedTask) return prevSelectedTask;
                    if (prevSelectedTask.id === taskId) {
                        if (comment_type === 'internal') {
                            return { ...prevSelectedTask, internal_comment: comment };
                        } else if (comment_type === 'external') {
                            return { ...prevSelectedTask, owner_comment: comment };
                        }
                    }
                    return prevSelectedTask;
                });
            }
        },
        [setRenoProgress]
    );

    const handleAttachmentUpdate = useCallback(
        (updatedRPMTask: RPMTask | RPMTaskQC, taskId: string) => {

            if ("task_id" in updatedRPMTask) {
                setRenoProgress((prevRenoProgress) => {
                    if (!prevRenoProgress) return prevRenoProgress;
                    const updatedRPMJobs = prevRenoProgress.rpm_jobs.map((rpmJob) => {
                        const updatedRPMTasks = rpmJob.rpm_tasks.map((rpmTask) => {
                            if (rpmTask.id === taskId) {
                                return {
                                    ...rpmTask,
                                    qc_task: updatedRPMTask
                                };
                            }
                            return rpmTask;
                        });

                        return { ...rpmJob, rpm_tasks: updatedRPMTasks };
                    });

                    return { ...prevRenoProgress, rpm_jobs: updatedRPMJobs };
                });
            } else {
                setRenoProgress((prevRenoProgress) => {
                    if (!prevRenoProgress) return prevRenoProgress;
                    const updatedRPMJobs = prevRenoProgress.rpm_jobs.map((rpmJob) => {
                        const updatedRPMTasks = rpmJob.rpm_tasks.map((rpmTask) => {
                            if (rpmTask.id === taskId) {
                                return updatedRPMTask;
                            }
                            return rpmTask;
                        });
                        return { ...rpmJob, rpm_tasks: updatedRPMTasks };
                    });
                    console.log({ ...prevRenoProgress, rpm_jobs: updatedRPMJobs });
                    return { ...prevRenoProgress, rpm_jobs: updatedRPMJobs };
                });

                setSelectedTask(updatedRPMTask);
            }
        }, [setRenoProgress]
    );

    return (
        <div className="flex flex-col w-full py-2 space-y-2">
            {/* General Info Card - Sticky */}
            <div className="sticky top-4 z-40 bg-white border rounded-xl" data-accordion="true">
                <div className="card accordion-item w-full" data-accordion-item="true" id="accordion_1_item_1">
                    <button className="accordion-toggle p-4" data-accordion-toggle="#accordion_1_content_1">
                        <div className="flex space-x-3 items-center">
                            <HomeIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                            <span className="text-sm text-gray-900 font-medium">
                                {renoProgress.property.name} ({renoProgress.sale.order.block}-{renoProgress.sale.order.floor}-{renoProgress.sale.order.unit_no})
                            </span>
                        </div>
                        <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                        <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                    </button>
                    <div className="accordion-content hidden border-t" id="accordion_1_content_1">
                        <div className="grid grid-cols-1 gap-4 p-4 py-3">
                            <div className="flex flex-col gap-3">
                                <span className="text-2xs text-gray-600 font-medium uppercase tracking-wide">Owner Details</span>
                                <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-gray-500" />
                                    <p className="text-xs text-gray-900 font-semibold">{renoProgress.sale.order.user.name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <PhoneIcon className="h-4 w-4 text-gray-500" />
                                    <p className="text-xs text-gray-900 font-semibold">+{renoProgress.sale.order.user.country_code} {renoProgress.sale.order.user.phone_no}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            <section className="flex" aria-labelledby="progress-heading">
                <div className=" overflow-x-auto w-full max-w-[calc(100vw-2rem)]">
                    <div className="flex flex-row space-x-4 min-w-max h-full">
                        <div className="card w-[calc(95vw-2rem)] border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex flex-row border border-gray-200 rounded-lg overflow-hidden h-full">
                                <div className="flex items-center justify-center p-4 bg-white border-b md:border-b-0 md:border-r border-gray-200 md:w-1/3">
                                    <div className="relative w-24 h-24">
                                        <svg className="w-full h-full" viewBox="0 0 100 100">
                                            <circle
                                                className="text-gray-200"
                                                strokeWidth="8"
                                                stroke="currentColor"
                                                fill="transparent"
                                                r="44"
                                                cx="50"
                                                cy="50"
                                            />
                                            <circle
                                                className="text-green-500"
                                                strokeWidth="8"
                                                stroke="currentColor"
                                                fill="transparent"
                                                r="44"
                                                cx="50"
                                                cy="50"
                                                strokeDasharray={`${progressPercentage * 2.76} ${276 - progressPercentage * 2.76}`}
                                                strokeDashoffset="0"
                                                strokeLinecap="round"
                                                transform="rotate(-90 50 50)"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <span className="text-lg font-bold">{completedSteps} of {totalSteps}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white md:w-2/3 flex flex-col justify-between">
                                    <div className="flex items-center">
                                        <h2 id="progress-heading" className="text-sm font-bold mr-3">
                                            {currentStep.label}
                                        </h2>
                                        <span className="badge badge-xs badge-pill badge-warning badge-outline whitespace-nowrap">
                                            {currentStep.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center">
                                        <span className="text-gray-500 text-sm">Due Date:</span>
                                        <span className="font-medium text-gray-700 text-xs">{currentStep.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <div className="flex flex-col sm:flex-row sm:items-center">
                                            <span className="text-gray-500 text-sm font-semibold text-blue-600">CHD:</span>
                                            <span className="font-medium text-blue-700 flex items-center text-xs">
                                                {renoProgress.date_management.ch_date ? formatDate(renoProgress.date_management.ch_date) : 'TBC'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center">
                                            <span className="text-gray-500 text-sm font-semibold text-green-600">OHD:</span>
                                            <span className="font-medium text-gray-700 flex items-center text-xs">
                                                {renoProgress.date_management.oh_date ? formatDate(renoProgress.date_management.oh_date) : 'TBC'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card w-[calc(95vw-2rem)] border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-4">
                                <h3 className="text-sm font-bold">VP Status</h3>
                                {renoProgress.rpm_jobs.find((job) => job.job_category === 'vp').rpm_tasks.map(task => (
                                    <div className="flex flex-col" key={task.id}>
                                        <ul className='space-y-1'>
                                            <li className="py-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-2xs">{task.item_name}</span>
                                                    <div className={`${getStatusColor(task.status)} badge badge-xs badge-pill space-x-1`}>
                                                        <span>{getStatusIcon(task.status)}</span>
                                                        <span>{getStatusKey(task.status)}</span>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card w-[calc(95vw-2rem)] border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-4">
                                <h3 className="text-sm font-bold">Defect</h3>
                                {renoProgress.rpm_jobs.find((job) => job.job_category === 'defect').rpm_tasks.map(task => (
                                    <div className="flex flex-col" key={task.id}>
                                        <ul className='space-y-1'>
                                            <li className="py-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-2xs">{task.item_name}</span>
                                                    <div className={`${getStatusColor(task.status)} badge badge-xs badge-pill space-x-1`}>
                                                        <span>{getStatusIcon(task.status)}</span>
                                                        <span>{getStatusKey(task.status)}</span>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card w-[calc(95vw-2rem)] border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-4">
                                <h3 className="text-sm font-bold">Permit</h3>
                                {renoProgress.rpm_jobs.find((job) => job.job_category === 'permit').rpm_tasks.map(task => (
                                    <div className="flex flex-col" key={task.id}>
                                        <ul className='space-y-1'>
                                            <li className="py-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-2xs">{task.item_name}</span>
                                                    <div className={`${getStatusColor(task.status)} badge badge-xs badge-pill space-x-1`}>
                                                        <span>{getStatusIcon(task.status)}</span>
                                                        <span>{getStatusKey(task.status)}</span>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Defect Inspection Form (If available) */}
            {renoProgress.rpm_jobs.find((job) => job.job_category === 'defect')
                .rpm_tasks.find((task) => task.item_name === 'Defect Inspection')
                .status !== 'completed' && (
                    <div className="card w-full rounded-lg">
                        <div className="card-body p-3 space-y-2">
                            <h3 className='flex items-center space-x-2'>
                                <div className="h-5 w-5">
                                    <ExclamationTriangleIcon className='absolute w-5 h-5 text-warning animate-ping' />
                                    <ExclamationTriangleIcon className='relative w-5 h-5 text-warning' />
                                </div>
                                <span className='text-sm text-gray-900 font-semibold'>Reminder</span>
                            </h3>

                            <p className='text-2xs text-gray-700'>
                                This Unit has not been submitted the DI Form. To do defect inspection, please click the button below.
                            </p>

                            <Link
                                to={LOCAL_PATH_PREFIX + `reno/defect-inspection-form/${renoProgress.defect_inspection_form.id}`}
                                className='btn btn-xs btn-info'
                            >
                                DI Form
                            </Link>
                        </div>
                    </div>
                )
            }

            <div className="card w-full rounded-lg">
                <div className="card-body p-3 space-y-2">
                    <h3 className='flex items-center space-x-2'>
                        <div className="h-5 w-5">
                            <ClipboardListIcon className='w-5 h-5 text-primary' />
                        </div>
                        <span className='text-sm text-gray-900 font-semibold h-5'>Task Mode</span>
                    </h3>
                    <div className="flex flex-col">
                        <select
                            className='select select-bordered select-sm'
                            name="task_mode"
                            id="task_mode"
                            onChange={(e) => setTaskMode(e.target.value as 'renovation' | 'qc')}
                        >
                            <option value="renovation">Renovation</option>
                            <option value="qc">QC</option>
                        </select>
                    </div>
                </div>
            </div>



            {/* Task Section */}
            {taskMode === 'renovation' && (
                <RenovationTask
                    renoProgress={renoProgress}
                    getStatusKey={getStatusKey}
                    statusColors={statusColors}
                    setSelectedTask={setSelectedTask}
                    activeTab={activeTab}
                />
            )}

            {taskMode === 'qc' && (
                <RenovationQCTask
                    renoProgress={renoProgress}
                    getStatusKey={getStatusKey}
                    getQcStatusKey={getQcStatusKey}
                    statusColors={statusColors}
                    statusQcColors={statusQcColors}
                    setSelectedTask={setSelectedTask}
                    activeTab={activeTab}
                />
            )}


            <TaskDetailDrawer
                selectedTask={selectedTask}
                selectedSection={selectedSection}
                taskMode={taskMode}
                onClose={() => {
                    setSelectedTask(null)
                    setSelectedSection(null)
                }}
                onSave={handleUpdateComment}
                onAttachmentChanges={handleAttachmentUpdate}
                taskName="Task"
                onStatusChange={handleStatusChange}
            />

            <BottomNav
                activeItem={activeTab}
                setActiveItem={setActiveTab}
            />

        </div>
    );
}

export default RPMV3;