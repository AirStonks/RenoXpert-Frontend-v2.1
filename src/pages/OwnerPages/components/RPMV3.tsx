import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { RenoProgress, RPMTask, TaskStatus } from '../../../types';
import { Slide, toast } from 'react-toastify';
import { KTAccordion } from '../../../metronic/core/components/accordion/accordion';
import {
    HomeIcon,
    PhoneIcon,
    UserIcon,
    DocumentCheckIcon,
    DocumentTextIcon,
    TableCellsIcon,
    LightBulbIcon,
} from '@heroicons/react/24/outline';
import { TaskStatusBadge } from '../../../components/task-status-badge';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { Link, useLocation } from 'react-router-dom';
import { BottomNav } from './bottom-nav-bar';
import { AlertCircleIcon, HelpCircleIcon } from 'lucide-react';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

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

const headerData = { title: 'Reno Progress', backUrl: LOCAL_PATH_PREFIX + 'reno-progress' }

interface RPMV3Props {
    renoProgress: RenoProgress;
    setRenoProgress: React.Dispatch<React.SetStateAction<RenoProgress>>;
}

const jobCategories = [
    { name: 'VP Status', category: 'vp', icon: HomeIcon },
    { name: 'Defect', category: 'defect', icon: DocumentCheckIcon },
    { name: 'Permit', category: 'permit', icon: DocumentTextIcon },
    { name: 'Room & Furnitures', category: 'room_furnitures', icon: HomeIcon },
    { name: 'Bathroom Section', category: 'bathroom', icon: HomeIcon },
    { name: 'Dining, Yard, Foyer', category: 'dining_yard_foyer', icon: TableCellsIcon },
    { name: 'Kitchen', category: 'kitchen', icon: HomeIcon },
    { name: 'Electrical Appliances', category: 'electrical', icon: LightBulbIcon },
    { name: 'Living', category: 'living', icon: HomeIcon },
];

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
    const location = useLocation();
    const [selectedTask, setSelectedTask] = useState<RPMTask | null>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('room_furnitures'); // Default active tab
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown visibility
    const dropdownRef = useRef<HTMLDivElement>(null); // Ref for dropdown container

    // Find the active category details (name and icon) based on job_category
    const activeCategory = jobCategories.find(cat => cat.category === activeTab) || jobCategories[0];
    const ActiveTabIcon = activeCategory.icon;

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
        // Helper function to get job completion percentage by job name
        const getJobCompletion = (jobName: string): number => {
            // Find the RPMJob with the matching job_name from rpm_jobs array
            const job = renoProgress.rpm_jobs?.find(
                (job) => job.name === jobName
            );

            // If job not found or no tasks, return 0
            if (!job || !job.rpm_tasks || job.rpm_tasks.length === 0) {
                return 0;
            }

            // Check if all tasks in the job have status "completed"
            const allTasksCompleted = job.rpm_tasks.every(
                (task) => task.status?.toLowerCase() === "completed" || task.status?.toLowerCase() === "not-available"
            );

            // Return 100 if all tasks are completed, otherwise 0
            return allTasksCompleted ? 1 : 0;
        };

        // Determine Defect & Permit status
        const defectAndPermitStatus =
            getJobCompletion('Defect') === 1 && getJobCompletion('Permit') === 1
                ? 'Completed'
                : 'In Progress';

        const renovationJobCategories = ['room_furnitures', 'bathroom', 'dining_yard_foyer', 'kitchen', 'electrical', 'living'];

        // Determine Renovation status based on Defect & Permit status
        const renovationStatus = defectAndPermitStatus === 'In Progress'
            ? 'Not Started'
            // Else, check if every renoProgress.rpm_jobs that included in renovationJobCategories has a status of "completed"
            : renoProgress.rpm_jobs
                .filter(job => renovationJobCategories.includes(job.job_category))
                .every(job => job.status === 'completed')
                ? 'Completed'
                : 'In Progress';

        const qcStatus = (() => {
            const relevantJobs = renoProgress.rpm_jobs.filter(job => renovationJobCategories.includes(job.job_category));

            // If no relevant jobs or no tasks, return 'Not Started'
            if (relevantJobs.length === 0 || relevantJobs.every(job => job.rpm_tasks.length === 0)) {
                return 'Not Started';
            }

            const allTasks = relevantJobs.flatMap(job => job.rpm_tasks);
            const hasAcceptedTask = allTasks.some(task => task.qc_task.status === 'accepted-with-comment' || task.qc_task.status === 'accepted');
            const allAccepted = allTasks.every(task => task.qc_task.status === 'accepted-with-comment' || task.qc_task.status === 'accepted' || task.status === 'not-applicable');

            if (allAccepted) {
                return 'Completed';
            } else if (hasAcceptedTask) {
                return 'In Progress';
            } else {
                return 'Not Started';
            }
        })();

        const cleaningStatus = (() => {
            const status = renoProgress.rpm_jobs?.find(
                (job) => job.name === 'Post-Reno'
            )?.rpm_tasks.find((task) => task.item_name === 'Cleaning')?.status;

            if (status === 'completed') return 'Completed';
            if (status === 'in-progress') return 'In Progress';

            return 'Not Started';
        })();

        const chStatus = (() => {
            const status = renoProgress.rpm_jobs?.find(
                (job) => job.name === 'Handover'
            )?.rpm_tasks.find((task) => task.item_name === 'Contractor Handover')?.status;

            if (status === 'completed') return 'Completed';
            if (status === 'in-progress') return 'In Progress';
            return 'Not Started';
        })();

        const ohStatus = (() => {
            const status = renoProgress.rpm_jobs?.find(
                (job) => job.name === 'Handover'
            )?.rpm_tasks.find((task) => task.item_name === 'Owner Handover')?.status;

            if (status === 'completed') return 'Completed';
            if (status === 'in-progress') return 'In Progress';
            return 'Not Started';
        })();

        return [
            {
                label: 'Sales',
                status: 'Completed', // Always Completed
                date: renoProgress.date_management.sales_date ? formatDate(renoProgress.date_management.sales_date) : 'N/A'
            },
            {
                label: 'Defect & Permit',
                status: defectAndPermitStatus,
                date: renoProgress.date_management.defect_permit_date ? formatDate(renoProgress.date_management.defect_permit_date) : 'TBC'
            },
            {
                label: 'P1',
                status: renovationStatus,
                date: renoProgress.date_management.qc_date ? formatDate(renoProgress.date_management.p1_date) : 'TBC'
            },
            {
                label: 'P2A',
                status: renovationStatus,
                date: renoProgress.date_management.qc_date ? formatDate(renoProgress.date_management.p2a_date) : 'TBC'
            },
            {
                label: 'P2B',
                status: renovationStatus,
                date: renoProgress.date_management.qc_date ? formatDate(renoProgress.date_management.p2b_date) : 'TBC'
            },
            {
                label: 'QC',
                status: qcStatus,
                date: renoProgress.date_management.qc_date ? formatDate(renoProgress.date_management.qc_date) : 'TBC'
            },
            {
                label: 'Cleaning',
                status: cleaningStatus,
                date: renoProgress.date_management.cleaning_date ? formatDate(renoProgress.date_management.cleaning_date) : 'TBC'
            },
            {
                label: 'Contractor Handover',
                status: chStatus,
                date: renoProgress.date_management.ch_date ? formatDate(renoProgress.date_management.ch_date) : 'TBC'
            },
            {
                label: 'Owner Handover',
                status: ohStatus,
                date: renoProgress.date_management.oh_date ? formatDate(renoProgress.date_management.oh_date) : 'TBC'
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
        (updatedData: RPMTask | RenoProgress, newStatus: string) => {
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
            }
        },
        [selectedTask, setRenoProgress]
    );

    const handleUpdateComment = useCallback(
        (comment_type: 'internal' | 'external', taskId: string, comment: string) => {
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
        },
        [setRenoProgress]
    );

    const handleAttachmentUpdate = useCallback(
        (updatedRPMTask: RPMTask, taskId: string) => {
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
        }, [setRenoProgress]
    );

    return (
        <div className="flex flex-col w-full py-2 space-y-2 max-w-4xl">


            <div className="flex w-full items-center px-2">
                <span className="flex-none">
                    <Link
                        to={location.state?.from ?? headerData.backUrl}
                        className="ki-solid ki-arrow-left items-center">
                    </Link>
                </span>
                <span className="flex-grow text-center font-bold">
                    {headerData.title}
                </span>
            </div>

            {/* General Info Card - Sticky */}
            <div className="sticky top-4 z-40 bg-white border rounded-xl mx-2" data-accordion="true">
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
            <section className="flex mx-auto max-w-4xl" aria-labelledby="progress-heading">
                <div className=" overflow-x-auto w-full max-w-[calc(100vw-2rem)]">
                    <div className="flex flex-row space-x-4 min-w-max h-full">
                        <div className="card w-[calc(95vw-2rem)] border border-gray-200 rounded-lg overflow-hidden max-w-4xl">
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
                                <div className="p-4 bg-white md:w-2/3 flex flex-col space-y-4">
                                    <div className="flex items-center">
                                        <h2 id="progress-heading" className="text-sm font-bold mr-3">
                                            {currentStep.label}
                                        </h2>
                                        <span className="badge badge-xs badge-pill badge-warning badge-outline whitespace-nowrap">
                                            {currentStep.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 text-sm">Estimate Completion Date: </span>
                                        <span className="font-medium text-gray-700 text-xs">
                                            {renoProgress.date_management.oh_date ? formatDate(renoProgress.date_management.oh_date) : 'TBC'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card w-[calc(95vw-2rem)] border border-gray-200 rounded-lg overflow-hidden max-w-4xl">
                            <div className="p-4">
                                <h3 className="text-sm font-bold">VP Status</h3>
                                {renoProgress.rpm_jobs.find((job) => job.job_category === 'vp').rpm_tasks.map(task => (
                                    <div className="flex flex-col">
                                        <ul className='space-y-1'>
                                            <li className="py-2">
                                                <button
                                                    className="flex items-center justify-between w-full"
                                                    onClick={() => task && setSelectedTask(task)}
                                                >
                                                    <span className="font-medium text-2xs">{task.item_name}</span>
                                                    <div className={`${getStatusColor(task.status)} badge badge-xs badge-pill space-x-1`}>
                                                        <span>{getStatusIcon(task.status)}</span>
                                                        <span>{getStatusKey(task.status)}</span>
                                                    </div>
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card w-[calc(95vw-2rem)] border border-gray-200 rounded-lg overflow-hidden max-w-4xl">
                            <div className="p-4">
                                <h3 className="text-sm font-bold">Defect</h3>
                                {renoProgress.rpm_jobs.find((job) => job.job_category === 'defect').rpm_tasks.map(task => (
                                    <div className="flex flex-col">
                                        <ul className='space-y-1'>
                                            <li className="py-2">
                                                <button
                                                    className="flex items-center justify-between w-full"
                                                    onClick={() => task && setSelectedTask(task)}
                                                >
                                                    <span className="font-medium text-2xs">{task.item_name}</span>
                                                    <div className={`${getStatusColor(task.status)} badge badge-xs badge-pill space-x-1`}>
                                                        <span>{getStatusIcon(task.status)}</span>
                                                        <span>{getStatusKey(task.status)}</span>
                                                    </div>
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card w-[calc(95vw-2rem)] border border-gray-200 rounded-lg overflow-hidden max-w-4xl">
                            <div className="p-4">
                                <h3 className="text-sm font-bold">Permit</h3>
                                {renoProgress.rpm_jobs.find((job) => job.job_category === 'permit').rpm_tasks.map(task => (
                                    <div className="flex flex-col">
                                        <ul className='space-y-1'>
                                            <li className="py-2">
                                                <button
                                                    className="flex items-center justify-between w-full"
                                                    onClick={() => task && setSelectedTask(task)}
                                                >
                                                    <span className="font-medium text-2xs">{task.item_name}</span>
                                                    <div className={`${getStatusColor(task.status)} badge badge-xs badge-pill space-x-1`}>
                                                        <span>{getStatusIcon(task.status)}</span>
                                                        <span>{getStatusKey(task.status)}</span>
                                                    </div>
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {/* Task Section */}
            < section className="space-y-2 h-full max-h-[calc(100vw-2rem)]" >
                {/* Task List Section */}
                {
                    ['room_furnitures', 'bathroom'].includes(activeTab) ? (
                        <div className="shadow-lg rounded-xl overflow-hidden bg-white w-full max-w-[calc(100vw-2rem)] mx-auto">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-800">
                                        {activeCategory.name}
                                    </span>
                                </div>
                            </div>

                            {/* Table Container */}
                            <div className="overflow-x-auto overflow-y-auto h-full max-h-[calc(100vw-2rem)]">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-20">
                                        <tr className="bg-gray-50 text-gray-600">
                                            <th className="p-3 text-left text-xs font-medium uppercase tracking-wide sticky left-0 bg-gray-50 z-10 min-w-[150px] border-r border-gray-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)]">
                                                Item Name
                                            </th>
                                            {(() => {
                                                const p2aJob = renoProgress.rpm_jobs.find(
                                                    (job) => job.job_category === activeTab
                                                );
                                                if (!p2aJob) return null;
                                                const rooms = Array.from(
                                                    new Set(p2aJob.rpm_tasks.map((task) => task.room_name).filter(Boolean))
                                                );
                                                return rooms.map((room) => (
                                                    <th
                                                        key={room}
                                                        className="p-3 text-center text-xs font-medium uppercase tracking-wide min-w-[120px] bg-gray-50"
                                                    >
                                                        {room}
                                                    </th>
                                                ));
                                            })()}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const p2aJob = renoProgress.rpm_jobs.find(
                                                (job) => job.job_category === activeTab
                                            );
                                            if (!p2aJob) return null;

                                            const items = Array.from(new Set(p2aJob.rpm_tasks.map((task) => task.item_name)));

                                            return items.map((item) => {
                                                const rooms = Array.from(
                                                    new Set(p2aJob.rpm_tasks.map((task) => task.room_name).filter(Boolean))
                                                );

                                                return (
                                                    <tr
                                                        key={item}
                                                        className="border-b border-gray-100 hover:bg-gray-50 transition-all duration-200 ease-in-out transform hover:scale-[1.005]"
                                                    >
                                                        <td className="p-3 text-3xs text-gray-700 sticky left-0 bg-white z-10 font-medium border-r border-gray-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)]">
                                                            {item}
                                                        </td>
                                                        {rooms.map((room) => {
                                                            const task = p2aJob.rpm_tasks.find(
                                                                (t) => t.room_name === room && t.item_name === item
                                                            );
                                                            const statusKey = getStatusKey(task?.status);

                                                            return (
                                                                <td
                                                                    key={`${room}-${item}`}
                                                                    className={`p-3 text-center text-3xs min-w-[120px] ${statusColors[statusKey]} ${task ? "cursor-pointer hover:underline" : ""}`}
                                                                    onClick={() => task && setSelectedTask(task)}
                                                                >
                                                                    {task ? getStatusKey(task.status) : "-"}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        // Task List Section
                        <div className="shadow-lg rounded-xl overflow-hidden bg-white w-full max-w-[calc(100vw-2rem)] mx-auto">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-800">
                                        {activeCategory.name}
                                    </span>
                                </div>
                            </div>
                            <div className="p-2 overflow-y-auto h-full max-h-[calc(100vw-2rem)]">
                                <div>
                                    <ul className="space-y-1">
                                        {renoProgress.rpm_jobs
                                            .find((job) => job.job_category === activeTab)
                                            ?.rpm_tasks.map((task) => (
                                                <li
                                                    key={task.id}
                                                    className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer"
                                                    onClick={() => task && setSelectedTask(task)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-2xs">{task.item_name}</span>
                                                        <TaskStatusBadge status={task.status as TaskStatus} isStatic={true} />
                                                    </div>
                                                    <p className="text-3xs text-gray-500 mt-0.5">
                                                        Updated: {task.updated_at || 'N/A'} by {task.updated_by?.name || 'N/A'}
                                                    </p>
                                                </li>
                                            )) || <li className="p-2 text-2xs text-gray-500">No tasks available</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )
                }
            </section >

            <TaskDetailDrawer
                selectedTask={selectedTask}
                selectedSection={selectedSection}
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

        </div >
    );
}

export default RPMV3;