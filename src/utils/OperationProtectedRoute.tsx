import React from 'react';
import { Navigate } from 'react-router-dom';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/op/' : '/';

const OperationProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const token = localStorage.getItem('p_token');
    
    if (!token) {
        return <Navigate to={LOCAL_PATH_PREFIX + "login"} />;
    }
    
    return children;
};

export default OperationProtectedRoute;
