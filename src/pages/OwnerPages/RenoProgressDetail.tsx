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