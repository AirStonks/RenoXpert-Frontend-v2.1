import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Slide, toast } from "react-toastify";
import { retrieveJobAttachments, retrieveRenoProgressPhaseAttachments } from "../../services/ownerApi";
import Loading from "../../components/Loading";

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/owner/' : '/';

const AWS_S3_URL =
    import.meta.env.VITE_APP_ENV === "production"
        ? import.meta.env.VITE_AWS_S3_URL
        : import.meta.env.VITE_APP_ENV === "staging" || import.meta.env.VITE_APP_ENV === "local"
            ? import.meta.env.VITE_STAGING_AWS_S3_URL
            : null

function RenoProgressPhaseAttachments() {
    const navigate = useNavigate();
    const { id, phase } = useParams<{ id: string, phase: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [attachments, setAttachments] = useState<[]>([]);

    const notify = (type: 'success' | 'error', message: string) => {
        (toast[type] as (message: string, options?: object) => void)(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: localStorage.getItem('theme'),
            transition: Slide,
        });
    };

    const handleBackClick = () => {
        navigate(LOCAL_PATH_PREFIX + 'reno/progress/' + renoProgressId); // Go back to the previous route
    };

    useEffect(() => {
        document.title = "Job Attachments | RenoXpert";

        const fetchJobAttachments = async () => {
            setIsLoading(true);

            try {
                const response = await retrieveRenoProgressPhaseAttachments(renoProgressId, phase);

                if (response?.success) {
                    setAttachments(response.data);
                }

            } catch (error) {
                console.error('Error retrieving attachments:', error);
            }

            setIsLoading(false);
        }

        fetchJobAttachments();

    }, [renoProgressId, phase]);

    return (
        <>
            {isLoading && <Loading />}

            <div className="flex w-full px-2">
                <div className="card w-full">
                    <div className="card-header flex justify-between">
                        <div className="flex gap-4 justify-center">
                            <button
                                className="ki-solid ki-arrow-left items-center"
                                onClick={handleBackClick}
                            >
                            </button>
                            <span className="text-lg font-semibold">Phase Attachments</span>
                        </div>
                    </div>
                    <div className="card-body flex flex-wrap gap-4">
                        {!isLoading && attachments.length === 0 && <span className="text-sm font-medium text-gray-900">No attachments found</span>}
                        {attachments.map((attachment: any, index: number) => (
                            <div className="flex gap-4 items-center relative" key={index}>
                                <a
                                    className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px relative"
                                    href={AWS_S3_URL + (attachment.file_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={AWS_S3_URL + (attachment.file_url)}
                                        alt={attachment.original_name}
                                        className="w-32 h-32 object-cover border border-gray-300 rounded"
                                    />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default RenoProgressPhaseAttachments;