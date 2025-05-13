import React, { useEffect, useMemo, useState } from 'react'
import { RenoProgress } from '../../../types';
import { Slide, toast } from 'react-toastify';
import { KTAccordion } from '../../../metronic/core/components/accordion/accordion';
import { PhoneIcon, UserIcon } from '@heroicons/react/24/outline';

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

interface RPMV3Props {
    renoProgress: RenoProgress;
    setRenoProgress: React.Dispatch<React.SetStateAction<RenoProgress>>
}

function RPMV3({ renoProgress, setRenoProgress }: RPMV3Props) {
    const [isLoading, setIsLoading] = useState(false);

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

    const overallStatusSteps = useMemo(() => {
        // Determine Defect & Permit status
        const defectAndPermitStatus =
            getJobCompletion('Defect') === 1 && getJobCompletion('Permit') === 1
                ? 'Completed'
                : 'In Progress';

        // Determine Renovation status based on Defect & Permit status
        const renovationStatus = defectAndPermitStatus === 'In Progress' ? 'Not Started' : 'In Progress';

        return [
            {
                label: 'Sales',
                status: 'Completed', // Always Completed
            },
            {
                label: 'Defect & Permit',
                status: defectAndPermitStatus,
            },
            {
                label: 'Renovation',
                status: renovationStatus,
            },
            {
                label: 'QC',
                status: 'Not Started',
            },
            {
                label: 'Cleaning',
                status: 'Not Started',
            },
            {
                label: 'Handover',
                status: 'Not Started',
            },
        ];
    }, [renoProgress]);

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
        if (renoProgress) {
            KTAccordion.init();
        }
    }, [renoProgress])

    return (
        <div className="flex flex-col w-full py-2">
            <div data-accordion="true">
                <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id="accordion_1_item_1">
                    <button className="accordion-toggle p-4" data-accordion-toggle="#accordion_1_content_1">
                        <span className="text-sm text-gray-900 font-medium">
                            {renoProgress.property.name} ({renoProgress.sale.order.block}-{renoProgress.sale.order.floor}-{renoProgress.sale.order.unit_no})
                        </span>
                        <i className="ki-outline ki-right text-gray-600 text-2sm accordion-active:hidden block"></i>
                        <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                    </button>
                    <div className="accordion-content hidden border-t" id="accordion_1_content_1">
                        <div className="grid grid-cols-1 gap-4 p-4 py-3">
                            <div className="flex flex-col gap-3">
                                <span className="text-2xs text-gray-600 font-medium uppercase tracking-wide">Owner Details</span>

                                {/* Owner Name */}
                                <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-gray-500" />
                                    <p className="text-xs text-gray-900 font-semibold">{renoProgress.sale.order.user.name}</p>
                                </div>

                                {/* Owner Phone Number */}
                                <div className="flex items-center gap-2">
                                    <PhoneIcon className="h-4 w-4 text-gray-500" />
                                    <p className="text-xs text-gray-900 font-semibold">+{renoProgress.sale.order.user.country_code} {renoProgress.sale.order.user.phone_no}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center w-full px-4 py-2">
                <div className="flex flex-row items-center justify-between w-full max-w-md">
                    {overallStatusSteps.map((step, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center relative flex-1"
                            role="region"
                            aria-label={`Step ${index + 1}: ${step.label} - ${step.status}`}
                        >
                            {/* Step Circle */}
                            <div className="relative w-5 h-5">
                                {step.status === 'In Progress' && (
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-300 opacity-50"></span>
                                )}
                                <span
                                    className={`relative inline-flex w-5 h-5 rounded-full items-center justify-center text-xs text-white font-semibold transition-transform duration-200 ${step.status === 'Completed'
                                            ? 'bg-green-600'
                                            : step.status === 'In Progress'
                                                ? 'bg-yellow-500'
                                                : 'bg-gray-400'
                                        } hover:scale-105`}
                                >
                                    {index + 1}
                                </span>
                            </div>

                            {/* Compact Label and Status */}
                            <div className="mt-1 text-center whitespace-nowrap">
                                <span className="text-xs text-gray-800 font-medium">{step.label}</span>
                                <span
                                    className={`text-xs mx-1 ${step.status === 'Completed'
                                            ? 'text-green-600'
                                            : step.status === 'In Progress'
                                                ? 'text-yellow-500'
                                                : 'text-gray-500'
                                        }`}
                                >
                                    {step.status}
                                </span>
                            </div>

                            {/* Subtle Connecting Line */}
                            {index < overallStatusSteps.length - 1 && (
                                <div
                                    className="absolute top-2.5 left-1/2 w-full h-px bg-gray-200"
                                    style={{ zIndex: -1, transform: 'translateX(-50%)' }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default RPMV3