import { useCallback } from "react";
import { TaskStatusBadge } from "./task-status-badge";
import { RPMJob, RPMTask, Attachment } from "../../../../types";

interface Props {
    setSelectedTask: React.Dispatch<React.SetStateAction<RPMTask | null>>
    permitJob: RPMJob
    handleStatusChange: (updatedRPMTask: RPMTask, newStatus: string) => void;
}

export const PermitCard = ({ setSelectedTask, permitJob, handleStatusChange }: Props) => {
    const completedTasks = permitJob.rpm_tasks?.filter((task) => task.status === "completed").length || 0;
    const totalTasks = permitJob.rpm_tasks?.length || 0;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const handleStatusClick = useCallback((task: RPMTask) => {
        setSelectedTask(task);
    }, []);

    const handleSave = useCallback((taskId: string, comment: string, attachments: Attachment[]) => {
        console.log(`Saving task ${taskId} with comment: ${comment} and attachments:`, attachments);
    }, []);

    const isOverdue = (task: RPMTask) => {
        if (!task.completed_at || task.status === "completed") return false;
        const dueDate = new Date(task.completed_at);
        const today = new Date();
        return dueDate < today;
    };

    const handleStatusUpdate = useCallback(
        (updatedRPMTask: RPMTask, newStatus: string) => {
            handleStatusChange(updatedRPMTask, newStatus);
        },
        [handleStatusChange]
    );

    return (
        <>
            <div className="shadow-md rounded-xl overflow-hidden bg-white w-full">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Permit</span>
                        <span className="text-sm text-gray-500">{completedTasks}/{totalTasks} completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
                    </div>
                </div>
                <div className="p-4">
                    <div className="h-[320px] overflow-y-auto">
                        <ul className="space-y-2">
                            {permitJob.rpm_tasks?.map((task) => (
                                <li
                                    key={task.id}
                                    className="p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                    onClick={() => handleStatusClick(task)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium">{task.item_name}</span>
                                        </div>
                                        <TaskStatusBadge isStatic={true} status={task.status} />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Last updated: {task.updated_at ? task.updated_at : 'N/A'}</p>
                                    <p className="text-xs text-gray-500">By: {task.updated_by?.name ? task.updated_by.name : 'N/A'}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
};