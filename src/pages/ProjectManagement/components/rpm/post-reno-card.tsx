import { useCallback } from "react";
import { TaskStatusBadge } from "./task-status-badge";
import { RPMJob, RPMTask, Attachment } from "../../../../types";

interface Props {
    setSelectedTask: React.Dispatch<React.SetStateAction<RPMTask | null>>
    postRenoJob: RPMJob
    handleStatusChange: (updatedRPMTask: RPMTask, newStatus: string) => void;
}

export const PostRenoCard = ({ setSelectedTask, postRenoJob, handleStatusChange }: Props) => {
    const completedTasks = postRenoJob.rpm_tasks?.filter((task) => task.status === "completed").length || 0;
    const totalTasks = postRenoJob.rpm_tasks?.length || 0;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const handleStatusClick = useCallback((task: RPMTask) => {
        setSelectedTask(task);
    }, []);

    const handleStatusUpdate = useCallback(
        (updatedRPMTask: RPMTask, newStatus: string) => {
            handleStatusChange(updatedRPMTask, newStatus);
        },
        [handleStatusChange]
    );

    return (
        <div className="shadow-md rounded-xl overflow-hidden bg-white w-full">
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-gray-200 p-2 px-4">
                <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Post-Reno</span>
                    <span className="text-xs text-gray-500">{completedTasks}/{totalTasks}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div className="bg-red-600 h-1 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
                </div>
            </div>
            <div className="p-2">
                <div className="h-[200px] overflow-y-auto">
                    <ul className="space-y-1">
                        {postRenoJob.rpm_tasks?.map((task) => (
                            <li
                                key={task.id}
                                className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                onClick={() => handleStatusClick(task)}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{task.item_name}</span>
                                    <TaskStatusBadge isStatic={true} status={task.status} />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                    Updated: {task.updated_at || "N/A"} by {task.updated_by?.name || "N/A"}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};