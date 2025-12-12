import React from 'react';

interface DatetimeInputProps {
    className?: string;
    children?: React.ReactNode;
    label?: string;
    hidden?: boolean;
    required?: boolean;
    [key: string]: unknown;
}

export function DatetimeInput({
    className = '',
    children,
    label,
    hidden,
    required,
    ...inputProps
}: DatetimeInputProps) {
    return (
        <div hidden={hidden} className="mb-4">
            {label && (
                <label className="block mb-2 font-semibold text-gray-200">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="datetime-local"
                className={`bg-gray-800 text-gray-100 p-3 rounded-lg border border-gray-600 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
                required={required}
                {...inputProps}
            >
                {children}
            </input>
        </div>
    );
}
