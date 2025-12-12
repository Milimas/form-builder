import React from 'react';

interface CheckboxProps {
    label?: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    required?: boolean;
    [key: string]: unknown;
}

export function Checkbox({
    label,
    checked,
    onChange,
    className = '',
    required,
    ...checkboxProps
}: CheckboxProps) {
    return (
        <div className="mb-4 flex items-center">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className={`w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 ${className}`}
                required={required}
                {...checkboxProps}
            />
            {label && (
                <label className="ml-2 font-semibold text-gray-200">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
        </div>
    );
}
