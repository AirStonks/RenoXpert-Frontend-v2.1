import React, { useEffect, useMemo, useState, useRef } from 'react';
import { RenoProgress } from '../../../types';
import { Slide, toast } from 'react-toastify';
import { KTAccordion } from '../../../metronic/core/components/accordion/accordion';
import {
    HomeIcon,
    PhoneIcon,
    UserIcon,
    ChevronDownIcon,
    DocumentCheckIcon,
    DocumentTextIcon,
    TableCellsIcon,
    LightBulbIcon,
} from '@heroicons/react/24/outline';
import { TaskStatusBadge } from '../../ProjectManagement/components/rpm/task-status-badge';

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

function RPMV3({ renoProgress, setRenoProgress }: RPMV3Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('vp'); // Default active tab
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown visibility
    const dropdownRef = useRef<HTMLDivElement>(null); // Ref for dropdown container

    // Find the active category details (name and icon) based on job_category
    const activeCategory = jobCategories.find(cat => cat.category === activeTab) || jobCategories[0];
    const ActiveTabIcon = activeCategory.icon;

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

    return (
        <div className="flex flex-col w-full py-2 space-y-2">
            {/* General Info Card - Sticky */}
            <div className="sticky top-4 z-10 bg-white border rounded-xl" data-accordion="true">
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

            {/* Progress Stepper */}
            <section className="card" aria-labelledby="progress-heading">
                <div className="flex flex-row border border-gray-200 rounded-lg overflow-hidden">
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
                    <div className="p-4 bg-white md:w-2/3">
                        <div className="flex items-center mb-2">
                            <h2 id="progress-heading" className="text-sm font-bold mr-3">
                                {currentStep.label}
                            </h2>
                            <span className="badge badge-xs badge-pill badge-warning badge-outline">
                                {currentStep.status}
                            </span>
                        </div>
                        <div className="space-y-1">
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
            </section>

            {/* Tabs Section */}
            <section className="space-y-2">
                <div className="relative card border border-gray-200 rounded-lg" ref={dropdownRef}>
                    {/* Section Header with Dropdown Toggle */}
                    <button
                        className="w-full p-4 flex justify-between items-center bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={toggleDropdown}
                        aria-expanded={isDropdownOpen}
                        aria-controls="dropdown-menu"
                    >
                        <div className="flex items-center space-x-2">
                            <ActiveTabIcon className="h-5 w-5 text-gray-600" />
                            <span className="text-sm font-bold text-gray-900">{activeCategory.name}</span>
                        </div>
                        <ChevronDownIcon
                            className={`h-5 w-5 text-gray-600 transform transition-transform duration-300 ease-in-out ${isDropdownOpen ? 'rotate-180' : ''
                                }`}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div
                            id="dropdown-menu"
                            className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-full transition-all duration-300 ease-in-out transform origin-top"
                            style={{
                                opacity: isDropdownOpen ? 1 : 0,
                                transform: isDropdownOpen ? 'scaleY(1)' : 'scaleY(0)',
                                visibility: isDropdownOpen ? 'visible' : 'hidden',
                            }}
                        >
                            {jobCategories.map((cat) => {
                                const CategoryIcon = cat.icon;
                                return (
                                    <button
                                        key={cat.category}
                                        className={`w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-blue-50 flex items-center space-x-2 transition-colors duration-150 ${activeTab === cat.category ? 'bg-blue-50 font-semibold text-blue-600' : ''
                                            }`}
                                        onClick={() => handleTabSelect(cat.category)}
                                        onKeyDown={(e) => handleKeyDown(e, cat.category)}
                                        role="menuitem"
                                        tabIndex={0}
                                    >
                                        <CategoryIcon className="h-5 w-5 text-gray-600" />
                                        <span>{cat.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="shadow-md rounded-lg overflow-hidden bg-white w-full">
                    <div className="bg-gray-200 border-b border-gray-200 p-2 px-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{activeCategory.name}</span>
                        </div>
                    </div>
                    <div className="p-2">
                        <div>
                            <ul className="space-y-1">
                                {renoProgress.rpm_jobs
                                    .find((job) => job.job_category === activeTab)
                                    ?.rpm_tasks.map((task) => (
                                        <li
                                            key={task.id}
                                            className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-2xs">{task.item_name}</span>
                                                <TaskStatusBadge status={task.status} />
                                            </div>
                                            <p className="text-3xs text-gray-500 mt-0.5">
                                                Updated: {task.updated_at || "N/A"} by {task.updated_by?.name || "N/A"}
                                            </p>
                                        </li>
                                    )) || (
                                        <li className="p-2 text-2xs text-gray-500">No tasks available</li>
                                    )}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default RPMV3;