import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "./components/Header";
import { RenoProgress } from "../../types";
import KTComponents, { KTAccordion } from "../../metronic/core";
import { fetchRenoProgressDetail } from "../../services/operationApi";
import Loading from "../../components/Loading";
import useFetchOperationRenoProgress from "../../hook/useFetchOperationRenoProgress";
import RPMV2 from "./components/RPMV2";
import RPMV3 from "./components/RPMV3";

const headerData = { title: 'Reno Progress', backUrl: '/op/home' }

function RenoProgressManagement() {
    const { id } = useParams<{ id: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;
    const { renoProgressDetail, loading, error } = useFetchOperationRenoProgress(renoProgressId);

    const [renoProgress, setRenoProgress] = useState<RenoProgress>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.title = "Reno Progress | RenoXpert";

        const initFunctions = async () => {
            if (renoProgressDetail) {
                setRenoProgress(renoProgressDetail); // Assign renoProgressDetail to renoProgress
            }
        }

        initFunctions();

    }, [renoProgressDetail]);


    if (loading) return <Loading />;
    if (error) return <div>Error: {error}</div>;
    if (!renoProgress) return <div>An unexpected error occured</div>;

    return (
        <>
            <Header {...headerData} />

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
                    <div className="flex p-12 justify-center h-screen">
                        <div className="text-xl font-bold text-gray-800">
                            Reno Progress V3 still in development. Comming Soon
                        </div>
                    </div>

                    


                    {/* <RPMV3
                        renoProgress={renoProgress}
                        setRenoProgress={setRenoProgress}
                    /> */}
                </>
            )}
        </>
    );
}

export default RenoProgressManagement;