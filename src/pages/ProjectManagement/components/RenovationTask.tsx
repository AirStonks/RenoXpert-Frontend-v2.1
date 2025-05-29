import React from 'react';
import { RenoProgress, RPMTask } from '../../../types';

interface Props {
    renoProgress: RenoProgress;
    getStatusKey: (status: string | undefined) => string;
    statusColors: { [key: string]: string };
    setSelectedTask: React.Dispatch<React.SetStateAction<RPMTask | null>>;
    setSelectedSection: React.Dispatch<React.SetStateAction<string | null>>;
}

const RenovationTask = ({ renoProgress, getStatusKey, statusColors, setSelectedTask, setSelectedSection }: Props) => {
    return (
        <div id="rpm-job-section" className="flex gap-8 py-4">
            <div className="flex flex-col flex-[3] w-full gap-8">
                {/* Room & Furnitures Section */}
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

                {/* Bathroom Section */}
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
                {/* Dining, Yard, Foyer Section */}
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
                                                    className={`p-2 text-center w-1/3 ${statusColors[status]} ${task ? "cursor-pointer hover:underline" : ""}`}
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

                {/* Kitchen Section */}
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
                                                    className={`p-2 text-center w-1/3 ${statusColors[status]} ${task ? "cursor-pointer hover:underline" : ""}`}
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

                {/* Electrical Appliances Section */}
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
                                                    className={`p-2 text-center w-1/3 ${statusColors[status]} ${task ? "cursor-pointer hover:underline" : ""}`}
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

                {/* Living Section */}
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
                                                    className={`p-2 text-center w-1/3 ${statusColors[status]} ${task ? "cursor-pointer hover:underline" : ""}`}
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
    );
};

export default RenovationTask;