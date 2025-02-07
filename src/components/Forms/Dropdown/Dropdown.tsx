// src/components/Dropdown/Dropdown.tsx

import React from 'react';

interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownProps {
    options: DropdownOption[];
    name?: string; // Optional, if you want to pass a custom name
    value: string | number; // Add value prop for controlled component
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; // Add onChange handler
    error?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, name = "select", value, onChange, error }) => {
    return (
        <>
            <select
                className="select mb-2"
                name={name}
                value={value} // Add value to make it controlled
                onChange={onChange} // Add onChange handler
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {error && <label className="text-red-500 text-xs">{error}</label>}
        </>
    );
}

export default Dropdown;
