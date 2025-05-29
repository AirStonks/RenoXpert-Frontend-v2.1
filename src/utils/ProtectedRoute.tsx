// src/utils/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return <Navigate to={LOCAL_PATH_PREFIX + "login"} />;
    }
    
    return children;
};

export default ProtectedRoute;
