// src/components/Dropdown.tsx

import React from 'react';
import { Contact } from '../../../types';

interface DropdownProps {
    contacts: Contact[] | null;
    loading: boolean;
    error: string | null;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    value: string; // The currently selected value
}

const Dropdown: React.FC<DropdownProps> = ({ contacts, loading, error, onChange, value }) => {
    return (
        <div>
            <select
                className="select mb-2"
                name="contacts"
                value={value} // Controlled value
                onChange={onChange} // Controlled onChange handler
            >
                <option value="" disabled>Select Contact</option>
                {loading && <option disabled>Loading contacts...</option>}
                {error && <option disabled>{error}</option>}
                {contacts && contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>{contact.name}</option> // Adjust based on your Contact type
                ))}
            </select>
        </div>
    );
};

export default Dropdown;
