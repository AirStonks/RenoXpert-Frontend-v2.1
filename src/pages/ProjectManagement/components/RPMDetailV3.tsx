import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RenoProgress, RPMTask, RPMTaskQC } from '../../../types';
import { VPStatusCard } from './rpm/vp-status-card';
import { DefectCard } from './rpm/defect-card';
import { PermitCard } from './rpm/permit-card';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { PostRenoCard } from './rpm/post-reno-card';
import { RenoPorgressDetailCard } from './rpm/reno-progress-detail';
import RenovationTask from './RenovationTask';
import RenovationQCTask from './RenovationQCTask';
import { HandoverStatusCard } from './rpm/handover-card';

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
    'Not Started': 'bg-slate-100 text-slate-800',
};

const statusQcColors = {
    'Not Started': 'bg-gray-100 text-gray-800',
    'Accepted': 'bg-green-100 text-green-800',
    'Accepted with Comment': 'bg-yellow-100 text-yellow-800',
    'To Rectified': 'bg-indigo-100 text-indigo-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Not Applicable': 'bg-gray-100 text-gray-800',
}

interface Props {
    renoProgress: RenoProgress;
    setRenoProgress: React.Dispatch<React.SetStateAction<RenoProgress | null>>;
}

const formatDate = (date: string) => {
    if (!date) return ''; // Handle undefined or null dates
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
};

function RPMDetailV3({ renoProgress, setRenoProgress }: Props) {
    const [selectedTask, setSelectedTask] = useState<RPMTask | null>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [selectedStage, setSelectedStage] = useState<number>(0);

    const getStatusKey = (status: string | undefined) => {
        if (!status) return '-';
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
                return 'Not Started';
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
    }, [renoProgress]); // Recompute when renoProgress changes

    const handleSelectStage = useCallback((stageIndex: number) => {
        setSelectedStage(stageIndex);
    }, [])

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
        <>
            <div className="flex flex-col gap-2 p-4 py-2 h-screen">
                <div className="flex flex-col items-center">
                    <div className="flex flex-col sm:flex-row justify-between w-full relative">
                        {overallStatusSteps.map((step, index) => (
                            <div
                                key={index}
                                className="flex flex-col items-center flex-1 w-full sm:w-auto relative"
                                role="region"
                                aria-label={`Step ${index + 1}: ${step.label} - ${step.status}`}
                            >
                                <div className="relative flex w-8 h-8">
                                    {step.status === 'In Progress' && (
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                                    )}
                                    <span
                                        className={`relative inline-flex w-8 h-8 rounded-full items-center justify-center text-white font-medium transition-all cursor-pointer duration-200 ${step.status === 'Completed'
                                            ? 'bg-green-500'
                                            : step.status === 'In Progress'
                                                ? 'bg-yellow-500'
                                                : 'bg-gray-300'
                                            } hover:scale-110`}
                                        onClick={() => handleSelectStage(index)}
                                    >
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="text-sm mt-2 text-center">
                                    <div className="font-semibold">{step.label}</div>
                                    <div
                                        className={`text-xs px-2 rounded ${step.status === 'Completed'
                                            ? 'text-green-800'
                                            : step.status === 'In Progress'
                                                ? 'text-yellow-800'
                                                : 'text-gray-800'
                                            }`}
                                    >
                                        {step.status}
                                    </div>
                                    <div
                                        className="text-sm font-medium mt-1 badge badge-sm badge-pill"
                                    >
                                        {step.date}
                                    </div>
                                </div>
                                {index < overallStatusSteps.length - 1 && (
                                    <div
                                        className={`hidden sm:block absolute h-1 top-4 w-[calc(100%-2.5rem)] left-1/2 ${step.status === 'Completed' || overallStatusSteps[index + 1].status === 'Completed'
                                            ? 'bg-green-500'
                                            : step.status === 'In Progress'
                                                ? 'bg-yellow-500'
                                                : 'bg-gray-300'
                                            }`}
                                        style={{ transform: 'translateX(0)', marginLeft: '1.25rem', zIndex: -1 }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 justify-center">

                    {/* If selectedStage included in this array [0, 1, 2] */}
                    {[0, 1, 2, 3, 4].includes(selectedStage) && (
                        <>
                            <RenoPorgressDetailCard
                                renoProgress={renoProgress}
                            />

                            <VPStatusCard
                                setSelectedTask={setSelectedTask}
                                vpJob={renoProgress.rpm_jobs.find((job) => job.job_category === 'vp') || {}}
                                handleStatusChange={handleStatusChange}
                            />

                            <DefectCard
                                setSelectedTask={setSelectedTask}
                                defectJob={renoProgress.rpm_jobs.find((job) => job.job_category === 'defect') || {}}
                                handleStatusChange={handleStatusChange}
                            />

                            <PermitCard
                                setSelectedTask={setSelectedTask}
                                permitJob={renoProgress.rpm_jobs.find((job) => job.job_category === 'permit') || {}}
                                handleStatusChange={handleStatusChange}
                            />
                        </>
                    )}

                    {[5, 6, 7, 8].includes(selectedStage) && (
                        <>
                            <PostRenoCard
                                setSelectedTask={setSelectedTask}
                                postRenoJob={{
                                    ...renoProgress.rpm_jobs.find((job) => job.job_category === 'post_reno') || {},
                                    rpm_tasks: renoProgress.rpm_jobs.find((job) => job.job_category === 'post_reno')?.rpm_tasks?.slice(0, 3) || []
                                }}
                                handleStatusChange={handleStatusChange}
                            />
                            <PostRenoCard
                                setSelectedTask={setSelectedTask}
                                postRenoJob={{
                                    ...renoProgress.rpm_jobs.find((job) => job.job_category === 'post_reno') || {},
                                    rpm_tasks: renoProgress.rpm_jobs.find((job) => job.job_category === 'post_reno')?.rpm_tasks?.slice(3, 6) || []
                                }}
                                handleStatusChange={handleStatusChange}
                            />
                            <HandoverStatusCard
                                setSelectedTask={setSelectedTask}
                                handoverJob={renoProgress.rpm_jobs.find((job) => job.job_category === 'handover') || {}}
                                handleStatusChange={handleStatusChange}
                            />
                        </>
                    )}
                </div>

                {/* If selectedStage included in this array [0, 1, 2] */}
                {[0, 1, 2, 3, 4].includes(selectedStage) && (
                    <RenovationTask
                        renoProgress={renoProgress}
                        getStatusKey={getStatusKey}
                        statusColors={statusColors}
                        setSelectedTask={setSelectedTask}
                        setSelectedSection={setSelectedSection}
                    />
                )}
                {[5, 6, 7, 8].includes(selectedStage) && (
                    <RenovationQCTask
                        renoProgress={renoProgress}
                        getStatusKey={getStatusKey}
                        getQcStatusKey={getQcStatusKey}
                        statusColors={statusColors}
                        statusQcColors={statusQcColors}
                        setSelectedTask={setSelectedTask}
                        setSelectedSection={setSelectedSection}
                    />
                )}

                <div className="my-4">
                    <hr />
                </div>
            </div>

            <TaskDetailDrawer
                selectedTask={selectedTask}
                selectedSection={selectedSection}
                selectedStage={selectedStage}
                onClose={() => {
                    setSelectedTask(null)
                    setSelectedSection(null)
                }}
                onSave={handleUpdateComment}
                onAttachmentChanges={handleAttachmentUpdate}
                taskName="Renovation Task"
                onStatusChange={handleStatusChange}
            />
        </>
    );
}

export default RPMDetailV3;