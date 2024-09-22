import React from 'react';
import { logout } from '../../services/auth'; // Adjust the import path as needed

const LogoutButton: React.FC = () => {
    const handleLogout = async () => {
        try {
            await logout();
            // Redirect to login page or home page
            window.location.href = '/login'; // Adjust the redirection path as needed
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
