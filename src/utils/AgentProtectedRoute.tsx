import React from 'react';
import { Navigate } from 'react-router-dom';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/agent/' : '/';

const AgentProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const token = localStorage.getItem('a_token');
    if (!token) {
        return <Navigate to={LOCAL_PATH_PREFIX + 'login'} />;
    }
    return children;
};

export default AgentProtectedRoute;
