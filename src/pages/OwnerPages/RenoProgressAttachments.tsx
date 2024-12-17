import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Slide, toast } from "react-toastify";
import { retrieveRenoProgressPhaseAttachments } from "../../services/ownerApi";

function RenoProgressAttachments() {
    const navigate = useNavigate();
    const { id, phase } = useParams<{ id: string, phase: string }>();
    const renoProgressId = id ? parseInt(id, 10) : null;

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
        navigate('/owner/reno/progress/' + renoProgressId); // Go back to the previous route
    };
    
    useEffect(() => {
        document.title = "Reno Progress Attachments | RenoXpert";
        
    }, []);

    // Handle Retrieve selected reno progress and phase Attachments
    const test = async () => {
        try {
            const response = await retrieveRenoProgressPhaseAttachments(renoProgressId, phase);

            console.log(response);

            if (response?.success) {
                console.log('Attachments:', response); // Log the attachments data to the console
            }
            
        } catch (error) {
            console.error('Error retrieving attachments:', error);
        }
    }
    
    return (
        <>
            <button
                className="btn-btn-primary"
                onClick={test}
            >
                Test
            </button>
        </>
    );
}

export default RenoProgressAttachments;