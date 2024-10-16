import React from 'react';
import { Navigate } from 'react-router-dom';

const OwnerProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const token = localStorage.getItem('o_token');
    
    if (!token) {
        return <Navigate to="/owner/login" />;
    }
    
    return children;
};

export default OwnerProtectedRoute;
