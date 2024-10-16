// src/context/UserContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { user as fetchUser } from '../services/api'; // Adjust the path if necessary
import { User } from '../types'; // Adjust the path if necessary

interface UserContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await fetchUser();
                setUser(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, error }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
