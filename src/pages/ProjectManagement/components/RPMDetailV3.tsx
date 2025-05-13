import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RenoProgress, RPMTask } from '../../../types';
import { VPStatusCard } from './rpm/vp-status-card';
import { DefectCard } from './rpm/defect-card';
import { PermitCard } from './rpm/permit-card';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { PostRenoCard } from './rpm/post-reno-card';
import { RenoPorgressDetailCard } from './rpm/reno-progress-detail';

const statusColors = {
    'Not Started': 'bg-gray-100 text-gray-800',
    'Pending': 'bg-amber-100 text-amber-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'Not Available': 'bg-red-100 text-red-800',
};
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

    const getStatusKey = (status: string | undefined) => {
        if (!status) return 'Not Available';
        if (status.toLowerCase() === 'not-started') return 'Not Started';
        if (status.toLowerCase() === 'pending') return 'Pending';
        if (status.toLowerCase() === 'in-progress') return 'In Progress';
        if (status.toLowerCase() === 'completed') return 'Completed';
        return 'Not Available';
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

        // Determine Renovation status based on Defect & Permit status
        const renovationStatus = defectAndPermitStatus === 'In Progress' ? 'Not Started' : 'In Progress';

        return [
            {
                label: 'Sales',
                status: 'Completed', // Always Completed
                date: renoProgress.date_management.sales_date ? formatDate(renoProgress.date_management.sales_date) : 'N/A'
            },
            {
                label: 'Defect & Permit',
                status: defectAndPermitStatus,
                // status: 'Completed',
                date: renoProgress.date_management.defect_permit_date ? formatDate(renoProgress.date_management.defect_permit_date) : 'TBC'
            },
            {
                label: 'Renovation',
                status: renovationStatus,
                // status: 'Completed',
                date: renoProgress.date_management.reno_date ? formatDate(renoProgress.date_management.reno_date) : 'TBC'
            },
            {
                label: 'QC',
                status: 'Not Started',
                date: renoProgress.date_management.qc_date ? formatDate(renoProgress.date_management.qc_date) : 'TBC'
            },
            {
                label: 'Cleaning',
                status: 'Not Started',
                date: renoProgress.date_management.cleaning_date ? formatDate(renoProgress.date_management.cleaning_date) : 'TBC'
            },
            {
                label: 'Contractor Handover',
                status: 'Not Started',
                date: renoProgress.date_management.ch_date ? formatDate(renoProgress.date_management.ch_date) : 'TBC'
            },
            {
                label: 'Owner Handover',
                status: 'Not Started',
                date: renoProgress.date_management.oh_date ? formatDate(renoProgress.date_management.oh_date) : 'TBC'
            },
        ];
    }, [renoProgress]); // Recompute when renoProgress changes

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
                                        className={`relative inline-flex w-8 h-8 rounded-full items-center justify-center text-white font-medium transition-all duration-200 ${step.status === 'Completed'
                                            ? 'bg-green-500'
                                            : step.status === 'In Progress'
                                                ? 'bg-yellow-500'
                                                : 'bg-gray-300'
                                            } hover:scale-110`}
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

                    <RenoPorgressDetailCard
                        renoProgress={renoProgress}
                    />

                    {overallStatusSteps[2].status !== 'Completed' && (
                        <>
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

                    {overallStatusSteps[2].status === 'Completed' && (
                        <PostRenoCard
                            setSelectedTask={setSelectedTask}
                            postRenoJob={renoProgress.rpm_jobs.find((job) => job.job_category === 'post_reno') || {}}
                            handleStatusChange={handleStatusChange}
                        />
                    )}
                </div>

                {/* <div className="relative my-8">
                    <hr className="border-t border-gray-300" />
                    <button
                        onClick={() => {
                            const rpmSection = document.getElementById('rpm-job-section');
                            if (rpmSection) {
                                rpmSection.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 focus:outline-none"
                        aria-label="Scroll to RPM Job Section"
                    >
                        ↓ Click to Scroll to Project Management Jobs ↓
                    </button>
                </div> */}

                <div
                    id="rpm-job-section"
                    className="flex gap-8 py-4"
                >
                    <div className="flex flex-col flex-[3] w-full gap-8">
                        <div className="shadow-md rounded-xl overflow-hidden bg-white min-w-0 h-max">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                                <h3 className="text-lg font-semibold">Room & Furnitures</h3>
                            </div>
                            <div className="p-4 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-2 text-left">Item Name</th>
                                            {(() => {
                                                const p2aJob = renoProgress.rpm_jobs.find((job) => job.job_category === "room_furnitures");
                                                if (!p2aJob) return null;
                                                const rooms = Array.from(new Set(p2aJob.rpm_tasks.map((task) => task.room_name).filter(Boolean)));
                                                return rooms.map((room) => (
                                                    <th key={room} className="p-2 text-center">
                                                        {room}
                                                    </th>
                                                ));
                                            })()}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const p2aJob = renoProgress.rpm_jobs.find((job) => job.job_category === "room_furnitures");
                                            if (!p2aJob) return null;

                                            const items = Array.from(new Set(p2aJob.rpm_tasks.map((task) => task.item_name)));

                                            return items.map((item) => {
                                                const rooms = Array.from(new Set(p2aJob.rpm_tasks.map((task) => task.room_name).filter(Boolean)));

                                                return (
                                                    <tr key={item} className="border-b hover:bg-gray-50">
                                                        <td className="p-2">{item}</td>
                                                        {rooms.map((room) => {
                                                            const task = p2aJob.rpm_tasks.find((t) => t.room_name === room && t.item_name === item);
                                                            const statusKey = getStatusKey(task?.status);

                                                            return (
                                                                <td
                                                                    key={`${room}-${item}`}
                                                                    className={`p-2 text-center ${statusColors[statusKey]} ${task ? "cursor-pointer hover:underline" : ""}`}
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

                        <div className="shadow-md rounded-xl overflow-hidden bg-white min-w-0 h-max">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                                <h3 className="text-lg font-semibold">Bathroom Section</h3>
                            </div>
                            <div className="p-4 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-2 text-left">Item Name</th>
                                            {(() => {
                                                const p2aJob = renoProgress.rpm_jobs.find((job) => job.job_category === "bathroom");
                                                if (!p2aJob) return null;
                                                const rooms = Array.from(new Set(p2aJob.rpm_tasks.map((task) => task.room_name).filter(Boolean)));
                                                return rooms.map((room) => (
                                                    <th key={room} className="p-2 text-center">
                                                        {room}
                                                    </th>
                                                ));
                                            })()}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const p2aJob = renoProgress.rpm_jobs.find((job) => job.job_category === "bathroom");
                                            if (!p2aJob) return null;

                                            const items = Array.from(new Set(p2aJob.rpm_tasks.map((task) => task.item_name)));

                                            return items.map((item) => {
                                                const rooms = Array.from(new Set(p2aJob.rpm_tasks.map((task) => task.room_name).filter(Boolean)));

                                                return (
                                                    <tr key={item} className="border-b hover:bg-gray-50">
                                                        <td className="p-2">{item}</td>
                                                        {rooms.map((room) => {
                                                            const task = p2aJob.rpm_tasks.find((t) => t.room_name === room && t.item_name === item);
                                                            const statusKey = getStatusKey(task?.status);

                                                            return (
                                                                <td
                                                                    key={`${room}-${item}`}
                                                                    className={`p-2 text-center ${statusColors[statusKey]} ${task ? "cursor-pointer hover:underline" : ""}`}
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
                    </div>

                    <div className="flex flex-col flex-[1] w-full gap-8">
                        <div className="shadow-md rounded-xl overflow-hidden bg-white min-w-[200px] h-max">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                                <h3 className="text-lg font-semibold">Dining, Yard, Foyer</h3>
                            </div>
                            <div className="p-4 overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-2 text-left w-1/3">Item Name</th>
                                            <th className="p-2 text-center w-1/3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const diningJob = renoProgress.rpm_jobs.find((job) => job.job_category === "dining_yard_foyer");
                                            if (!diningJob) return null;

                                            return diningJob.rpm_tasks.map((task) => {
                                                const status = getStatusKey(task?.status);

                                                return (
                                                    <tr key={task.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 w-1/3">{task.item_name}</td>
                                                        <td
                                                            className={`p-2 text-center w-1/3 ${statusColors[status]} ${task ? "cursor-pointer hover:underline" : ""
                                                                }`}
                                                            onClick={() => {
                                                                task && setSelectedTask(task);
                                                                setSelectedSection("Dining, Yard, Foyer");
                                                            }}
                                                        >
                                                            {task ? getStatusKey(task.status) : "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="shadow-md rounded-xl overflow-hidden bg-white min-w-[200px] h-max">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                                <h3 className="text-lg font-semibold">Kitchen</h3>
                            </div>
                            <div className="p-4 overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-2 text-left w-1/3">Item Name</th>
                                            <th className="p-2 text-center w-1/3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const diningJob = renoProgress.rpm_jobs.find((job) => job.job_category === "kitchen");
                                            if (!diningJob) return null;

                                            return diningJob.rpm_tasks.map((task) => {
                                                const status = getStatusKey(task?.status);

                                                return (
                                                    <tr key={task.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 w-1/3">{task.item_name}</td>
                                                        <td
                                                            className={`p-2 text-center w-1/3 ${statusColors[status]} ${task ? "cursor-pointer hover:underline" : ""
                                                                }`}
                                                            onClick={() => {
                                                                task && setSelectedTask(task);
                                                                setSelectedSection("Kitchen");
                                                            }}
                                                        >
                                                            {task ? getStatusKey(task.status) : "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="shadow-md rounded-xl overflow-hidden bg-white min-w-[200px] h-max">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                                <h3 className="text-lg font-semibold">Electrical Appliances</h3>
                            </div>
                            <div className="p-4 overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-2 text-left w-1/3">Item Name</th>
                                            <th className="p-2 text-center w-1/3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const diningJob = renoProgress.rpm_jobs.find((job) => job.job_category === "electrical");
                                            if (!diningJob) return null;

                                            return diningJob.rpm_tasks.map((task) => {
                                                const status = getStatusKey(task?.status);

                                                return (
                                                    <tr key={task.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 w-1/3">{task.item_name}</td>
                                                        <td
                                                            className={`p-2 text-center w-1/3 ${statusColors[status]} ${task ? "cursor-pointer hover:underline" : ""
                                                                }`}
                                                            onClick={() => {
                                                                task && setSelectedTask(task);
                                                                setSelectedSection("Electrical");
                                                            }}
                                                        >
                                                            {task ? getStatusKey(task.status) : "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="shadow-md rounded-xl overflow-hidden bg-white min-w-[200px] h-max">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                                <h3 className="text-lg font-semibold">Living</h3>
                            </div>
                            <div className="p-4 overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-2 text-left w-1/3">Item Name</th>
                                            <th className="p-2 text-center w-1/3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const livingJob = renoProgress.rpm_jobs.find((job) => job.job_category === "living");
                                            if (!livingJob) return null;

                                            return livingJob.rpm_tasks.map((task) => {
                                                const status = getStatusKey(task?.status);

                                                return (
                                                    <tr key={task.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 w-1/3">{task.item_name}</td>
                                                        <td
                                                            className={`p-2 text-center w-1/3 ${statusColors[status]} ${task ? "cursor-pointer hover:underline" : ""
                                                                }`}
                                                            onClick={() => {
                                                                task && setSelectedTask(task);
                                                                setSelectedSection("Living");
                                                            }}
                                                        >
                                                            {task ? getStatusKey(task.status) : "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="my-4">
                    <hr />
                </div>
            </div>

            <TaskDetailDrawer
                selectedTask={selectedTask}
                selectedSection={selectedSection}
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