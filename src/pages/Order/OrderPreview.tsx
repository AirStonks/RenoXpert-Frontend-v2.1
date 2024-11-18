// src\pages\Order\OrderPreview.tsx

import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";
import { useEffect } from "react";

function OrderPreview() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Order Preview | RenoXpert";
    }, []);

    // if (loading) return <Loading />;
    // if (error) return <div>Error: {error}</div>;
    // if (!user) {
    //     navigate('/login');
    // }
    
    return (
        <span>Test</span>
    )
}

export default OrderPreview;