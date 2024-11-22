import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OwnerProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('o_token');

    useEffect(() => {
        if (!token) {
            // Redirect to login with the current path stored in state
            navigate('/owner/login', {
                state: { from: location.pathname + location.search }
            });
        }
    }, [token, navigate, location]);

    // If there's no token, don't render anything while redirecting
    if (!token) {
        return null;
    }

    return children;

};

export default OwnerProtectedRoute;
