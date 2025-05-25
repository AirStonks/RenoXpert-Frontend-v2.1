import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Loading from "../../components/Loading";
import useFetchOwnerRenoProgress from "../../hook/useFetchOwnerRenoProgress";
import { Link } from "react-router-dom";
import { KTAccordion } from '../../metronic/core/components/accordion/accordion';
import { PhaseJob, RenoProgress } from "../../types";
import RPMV2 from "./components/RPMV2";
import RPMV3 from "./components/RPMV3";

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

    const [renoProgress, setRenoProgress] = useState<RenoProgress>(null);

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.title = "Reno Progress | RenoXpert";

        const initFunctions = async () => {
            if (renoProgressDetail) {
                setRenoProgress(renoProgressDetail); // Assign renoProgressDetail to renoProgress
                KTAccordion.init();
            }
        }

        initFunctions();
    }, [renoProgressDetail]);

    // const calculateJobProgress = (job: PhaseJob) => {
    //     // Define the status weightages
    //     const statusWeights = {
    //         not_started: 0,
    //         started: 0.25,
    //         in_progress: 0.75,
    //         completed: 1,
    //         not_available: 1,
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

    if (loading) return <Loading />;
    if (error) return <div>Error: {error}</div>;
    if (!renoProgress) return <div>An unexpected error occured</div>;

    return (
        <>
            {/* Loading Overlay */}
            {isLoading || loading && <Loading />}

            {renoProgress.rpm_version === 1 || renoProgress.rpm_version === 2 ? (
                <>
                    <RPMV2
                        renoProgress={renoProgress}
                        setRenoProgress={setRenoProgress}
                    />
                </>
            ) : (
                <>
                    {/* Section still in development, display comming soon */}
                    {/* <div className="flex p-12 justify-center h-screen">
                        <div className="text-xl font-bold text-gray-800">
                            Reno Progress V3 still in development. Comming Soon
                        </div>
                    </div> */}




                    <RPMV3
                        renoProgress={renoProgress}
                        setRenoProgress={setRenoProgress}
                    />
                </>
            )}
        </>
    )
}

export default RenoProgressDetail;