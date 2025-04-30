import React from 'react';

interface InputFieldGroupProps {
    fieldTitle: string;
    description?: string;
    placeholder?: string;
    type?: string;
    name: string;
    value?: string | number;  // Value can be a string, number, or undefined
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;  // Add error prop to display validation errors
}

const InputFieldGroup: React.FC<InputFieldGroupProps> = ({
    fieldTitle,
    description = null,
    placeholder = "Text...",
    type = "text",
    name,
    value = '',  // Default to empty string if no value provided
    onChange,
    error
}) => {
    // Handle input change for type number
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;

        if (type === 'number') {
            // If the value is empty, allow it to be an empty string
            if (newValue === '') {
                newValue = '';
            } else {
                // Parse value as a number and check for NaN
                const parsedValue = parseFloat(newValue);
                // If parsedValue is NaN, set to empty string, else convert to string
                newValue = isNaN(parsedValue) ? '' : parsedValue.toString();
            }
        }

        // Create a new event object with the updated value
        const newEvent = e;

        // Call the passed onChange handler with the updated event
        onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
    };

    // Ensure the value is either a string or number (for type="number")
    const displayValue = type === 'number' && value === 0 ? '0' : value || '';

    return (
        <div className="flex flex-col mb-8">
            <label className="mb-2 text-sm font-medium text-gray-900">
                {fieldTitle}
            </label>

            {description && (
                <span className="text-xs text-gray-600 tracking-wide mb-2">
                    {description}
                </span>
            )}

            <input
                className={`input mb-2 ${error ? 'border-red-500' : ''}`}
                placeholder={placeholder}
                type={type}
                name={name}
                value={displayValue}  // Display value as a string, but handle 0 properly
                onChange={handleChange}
            />

            {error && <label className="text-red-500 text-xs">{error}</label>}
        </div>
    );
};

export default InputFieldGroup;
