/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import v, { SchemaType } from 'validator';
import { HtmlObjectType } from '../../../../../validator/lib/types';

// Input component
function Input({ className = '', children, label, list, dataList, pattern, hidden, ...inputProps }: {
    className?: string;
    children?: React.ReactNode;
    label?: string;
    list?: string;
    dataList?: string[];
    pattern?: string;
    hidden?: boolean;
    [key: string]: unknown;
}) {
    return (
        <div hidden={hidden} className="mb-4">
            {label && <label className="block mb-2 font-semibold text-gray-700">{label}</label>}
            <input
                className={`bg-white text-gray-900 p-3 rounded-lg border border-gray-300 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
                {...inputProps}
                pattern={pattern}
                list={list}
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

// Select component
function Select({ label, options, defaultValue, onChange, className = '' }: {
    label?: string;
    options: string[];
    defaultValue?: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    className?: string;
}) {
    return (
        <div className="mb-4">
            {label && <label className="block mb-2 font-semibold text-gray-700">{label}</label>}
            <select
                defaultValue={defaultValue}
                onChange={onChange}
                className={`bg-white text-gray-900 p-3 rounded-lg border border-gray-300 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
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

// Checkbox component
function Checkbox({ label, checked, onChange, className = '' }: {
    label?: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
}) {
    return (
        <div className="mb-4 flex items-center">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className={`w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 ${className}`}
            />
            {label && <label className="ml-2 font-semibold text-gray-700">{label}</label>}
        </div>
    );
}

function DatetimeInput({ className = '', children, label, hidden, ...inputProps }: {
    className?: string;
    children?: React.ReactNode;
    label?: string;
    hidden?: boolean;
    [key: string]: unknown;
}) {
    return (
        <div hidden={hidden} className="mb-4">
            {label && <label className="block mb-2 font-semibold text-gray-700">{label}</label>}
            <input
                type="datetime-local"
                className={`bg-white text-gray-900 p-3 rounded-lg border border-gray-300 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
                {...inputProps}
            >
                {children}
            </input>
        </div>
    );
}

function evaluateDependsOn(dependsOn: { field: string; condition: string }[], formValues: Record<string, unknown>): boolean {
    if (!dependsOn || dependsOn.length === 0) return true;

    const toRegex = (condition: string): RegExp | null => {
        // If condition is wrapped like /.../flags, extract it
        const regexLiteralMatch = condition.match(/^\/(.*)\/(\w*)$/);
        if (regexLiteralMatch) {
            try {
                return new RegExp(regexLiteralMatch[1], regexLiteralMatch[2]);
            } catch {
                return null;
            }
        }
        // Otherwise treat the string as pattern without slashes
        try {
            return new RegExp(condition);
        } catch {
            return null;
        }
    };

    return dependsOn.every(({ field, condition }) => {
        const fieldValue = getNestedValue(formValues, field);

        const regex = toRegex(condition);
        if (regex) {
            return regex.test(String(fieldValue ?? ""));
        }

        return false;
    });
}

// Helper to get nested values
function getNestedValue(obj: any, path: string): unknown {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// Helper to set nested values
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let current: any = obj;
    let parent: any = null;
    let parentKey: string | number | null = null;

    for (let i = 0; i < parts.length; i++) {
        const rawKey = parts[i];
        const isIndex = /^\d+$/.test(rawKey);
        const key: string | number = isIndex ? Number(rawKey) : rawKey;
        const isLast = i === parts.length - 1;
        const nextRawKey = parts[i + 1];
        const nextIsIndex = nextRawKey !== undefined && /^\d+$/.test(nextRawKey);

        // Ensure current is an object/array before proceeding
        if ((typeof current !== 'object' || current === null) && parent !== null && parentKey !== null) {
            parent[parentKey as any] = {};
            current = parent[parentKey as any];
        }

        if (isLast) {
            if (isIndex) {
                if (!Array.isArray(current)) {
                    if (parent !== null && parentKey !== null) {
                        parent[parentKey as any] = [];
                        current = parent[parentKey as any];
                    } else {
                        return; // cannot set at root numeric path safely
                    }
                }
                (current as any[])[key as number] = value;
            } else {
                (current as Record<string, unknown>)[key as string] = value;
            }
            return;
        }

        if (isIndex) {
            if (!Array.isArray(current)) {
                if (parent !== null && parentKey !== null) {
                    parent[parentKey as any] = [];
                    current = parent[parentKey as any];
                } else {
                    return; // cannot traverse numeric path at root without array
                }
            }
            if (current[key as number] === undefined || current[key as number] === null || typeof current[key as number] !== 'object') {
                current[key as number] = nextIsIndex ? [] : {};
            }
            parent = current;
            parentKey = key;
            current = current[key as number];
        } else {
            if (current[key as string] === undefined || current[key as string] === null || typeof current[key as string] !== 'object') {
                current[key as string] = nextIsIndex ? [] : {};
            }
            parent = current;
            parentKey = key;
            current = current[key as string];
        }
    }
}

// Field renderer component
function FieldRenderer({ fieldKey, fieldSchema, formValues, updateField, parentPath = '' }: {
    fieldKey: string;
    fieldSchema: any;
    formValues: any;
    updateField: (path: string, value: any) => void;
    parentPath?: string;
}
) {
    const fullPath = parentPath ? `${parentPath}.${fieldKey}` : fieldKey;
    const fieldValue = getNestedValue(formValues, fullPath);

    // Check if field should be visible based on dependsOn
    const isVisible = evaluateDependsOn(fieldSchema['data-depends-on'], formValues);

    // Reset to default value when field becomes invisible
    React.useEffect(() => {
        if (!isVisible && fieldValue !== undefined && fieldValue !== null) {
            const defaultValue = getDefaultValue(fieldSchema);
            updateField(fullPath, defaultValue);
        }
        if (isVisible && (fieldValue === undefined || fieldValue === null)) {
            const defaultValue = getDefaultValue(fieldSchema);
            updateField(fullPath, defaultValue);
        }
    }, [isVisible, fullPath, fieldSchema, fieldValue, updateField]);

    if (!isVisible) {
        return null;
    }

    const handleChange = (value: any) => {
        updateField(fullPath, value);
    };

    // Handle different field types
    switch (fieldSchema.type) {
        case 'text':
        case 'email':
        case 'url':
        case 'password':
            return (
                <Input
                    {...fieldSchema}
                    label={fieldKey}
                    type={fieldSchema.type}
                    defaultValue={fieldValue ?? fieldSchema.defaultValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
                    placeholder={fieldSchema.placeholder}
                    minLength={fieldSchema.minLength}
                    maxLength={fieldSchema.maxLength}
                    pattern={fieldSchema.pattern}
                    list={fieldSchema.list}
                    dataList={fieldSchema.dataList}
                    required={fieldSchema.required}
                />
            );

        case 'number':
            return (
                <Input
                    {...fieldSchema}
                    label={fieldKey}
                    type="number"
                    defaultValue={fieldValue ?? fieldSchema.defaultValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(Number(e.target.value))}
                    min={fieldSchema.min}
                    max={fieldSchema.max}
                    required={fieldSchema.required}
                />
            );

        case 'checkbox':
            return (
                <Checkbox
                    {...fieldSchema}
                    label={fieldKey}
                    checked={fieldValue ?? fieldSchema.defaultValue ?? false}
                    onChange={(e) => handleChange(e.target.checked)}
                />
            );

        case 'select':
            return (
                <Select
                    {...fieldSchema}
                    label={fieldKey}
                    options={fieldSchema.options}
                    defaultValue={fieldValue || fieldSchema.defaultValue || fieldSchema.options[0]}
                    onChange={(e) => handleChange(e.target.value)}
                />
            );

        case 'datetime-local':
            return (
                <DatetimeInput
                    {...fieldSchema}
                    label={fieldKey}
                    defaultValue={fieldValue ?? fieldSchema.defaultValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
                    required={fieldSchema.required}
                />
            );

        case 'object':
            return (
                <fieldset className="mb-4 p-4 border border-gray-300 rounded-lg">
                    <legend className="font-bold text-lg text-gray-800 px-2">{fieldKey}</legend>
                    {Object.entries(fieldSchema.properties).map(([subKey, subSchema]) => (
                        <FieldRenderer
                            {...fieldSchema}
                            key={subKey}
                            fieldKey={subKey}
                            fieldSchema={subSchema}
                            formValues={formValues}
                            updateField={updateField}
                            parentPath={fullPath}
                        />
                    ))}
                </fieldset>
            );

        case 'array':
            {
                const arrayValue = fieldValue as unknown[] || [];
                return (
                    <fieldset className="flex flex-col mb-4 p-4 border border-gray-300 rounded-lg">
                        <label className="block w-full mb-2 font-semibold text-gray-700">{fieldKey}</label>
                        {arrayValue.map((_, index: number) => (
                            <div key={index} className="flex flex-col mb-2">
                                <FieldRenderer
                                    fieldKey={`${index}`}
                                    fieldSchema={fieldSchema.items[0]}
                                    formValues={formValues}
                                    updateField={updateField}
                                    parentPath={fullPath}
                                />
                                <button
                                    onClick={() => {
                                        const newArray = arrayValue.filter((_, i) => i !== index);
                                        handleChange(newArray);
                                    }}
                                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        {(!fieldSchema.maxLength || arrayValue.length < fieldSchema.maxLength) && (
                            <button
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.preventDefault();
                                    const defaultItemValue = getDefaultValue(fieldSchema.items[0]);
                                    handleChange([...arrayValue, defaultItemValue]);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Add Item
                            </button>
                        )}
                    </fieldset>
                );
            }

        default:
            return null;
    }
}

function getDefaultValue(schema: any, formValues: Record<string, unknown> = {}): any {
    const isVisible = evaluateDependsOn(schema['data-depends-on'] || [], formValues);
    if (!isVisible) {
        return undefined;
    }
    if (schema.type === 'object') {
        const obj: Record<string, unknown> = {};
        Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
            obj[key] = getDefaultValue(propSchema, obj);
        });
        return obj;
    } else if (schema.type === 'array') {
        return [];
    } else {
        return schema.defaultValue !== undefined ? schema.defaultValue : null;
    }
}

// Main Form component
export function DynamicForm({ schema }: { schema: SchemaType }) {
    const schemaJson: HtmlObjectType<v.infer<typeof schema>> = schema.toJSON() as HtmlObjectType<v.infer<typeof schema>>;
    const [formValues, setFormValues] = useState(() => {
        // Initialize form with default values'
        const initValues: Record<string, unknown> = getDefaultValue(schemaJson);
        return initValues;
    });

    const [validValues, setValidValues] = useState<"valid" | "invalid" | "unknown">("unknown");

    const updateField = useCallback((path: string, value: unknown) => {
        setFormValues((prev) => {
            console.log('Updating field:', path, 'to value:', value);
            const newValues = { ...prev };
            setNestedValue(newValues, path, value);
            return newValues;
        });

    }, []);

    const validateForm = (): string[] => {
        const errors: string[] = [];


        const validateField = (fieldKey: string, fieldSchema: any, value: any, parentPath = ''): void => {
            const fullPath = parentPath ? `${parentPath}.${fieldKey}` : fieldKey;

            const isVisible = evaluateDependsOn(fieldSchema['data-depends-on'], formValues);
            if (!isVisible) {
                return;
            }

            // Check required
            if (fieldSchema.required && (value === undefined || value === null || value === '')) {
                errors.push(`${fullPath} is required`);
                return;
            }

            // Validate based on type
            if (fieldSchema.type === 'array') {
                if (Array.isArray(value)) {
                    if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
                        errors.push(`${fullPath} must have at least ${fieldSchema.minLength} items`);
                    }
                    if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
                        errors.push(`${fullPath} must have at most ${fieldSchema.maxLength} items`);
                    }
                }
            } else if (fieldSchema.type === 'object') {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    const objectKeys = Object.keys(value);
                    if (fieldSchema.minLength !== undefined && objectKeys.length < fieldSchema.minLength) {
                        errors.push(`${fullPath} must have at least ${fieldSchema.minLength} properties`);
                    }
                    if (fieldSchema.maxLength !== undefined && objectKeys.length > fieldSchema.maxLength) {
                        errors.push(`${fullPath} must have at most ${fieldSchema.maxLength} properties`);
                    }
                    // Validate nested fields
                    Object.entries(fieldSchema.properties).forEach(([subKey, subSchema]) => {
                        validateField(subKey, subSchema, value[subKey], fullPath);
                    });
                }
            }
        };

        // Validate all fields
        Object.entries(schemaJson.properties).forEach(([key, fieldSchema]) => {
            validateField(key, fieldSchema, formValues[key]);
        });

        return errors;
    };

    const handleSubmit = async () => {
        const validationErrors = validateForm();

        const response = schema.safeParse(formValues);
        if (response.success) {
            setValidValues("valid");
            toast.success('Form submitted successfully!', { description: JSON.stringify(response.data, null, 2) });
            return;
        } else {
            setValidValues("invalid");
            response.errors.forEach((err) => {
                const path = err.path.join(".");
                validationErrors.push(`${path} ${err.message}`);
            });
        }

        if (validationErrors.length > 0) {
            setValidValues("invalid");
            toast.error('Form validation failed.', { description: validationErrors.join('\n') });
            return;
        }

        // continue the default form submission behavior
    };

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            setValidValues("unknown");
            handleSubmit();
        }}>
            <fieldset className="mx-auto p-6 bg-gray-50 min-h-screen">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">Dynamic Form Generator</h1>

                <div className="bg-white p-6 rounded-lg shadow-lg">
                    {Object.entries(schemaJson.properties).map(([key, fieldSchema]) => (
                        <FieldRenderer
                            key={key}
                            fieldKey={key}
                            fieldSchema={fieldSchema}
                            formValues={formValues}
                            updateField={updateField}
                        />
                    ))}

                    <button
                        type="submit"
                        className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 w-full"
                    >
                        Submit Form
                    </button>
                </div>

                <div className={`mt-6 p-4 bg-white rounded-lg shadow-lg text-gray-800 ${validValues === "valid" ? "border-green-500" : validValues === "invalid" ? "border-red-500" : validValues === "unknown" ? "border-yellow-500" : ""} border-2`}>
                    <h2 className="text-xl font-bold mb-2 text-gray-900">Current Form Values:</h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                        {JSON.stringify(formValues, null, 2)}
                    </pre>
                </div>
                <div className={`mt-6 p-4 bg-white rounded-lg shadow-lg text-gray-800 ${validValues === "valid" ? "border-green-500" : validValues === "invalid" ? "border-red-500" : validValues === "unknown" ? "border-yellow-500" : ""} border-2`}>
                    <h2 className="text-xl font-bold mb-2 text-gray-900">Current Form Values:</h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                        {JSON.stringify(schema, null, 2)}
                    </pre>
                </div>
            </fieldset>
        </form >
    );
}
