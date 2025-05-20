import { useState, useCallback } from "react";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskDetailDrawer } from "../TaskDetailDrawer";
import { RPMJob, RPMTask, Attachment } from "../../../../types";

interface Props {
    keyManagementJob: RPMJob
}

export const KeyManagementCard = ({ keyManagementJob }: Props) => {
    const [selectedTask, setSelectedTask] = useState<RPMTask | null>(null);

    const completedTasks = keyManagementJob.rpm_tasks?.filter((task) => task.status === "completed").length || 0;
    const totalTasks = keyManagementJob.rpm_tasks?.length || 0;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const handleStatusClick = useCallback((task: RPMTask) => {
        setSelectedTask(task);
    }, []);

    const handleKeyManagementClick = () => {
        alert("Redirecting to Defect Inspection Form...");
    };

    return (
        <>
            <div className="shadow-md rounded-xl overflow-hidden bg-white w-full">
                <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Key Management</span>
                        <span className="text-sm text-gray-500">{completedTasks}/{totalTasks} completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
                    </div>
                </div>
                <div className="p-4 h-[360px]">
                    <button
                        className="w-full mb-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 transition-colors duration-200"
                        onClick={handleKeyManagementClick}
                    >
                        <span className="text-sm">📋</span>
                        <span>Open Key Management Detail</span>
                    </button>
                    <div className="h-[340px] overflow-y-auto">
                        <ul className="space-y-2">
                            {keyManagementJob.rpm_tasks?.map((task) => (
                                <li
                                    key={task.id}
                                    className="p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                    onClick={() => handleStatusClick(task)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium">{task.item_name}</span>
                                        </div>
                                        <TaskStatusBadge status={task.status} />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Last updated: {task.updated_at ? task.updated_at : 'N/A'}</p>
                                    <p className="text-xs text-gray-500">By: {task.updated_by?.name ? task.updated_by.name : 'N/A'}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <TaskDetailDrawer
                selectedTask={selectedTask}
                onClose={() => setSelectedTask(null)}
                onSave={() => { }}
                taskName="Key Management"
            />
        </>
    );
};