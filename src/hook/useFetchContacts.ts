// src/hooks/useFetchContacts.ts

import { useState } from 'react';
import { fetchContacts } from '../services/api';
import { Contact } from '../types';

const useFetchContacts = () => {
    const [contacts, setContacts] = useState<Contact[]>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchContactsData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchContacts();
            setContacts(data.data);
        } catch {
            setError('Failed to fetch contacts');
        } finally {
            setLoading(false);
        }
    };

    return { contacts, loading, error, fetchContactsData };
};

export default useFetchContacts;
