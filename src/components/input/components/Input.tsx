import React from 'react';

interface InputProps {
    className?: string;
    children?: React.ReactNode;
    label?: string;
    list?: string;
    dataList?: string[];
    pattern?: string;
    hidden?: boolean;
    required?: boolean;
    [key: string]: unknown;
}

export function Input({
    className = '',
    children,
    label,
    list,
    dataList,
    pattern,
    hidden,
    required,
    ...inputProps
}: InputProps) {
    return (
        <div hidden={hidden} className="mb-4">
            {label && (
                <label className="block mb-2 font-semibold text-gray-200">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                className={`bg-gray-800 text-gray-100 p-3 rounded-lg border border-gray-600 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 ${className}`}
                {...inputProps}
                pattern={pattern}
                list={list}
                required={required}
            >
                {children}
            </input>
            {list && dataList && (
                <datalist id={list}>
                    {dataList.map((item) => (
                        <option key={item} value={item} />
                    ))}
                </datalist>
            )}
        </div>
    );
}
