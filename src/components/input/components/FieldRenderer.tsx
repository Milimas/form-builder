import React, { useEffect, useRef } from 'react';
import { Input } from './Input';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { DatetimeInput } from './DatetimeInput';
import { useForm } from '../hooks';
import { evaluateDependsOn, getDefaultValue, getNestedValue } from '../utils';

// Using any for fieldSchema because runtime schema is more flexible than static types
interface FieldRendererProps {
    fieldKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fieldSchema: any;
    parentPath?: string;
}

export function FieldRenderer({
    fieldKey,
    fieldSchema,
    parentPath = '',
}: FieldRendererProps) {
    const { formValues, updateField } = useForm();
    const fullPath = parentPath ? `${parentPath}.${fieldKey}` : fieldKey;
    const fieldValue = getNestedValue(formValues, fullPath);

    // Check if field should be visible based on dependsOn
    const isVisible = evaluateDependsOn(fieldSchema['data-depends-on'], formValues);

    // Track previous visibility state
    const prevVisibleRef = useRef(isVisible);

    // Reset to default value when field transitions from visible to invisible
    useEffect(() => {
        const wasVisible = prevVisibleRef.current;

        if (wasVisible && !isVisible) {
            const defaultValue = getDefaultValue(fieldSchema);
            updateField(fullPath, defaultValue);
        }

        prevVisibleRef.current = isVisible;
    }, [isVisible, fullPath, fieldSchema, updateField]);

    if (!isVisible) {
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChange = (value: any) => {
        updateField(fullPath, value);
    };

    // Only require field if it's visible (considering depends-on)
    const isFieldRequired: boolean = fieldSchema.required && isVisible;

    // Handle different field types
    switch (fieldSchema.type) {
        case 'text':
        case 'email':
        case 'url':
        case 'password':
            return (
                <Input
                    label={fieldKey}
                    type={fieldSchema.type}
                    value={fieldValue ?? fieldSchema?.defaultValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange(e.target.value)
                    }
                    placeholder={fieldSchema.placeholder}
                    minLength={fieldSchema.minLength}
                    maxLength={fieldSchema.maxLength}
                    pattern={fieldSchema.pattern}
                    list={fieldSchema.list}
                    dataList={fieldSchema.dataList}
                    required={isFieldRequired}
                />
            );

        case 'number':
            return (
                <Input
                    label={fieldKey}
                    type="number"
                    value={fieldValue ?? fieldSchema?.defaultValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange(Number(e.target.value))
                    }
                    min={fieldSchema.min}
                    max={fieldSchema.max}
                    required={isFieldRequired}
                />
            );

        case 'checkbox':
            return (
                <Checkbox
                    label={fieldKey}
                    checked={Boolean(fieldValue)}
                    onChange={(e) => handleChange(e.target.checked)}
                    required={isFieldRequired}
                />
            );

        case 'select':
            return (
                <Select
                    label={fieldKey}
                    options={fieldSchema.options}
                    value={fieldValue || fieldSchema?.defaultValue || fieldSchema.options?.[0] || ''}
                    onChange={(e) => handleChange(e.target.value)}
                    required={isFieldRequired}
                />
            );

        case 'datetime-local':
            return (
                <DatetimeInput
                    label={fieldKey}
                    value={fieldValue ?? fieldSchema?.defaultValue ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleChange(e.target.value)
                    }
                    required={isFieldRequired}
                />
            );

        case 'object':
            return (
                <fieldset className="mb-4 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                    <legend className="font-bold text-lg text-gray-200 px-2">
                        {fieldKey}
                        {fieldSchema.required && <span className="text-red-500 ml-1">*</span>}
                    </legend>
                    {/* Hidden input for HTML5 validation */}
                    {isFieldRequired && (
                        <input
                            type="text"
                            required
                            value={fieldValue && typeof fieldValue === 'object' && Object.keys(fieldValue).length > 0 ? 'valid' : ''}
                            onChange={() => { }}
                            style={{ display: 'none' }}
                            aria-hidden="true"
                        />
                    )}
                    {Object.entries(fieldSchema.properties).map(([subKey, subSchema]) => (
                        <FieldRenderer
                            key={subKey}
                            fieldKey={subKey}
                            fieldSchema={subSchema}
                            parentPath={fullPath}
                        />
                    ))}
                </fieldset>
            );

        case 'array':
            {
                const arrayValue = (fieldValue as unknown[]) || [];
                return (
                    <fieldset className="flex flex-col mb-4 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                        <label className="block w-full mb-2 font-semibold text-gray-200">
                            {fieldKey}
                            {fieldSchema.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {/* Hidden input for HTML5 validation */}
                        {isFieldRequired && (
                            <input
                                type="text"
                                required
                                value={arrayValue.length > 0 ? 'valid' : ''}
                                onChange={() => { }}
                                style={{ display: 'none' }}
                                aria-hidden="true"
                            />
                        )}
                        {arrayValue.map((_, index: number) => (
                            <div key={index} className="flex flex-col mb-2">
                                <FieldRenderer
                                    fieldKey={`${index}`}
                                    fieldSchema={fieldSchema.items[0]}
                                    parentPath={fullPath}
                                />
                                <button
                                    onClick={() => {
                                        const newArray = arrayValue.filter(
                                            (_, i) => i !== index
                                        );
                                        handleChange(newArray);
                                    }}
                                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        {(!fieldSchema.maxLength ||
                            arrayValue.length < fieldSchema.maxLength) && (
                                <button
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                        e.preventDefault();
                                        const defaultItemValue = getDefaultValue(
                                            fieldSchema.items[0]
                                        );
                                        handleChange([...arrayValue, defaultItemValue]);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
