import React from 'react';
import { logout } from '../../services/auth'; // Adjust the import path as needed
import { useNavigate } from 'react-router-dom';

const LOCAL_PATH_PREFIX = window.location.hostname === 'localhost' ? '/staff/' : '/';

const LogoutButton: React.FC = () => {
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await logout();
            navigate(LOCAL_PATH_PREFIX + 'login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Optionally show an error message to the user
        }
    };

    return (
        <a
            className="btn btn-sm btn-light justify-center"
            onClick={handleLogout}
        >
            Log out
        </a>
    );
};

export default LogoutButton;
