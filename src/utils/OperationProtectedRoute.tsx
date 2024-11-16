import React from 'react';
import { Navigate } from 'react-router-dom';

const OperationProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const token = localStorage.getItem('p_token');
    
    if (!token) {
        return <Navigate to="/op/login" />;
    }
    
    return children;
};

export default OperationProtectedRoute;
