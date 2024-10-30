import React from 'react';

interface InputFieldGroupProps {
    fieldTitle: string;
    description?: string;
    placeholder?: string;
    type?: string;
    name: string;
    value?: string | number;  // Value could be string or undefined
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;  // Add error prop to display validation errors
}

const InputFieldGroup: React.FC<InputFieldGroupProps> = ({
    fieldTitle,
    description = null,
    placeholder = "Text...",
    type = "text",
    name,
    value = '',  // Default to empty string to avoid null issues
    onChange,
    error
}) => {
    return (
        <div className="flex flex-col mb-8">
            <label className='mb-2 text-sm font-medium text-gray-900'>
                {fieldTitle}
            </label>

            {description
                &&
                <span className="text-xs text-gray-600 tracking-wide mb-2">
                    {description}
                </span>
            }


            <input
                className={`input mb-2 ${error ? 'border-red-500' : ''}`}
                placeholder={placeholder}
                type={type}
                name={name}
                value={value || ''}  // Ensure value is always a string
                onChange={onChange}
            />

            {error && <label className="text-red-500 text-xs">{error}</label>}
        </div>
    );
};

export default InputFieldGroup;
