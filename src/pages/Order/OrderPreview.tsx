// src\pages\Order\OrderPreview.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import Loading from "../../components/Loading";

function OrderPreview() {
    const navigate = useNavigate();
    const { user, loading, error } = useUser();

    if (loading) return <Loading />;
    if (error) return <div>Error: {error}</div>;
    if (!user) {
        navigate('/login');
    }
    
    return (
        <span>Test</span>
    )
}

export default OrderPreview;