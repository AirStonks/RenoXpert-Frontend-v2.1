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

    // const calculateJobProgress = (job: PhaseJob) => {
    //     // Define the status weightages
    //     const statusWeights = {
    //         not_started: 0,
    //         started: 0.25,
    //         in_progress: 0.75,
    //         completed: 1,
    //     };

    //     // Calculate the weighted sum of task statuses using task_weightage
    //     const weightedSum = job.tasks.reduce((sum, task) => {
    //         const statusWeight = statusWeights[task.status] || 0;
    //         const taskWeight = task.task_weightage || 1; // Use task_weightage or default to 1 if not provided
    //         return sum + (taskWeight * statusWeight);
    //     }, 0);

    //     // Calculate total task weight (sum of all task weights)
    //     const totalWeight = job.tasks.reduce((sum, task) => sum + (task.task_weightage || 1), 0); // Default to 1 if task_weightage is not present


    //     console.log(totalWeight);

    //     // Return the progress percentage (multiply by 100 to get percentage)
    //     return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    // };

    return (
        <>
            {/* Loading Overlay */}
            {isLoading || loading && <Loading />}

            <div className="flex w-full px-2">
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
                    <div className="card-body flex flex-col gap-4">
                        {renoProgressDetail &&
                            <>
                                <div className="flex flex-col">
                                    <span className="text-md font-semibold block mb-2">Overall Progress: {(((renoProgressDetail.pre_reno_completion * 0.2) + (renoProgressDetail.reno_completion * 0.7) + (renoProgressDetail.post_reno_completion * 0.1)) * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                    <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                            style={{
                                                width: `${(((renoProgressDetail.pre_reno_completion * 0.2) + (renoProgressDetail.reno_completion * 0.7) + (renoProgressDetail.post_reno_completion * 0.1)) * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
                                                height: '8px'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex">
                                    <div className="flex flex-col gap-1 flex-1">
                                        <span className="text-md font-semibold">Property:</span>
                                        <span className="text-md">{renoProgressDetail.property.name}</span>
                                    </div>

                                    <div className="flex flex-col gap-1 flex-1">
                                        <span className="text-md font-semibold">Unit:</span>
                                        <span className="text-md">{renoProgressDetail.property.block}-{renoProgressDetail.property.floor}-{renoProgressDetail.property.unit_no}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="font-semibold text-sm">Contractual Date:</span>
                                    <div className="flex gap-4">
                                        <span className="badge">
                                            {renoProgressDetail.contractual_start_date
                                                ? new Date(renoProgressDetail.contractual_start_date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })
                                                : '-'}
                                        </span>
                                        <span>to</span>
                                        <span className="badge">
                                            {renoProgressDetail.contractual_end_date
                                                ? new Date(renoProgressDetail.contractual_end_date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })
                                                : '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="font-semibold text-sm">Contractor Date:</span>
                                    <div className="flex gap-4">
                                        <span className="badge">
                                            {renoProgressDetail.contractor_start_date
                                                ? new Date(renoProgressDetail.contractor_start_date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })
                                                : '-'}
                                        </span>
                                        <span>to</span>
                                        <span className="badge">
                                            {renoProgressDetail.contractor_end_date
                                                ? new Date(renoProgressDetail.contractor_end_date).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })
                                                : '-'}
                                        </span>
                                    </div>
                                </div>
                            </>
                        }
                    </div>
                </div>
            </div>

            <div className="flex w-full px-2">
                <div className="card w-full">
                    <div className="card-header flex">
                        <span className="text-lg font-semibold">Acceptance Form</span>
                    </div>
                    <div className="card-body flex flex-col">
                        <span className="text-sm text-gray-600 mb-4">This is the final step of overall works. Click the below button to fill in and submit the Reno Acceptance Form.</span>
                        <Link
                            to={'/reno/accept-form/' + renoProgressId}
                            className="btn btn-info btn-sm justify-center"
                        >
                            Proceed to Reno Acceptance
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 w-full px-2" data-accordion="true">

                <span className="text-lg font-semibold px-1">Progress</span>

                {renoProgressDetail &&
                    renoProgressDetail.phases.map((phase, phaseIndex) => {
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
                                                            <span className="text-sm font-semibold block">Phase Completion: {(renoProgressDetail[currentPhaseCompletion] * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
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
                                                                    width: `${renoProgressDetail[currentPhaseCompletion] * 100}%`,
                                                                    height: '8px'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-full max-w-3xl mx-auto">
                                                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-300">
                                                        {/* <div className="-my-6"> */}
                                                        {phase.jobs
                                                            .sort((a, b) => b.priority - a.priority) // Sort jobs by priority (higher number comes first)
                                                            .map((job, jobIndex) => {
                                                                // const jobProgress = calculateJobProgress(job);

                                                                // return (
                                                                //     <div className="card-group flex flex-col" key={jobIndex}>
                                                                //         <div className="flex justify-between">
                                                                //             <span className="text-md font-semibold">{job.name}</span>
                                                                //             <Link
                                                                //                 to={`/owner/reno/progress/${renoProgressId}/job/${job.id}/attachments`}
                                                                //                 className="btn btn-info btn-sm"
                                                                //             >
                                                                //                 View
                                                                //             </Link>
                                                                //         </div>
                                                                //         <span>Progress: {jobProgress.toFixed(2)}%</span>
                                                                //         <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                                //             <div
                                                                //                 className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                                //                 style={{
                                                                //                     width: `${jobProgress}%`,
                                                                //                     height: '8px'
                                                                //                 }}
                                                                //             />
                                                                //         </div>
                                                                //         <div className="flex flex-col">
                                                                //             {job.tasks.map((task, taskIndex) => (
                                                                //                 <div className="flex flex-col mb-4" key={taskIndex}>
                                                                //                     <div className="flex">
                                                                //                         <span className="text-sm">{task.name}</span>
                                                                //                     </div>
                                                                //                     <div className="flex">
                                                                //                         <span className="text-sm">Status: <span className="text-sm font-semibold">{task.status}</span></span>

                                                                //                     </div>
                                                                //                 </div>
                                                                //             ))}
                                                                //         </div>
                                                                //     </div>
                                                                // )

                                                                // return (
                                                                //     <div className="relative pl-8 sm:pl-32 py-6 group">
                                                                //         <div className="flex justify-between">
                                                                //             <div className="font-caveat font-medium text-md text-indigo-500 mb-1 sm:mb-0">
                                                                //                 {job.name}
                                                                //             </div>
                                                                //             <Link
                                                                //                 to={`/owner/reno/progress/${renoProgressId}/job/${job.id}/attachments`}
                                                                //                 className="btn btn-info btn-sm"
                                                                //             >
                                                                //                 View
                                                                //             </Link>
                                                                //         </div>
                                                                //         <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-0 before:h-full before:px-px before:bg-slate-300 sm:before:ml-[6.5rem] before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 sm:after:left-0 after:w-2 after:h-2 after:bg-indigo-600 after:border-4 after:box-content after:border-slate-50 after:rounded-full sm:after:ml-[6.5rem] after:-translate-x-1/2 after:translate-y-1.5">
                                                                //             <time className="sm:absolute left-0 translate-y-0.5 inline-flex items-center justify-center text-xs font-semibold uppercase w-20 h-6 mb-3 sm:mb-0 text-emerald-600 bg-emerald-100 rounded-full">
                                                                //                 14 Dec 2024
                                                                //             </time>
                                                                //             {/* <div className="text-md font-bold text-slate-900">
                                                                //                 Acme was founded in Milan, Italy
                                                                //             </div> */}
                                                                //             <span className="text-md font-semibold">Progress: {jobProgress.toFixed(2)}%</span>
                                                                //             <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                                //                 <div
                                                                //                     className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                                //                     style={{
                                                                //                         width: `${jobProgress}%`,
                                                                //                         height: '8px'
                                                                //                     }}
                                                                //                 />
                                                                //             </div>
                                                                //         </div>
                                                                //         {/* <div className="text-slate-500">
                                                                //             Pretium lectus quam id leo. Urna et pharetra pharetra massa massa. Adipiscing enim eu neque aliquam vestibulum morbi blandit cursus risus.
                                                                //         </div> */}
                                                                //     </div>
                                                                // )

                                                                return (
                                                                    <div className="relative" key={jobIndex}>
                                                                        <div className="md:flex items-center space-x-4">
                                                                            <div className="flex items-center space-x-4">
                                                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow md:order-1">
                                                                                    <svg className="fill-emerald-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                                                                                        <path d="M8 0a8 8 0 1 0 8 8 8.009 8.009 0 0 0-8-8Zm0 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
                                                                                    </svg>
                                                                                </div>
                                                                                <div className="ml-14">
                                                                                    <span className="text-indigo-500 text-base font-bold mr-2">{job.name}</span>
                                                                                    {/* <span className="text-slate-500 ">opened the request</span> */}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="ml-14 mb-4">
                                                                            <span className="text-sm font-semibold block mb-2">Progress: {job.completion.toFixed(2)}%</span>
                                                                            <div className="w-full bg-gray-200 rounded-full h-[8px] mb-1 relative overflow-hidden">
                                                                                <div
                                                                                    className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                                                                                    style={{
                                                                                        width: `${job.completion}%`,
                                                                                        height: '8px'
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="ml-14 mb-4">
                                                                            {job.tasks.map((task, taskIndex) => (
                                                                                <div className="flex flex-col mb-4" key={taskIndex}>
                                                                                    <div className="flex mb-1 items-center gap-2">
                                                                                        {task.owner_comment != null &&
                                                                                            <div className="flex">
                                                                                                <i
                                                                                                    className="ki-outline ki-information-1 text-danger text-lg font-semibold"
                                                                                                    data-tooltip={`#comment_popover_${taskIndex}`}
                                                                                                    data-tooltip-trigger="click"
                                                                                                ></i>
                                                                                                <div className="tooltip max-w-72" id={`comment_popover_${taskIndex}`}>
                                                                                                    {task.owner_comment}
                                                                                                </div>
                                                                                            </div>
                                                                                        }
                                                                                        <span className="text-sm font-bold">{task.name}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-sm">Status: </span>
                                                                                        <span className={`badge badge-pill badge-outline gap-1 items-center ${task.status === 'started' ? 'badge-success' : ''} ${task.status === 'in_progress' ? 'badge-primary' : ''} ${task.status === 'completed' ? 'badge-success' : ''}`}>
                                                                                            <span className={`badge badge-dot size-1.5 ${task.status === 'not_started' ? 'badge-dark' : ''} ${task.status === 'started' ? 'badge-success' : ''} ${task.status === 'in_progress' ? 'badge-primary' : ''} ${task.status === 'completed' ? 'badge-success' : ''}`}
                                                                                            ></span>
                                                                                            {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace(/_/g, ' ')}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        {/* <div className="bg-white p-4 rounded border border-slate-200 text-slate-500 shadow ml-14 md:ml-44">
                                                                                Various versions have evolved over the years, sometimes by accident, sometimes on purpose injected humour and the like.
                                                                            </div> */}
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
        </>
    )
}

export default RenoProgressDetail;