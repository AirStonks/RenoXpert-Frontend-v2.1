import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import Header from "./components/Header";
import { fetchRenoProgress } from "../../services/api";
import { PhaseJob, RenoProgress } from "../../types";
import { KTAccordion } from "../../metronic/core";

const headerData = { title: 'Reno Progress', backUrl: '/op/home' }

function RenoProgressManagement() {
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;


    const [renoProgress, setRenoProgress] = useState<RenoProgress>(null);

    useEffect(() => {
        document.title = "Reno Progress | RenoXpert";


        const initData = async () => {
            await getRenoProgress();
        }

        initData();
        KTAccordion.init();

    }, []);

    const getRenoProgress = async () => {
        try {
            const response = await fetchRenoProgress(renoProgressId);

            if (response?.success) {
                setRenoProgress(response.data);
            }

        } catch (error) {
            console.log(error);
        }
    }

    const calculateJobProgress = (job: PhaseJob) => {
        // Define the status weightages
        const statusWeights = {
            not_started: 0,
            started: 0.25,
            in_progress: 0.75,
            completed: 1,
        };

        // Calculate the weighted sum of task statuses using task_weightage
        const weightedSum = job.tasks.reduce((sum, task) => {
            const statusWeight = statusWeights[task.status] || 0;
            const taskWeight = task.task_weightage || 1; // Use task_weightage or default to 1 if not provided
            return sum + (taskWeight * statusWeight);
        }, 0);

        // Calculate total task weight (sum of all task weights)
        const totalWeight = job.tasks.reduce((sum, task) => sum + (task.task_weightage || 1), 0); // Default to 1 if task_weightage is not present

        // Return the progress percentage (multiply by 100 to get percentage)
        return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    };

    return (
        <>
            <Header {...headerData} />

            <div className="card w-full shadow-none mb-4">
                <div className="card-body flex flex-col p-4">
                    <span className="text-slate-900 text-xl font-bold capitalize">
                        {renoProgress?.property?.block}-{renoProgress?.property?.floor}-{renoProgress?.property?.unit_no}
                    </span>

                    <span className="text-slate-700 text-sm font-medium mb-5">
                        {renoProgress?.property?.name}
                    </span>

                    <span className="text-sm font-semibold block mb-2">
                        Complete: {(((renoProgress?.pre_reno_completion * 0.2) + (renoProgress?.reno_completion * 0.7) + (renoProgress?.post_reno_completion * 0.1)) * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </span>

                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                            style={{
                                width: `${(((renoProgress?.pre_reno_completion * 0.2) + (renoProgress?.reno_completion * 0.7) + (renoProgress?.post_reno_completion * 0.1)) * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
                                height: '8px'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="card w-full shadow-none mb-4">
                <div className="card-body">

                </div>
            </div>

            <div className="card w-full shadow-none">
                <div className="card-body p-4" data-accordion="true">
                    <span className="">Progress</span>

                    {renoProgress &&
                        renoProgress.phases.map((phase, phaseIndex) => {
                            let currentPhase = '';
                            let currentPhaseCompletion = '';
                            if (phaseIndex === 0) {
                                currentPhase = 'pre_reno';
                                currentPhaseCompletion = 'pre_reno_completion';
                            } else if (phaseIndex === 1) {
                                currentPhase = 'reno';
                                currentPhaseCompletion = 'reno_completion';
                            } else if (phaseIndex === 2) {
                                currentPhase = 'post_reno';
                                currentPhaseCompletion = 'post_reno_completion';
                            }
                            return (
                                <div className="flex flex-col gap-5" key={phaseIndex}>
                                    <div className="card accordion-item border rounded-xl w-full" data-accordion-item="true" id={phase.id}>
                                        <button className="accordion-toggle p-4" data-accordion-toggle={"#package_content_" + phase.id}>
                                            <div className="flex flex-col items-start">
                                                <span className="text-sm text-gray-900 font-medium">
                                                    {phase.name}
                                                </span>
                                            </div>
                                            <div className="flex">
                                                <div className="flex mr-24">
                                                    {/* <span className="font-semibold text-gray-600 mr-3">Progress: </span> */}
                                                    {/* <span className="font-semibold">{jobProgress.toFixed(2)}%</span> */}
                                                </div>
                                                <i className="ki-outline ki-up text-gray-600 text-2sm accordion-active:hidden block"></i>
                                                <i className="ki-outline ki-down text-gray-600 text-2sm accordion-active:block hidden"></i>
                                            </div>
                                        </button>
                                        <div className="accordion-content hidden border-t" id={"package_content_" + phase.id}>

                                            <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
                                                <div className="flex flex-col justify-center divide-y divide-slate-200 [&>*]:py-4">
                                                    <div className="w-full max-w-3xl mx-auto">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-semibold block">Phase Completion: {(renoProgress[currentPhaseCompletion] * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                                                <Link
                                                                    to={`/owner/reno/progress/${renoProgressId}/phase/${currentPhase}/attachments`}
                                                                    className="btn btn-info btn-xs"
                                                                >
                                                                    View Photos
                                                                </Link>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                                <div
                                                                    className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300"
                                                                    style={{
                                                                        width: `${renoProgress[currentPhaseCompletion] * 100}%`,
                                                                        height: '8px'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-full max-w-3xl mx-auto">
                                                        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-[8.75rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-300">
                                                            {/* <div className="-my-6"> */}
                                                            {phase.jobs
                                                                .sort((a, b) => b.priority - a.priority) // Sort jobs by priority (higher number comes first)
                                                                .map((job, jobIndex) => {
                                                                    const jobProgress = calculateJobProgress(job);

                                                                    return (
                                                                        <div className="relative" key={jobIndex}>
                                                                            <div className="md:flex items-center md:space-x-4">
                                                                                <div className="flex items-center space-x-4 md:space-x-2 md:space-x-reverse">
                                                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow md:order-1">
                                                                                        <svg className="fill-emerald-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                                                                                            <path d="M8 0a8 8 0 1 0 8 8 8.009 8.009 0 0 0-8-8Zm0 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
                                                                                        </svg>
                                                                                    </div>
                                                                                    <div className="ml-14 md:ml-0">
                                                                                        <span className="text-indigo-500 text-base font-bold mr-2">{job.name}</span>
                                                                                        {/* <span className="text-slate-500 ">opened the request</span> */}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="ml-14 md:ml-44 mb-4">
                                                                                <span className="text-sm font-semibold block mb-2">Progress: {jobProgress.toFixed(2)}%</span>
                                                                                <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                                                    <div
                                                                                        className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                                                        style={{
                                                                                            width: `${jobProgress}%`,
                                                                                            height: '8px'
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div className="ml-14 md:ml-44 mb-4 border border-gray-300 rounded-md shadow p-3">
                                                                                {job.tasks.map((task, taskIndex) => (
                                                                                    <div className="flex flex-col mb-8" key={taskIndex}>
                                                                                        <div className="flex mb-1 items-center gap-2">
                                                                                            <span className="text-sm font-bold">{task.name}</span>
                                                                                        </div>
                                                                                        <div className="flex mb-2 items-center gap-2">
                                                                                            <span className="text-xs text-gray-500 font-semibold">Lastest Date: </span>
                                                                                            <span className="text-xs text-gray-500 font-semibold">12 Dec 2024</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <button className="btn btn-primary btn-xs">Status</button>
                                                                                            <button className="btn btn-success btn-xs">Add/View</button>
                                                                                            <button className="btn btn-info btn-xs">Comments</button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </>
    );
}

export default RenoProgressManagement;