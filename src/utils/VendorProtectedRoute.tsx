import React from 'react';
import { Navigate } from 'react-router-dom';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/ven/' : '/';

const VendorProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const token = localStorage.getItem('v_token');
    
    if (!token) {
        return <Navigate to={LOCAL_PATH_PREFIX + "login"} />;
    }
    
    return children;
};

export default VendorProtectedRoute;
