import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Loading from "../../components/Loading";
import useFetchOwnerRenoProgress from "../../hook/useFetchOwnerRenoProgress";
import { Link } from "react-router-dom";
import { KTAccordion } from '../../metronic/core/components/accordion/accordion';
import { PhaseJob } from "../../types";

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

function RenoProgressDetail() {
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;

    const { renoProgressDetail, loading, error } = useFetchOwnerRenoProgress(renoProgressId);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.title = "Reno Progress | RenoXpert";
        KTAccordion.init();
    });

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
            {/* Loading Overlay */}
            {isLoading || loading && <Loading />}

            <div className="card w-full">
                <div className="card-header flex justify-between">
                    <div className="flex gap-4 justify-center">
                        <Link
                            to={'/owner/home'}
                            className="ki-solid ki-arrow-left items-center">
                        </Link>
                        <span className="text-lg font-semibold">Reno Progress</span>
                    </div>
                </div>
                <div className="card-body flex flex-col gap-4" data-accordion="true">
                    {renoProgressDetail &&
                        renoProgressDetail.phases.map((phase, phaseIndex) => (
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
                                        <div className="card-body">
                                            {phase.jobs
                                                .sort((a, b) => b.priority - a.priority) // Sort jobs by priority (higher number comes first)
                                                .map((job, jobIndex) => {
                                                    const jobProgress = calculateJobProgress(job);

                                                    return (
                                                        <div className="flex flex-col" key={jobIndex}>
                                                            <div className="flex">
                                                                <span className="text-md font-semibold">{job.name}</span>
                                                            </div>
                                                            <span>Progress: {jobProgress.toFixed(2)}%</span>
                                                            <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                                <div
                                                                    className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                                    style={{
                                                                        width: `${jobProgress}%`,
                                                                        height: '8px'
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                {job.tasks.map((task, taskIndex) => (
                                                                    <div className="flex flex-col mb-4" key={taskIndex}>
                                                                        <div className="flex">
                                                                            <span className="text-sm">{task.name}</span>
                                                                        </div>
                                                                        <div className="flex">
                                                                            <span className="text-sm">Status: <span className="text-sm font-semibold">{task.status}</span></span>

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
                        ))
                    }
                </div>
            </div>
        </>
    )
}

export default RenoProgressDetail;