import React from 'react';
import { RenoProgress, RPMTask, TaskQCStatus, TaskStatus } from '../../../types';
import {
    HomeIcon,
    DocumentCheckIcon,
    DocumentTextIcon,
    TableCellsIcon,
    LightBulbIcon,
} from '@heroicons/react/24/outline';
import { TaskQCStatusBadge } from '../../../components/task-qc-status-badge';
import { TaskStatusBadge } from '../../../components/task-status-badge';

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

interface Props {
    renoProgress: RenoProgress;
    getStatusKey: (status: string | undefined) => string;
    getQcStatusKey: (status: string | undefined) => string;
    statusColors: { [key: string]: string };
    statusQcColors: { [key: string]: string };
    setSelectedTask: React.Dispatch<React.SetStateAction<RPMTask | null>>;
    activeTab: string;
}

const RenovationQCTask = ({ renoProgress, getStatusKey, getQcStatusKey, statusColors, statusQcColors, setSelectedTask, activeTab }: Props) => {

    const activeCategory = jobCategories.find(cat => cat.category === activeTab) || jobCategories[0];

    return (
        <section className="space-y-2 h-full max-h-[calc(100vw-2rem)] w-full">
            {/* Task List Section */}
            {['room_furnitures', 'bathroom'].includes(activeTab) ? (
                <div className="shadow-lg rounded-xl overflow-hidden bg-white w-full max-w-[calc(100vw-2rem)]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">
                                {activeCategory.name} QC
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
                                                <td className="p-3 text-3xs text-gray-700 sticky left-0 bg-white z-10 font-medium border-r border-gray-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.1)]">{item}</td>
                                                {rooms.map((room) => {
                                                    const task = p2aJob.rpm_tasks.find((t) => t.room_name === room && t.item_name === item);
                                                    const statusKey = task?.status === "completed" ? task.qc_task?.status : task?.status;
                                                    const cellStyle = task?.status === "completed"
                                                        ? statusQcColors[getQcStatusKey(statusKey)]
                                                        : statusColors[getStatusKey(statusKey)] || "";
                                                    const isClickable = task?.status === "completed";

                                                    return (
                                                        <td
                                                            //  `p-3 text-center text-3xs min-w-[120px] ${statusColors[statusKey]} ${task ? "cursor-pointer hover:underline" : ""}`
                                                            key={`${room}-${item}`}
                                                            className={`p-3 text-center text-3xs ${cellStyle} ${task ? "cursor-pointer hover:underline" : ""} ${isClickable ? "" : "opacity-20"}`}
                                                            onClick={isClickable ? () => setSelectedTask(task) : undefined}
                                                        >
                                                            {task ? (isClickable ? getQcStatusKey(statusKey) : getStatusKey(statusKey)) || "-" : "-"}
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
                                    ?.rpm_tasks.map((task) => {
                                        const isClickable = task?.status === "completed";

                                        return (
                                            <li
                                                key={task.id}
                                                className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 ease-in-out cursor-pointer"
                                                onClick={isClickable ? () => setSelectedTask(task) : undefined}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-2xs">{task.item_name}</span>
                                                    {isClickable ? (
                                                        <TaskQCStatusBadge status={task.qc_task?.status as TaskQCStatus} isStatic={true} />
                                                    ) : (
                                                        <TaskStatusBadge status={task.status as TaskStatus} isStatic={true} disabled />
                                                    )}

                                                </div>
                                                <p className="text-3xs text-gray-500 mt-0.5">
                                                    Updated: {task.updated_at || 'N/A'} by {task.updated_by?.name || 'N/A'}
                                                </p>
                                            </li>
                                        )
                                    }) || <li className="p-2 text-2xs text-gray-500">No tasks available</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default RenovationQCTask;