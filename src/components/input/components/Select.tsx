import React from 'react';

interface SelectProps {
    label?: string;
    options: string[];
    value?: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    className?: string;
    required?: boolean;
    [key: string]: unknown;
}

export function Select({
    label,
    options,
    value,
    onChange,
    className = '',
    required,
    ...selectProps
}: SelectProps) {
    return (
        <div className="mb-4">
            {label && (
                <label className="block mb-2 font-semibold text-gray-200">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <select
                value={value}
                onChange={onChange}
                className={`bg-gray-800 text-gray-100 p-3 rounded-lg border border-gray-600 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
                required={required}
                {...selectProps}
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    );
}
