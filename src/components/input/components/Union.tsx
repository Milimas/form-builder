import { useState } from 'react';
import { FieldRenderer } from './FieldRenderer';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface UnionProps {
    label?: string;
    fieldKey: string;
    anyOf: any[];
    required?: boolean;
    value?: any;
    onChange: (value: any) => void;
    parentPath?: string;
}

export function Union({
    label,
    fieldKey,
    anyOf,
    required,
    value,
    onChange,
    parentPath = '',
}: UnionProps) {
    // Determine which variant is currently selected based on the value structure
    const getInitialVariant = () => {
        if (!value || typeof value !== 'object') return 0;

        // Try to match the value structure with one of the variants
        for (let i = 0; i < anyOf.length; i++) {
            const variant = anyOf[i];
            if (variant.type === 'object' && variant.properties) {
                const variantKeys = Object.keys(variant.properties);
                const valueKeys = Object.keys(value);

                // Check if value has the same keys as this variant
                const matches = variantKeys.every(key => valueKeys.includes(key));
                if (matches) return i;
            }
        }
        return 0;
    };

    const [selectedVariant, setSelectedVariant] = useState(getInitialVariant());

    const handleVariantChange = (index: number) => {
        setSelectedVariant(index);
        // Reset value when switching variants
        const variant = anyOf[index];
        if (variant.type === 'object' && variant.properties) {
            const newValue: Record<string, any> = {};
            Object.entries(variant.properties).forEach(([key, schema]: [string, any]) => {
                newValue[key] = schema.defaultValue ?? null;
            });
            onChange(newValue);
        } else {
            onChange(null);
        }
    };

    const getVariantLabel = (variant: any, index: number): string => {
        // Try to create a meaningful label from the variant structure
        if (variant.type === 'object' && variant.properties) {
            const keys = Object.keys(variant.properties);
            const types = keys.map((key) => {
                const prop = variant.properties[key];
                return `${key}: ${prop.type}`;
            });
            return `Option ${index + 1} (${types.join(', ')})`;
        }
        return `Option ${index + 1}`;
    };

    const fullPath = parentPath ? `${parentPath}.${fieldKey}` : fieldKey;

    return (
        <fieldset className="mb-4 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
            <legend className="font-bold text-lg text-gray-200 px-2 mb-3">
                {label || fieldKey}
                {required && <span className="text-red-500 ml-1">*</span>}
            </legend>

            {/* Tab-style Variant Selector */}
            <div className="mb-4">
                <div className="flex gap-1 bg-gray-900 p-1 rounded-lg border border-gray-700">
                    {anyOf.map((variant, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleVariantChange(index)}
                            className={`
                                flex-1 px-4 py-2.5 rounded-md font-medium transition-all duration-200
                                ${selectedVariant === index
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                }
                            `}
                        >
                            <div className="text-sm font-semibold">
                                Option {index + 1}
                            </div>
                            <div className={`text-xs mt-0.5 ${selectedVariant === index ? 'text-blue-100' : 'text-gray-500'}`}>
                                {getVariantLabel(variant, index).replace(`Option ${index + 1} `, '')}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Variant Fields */}
            {anyOf[selectedVariant] && anyOf[selectedVariant].type === 'object' && (
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    {Object.entries(anyOf[selectedVariant].properties || {}).map(
                        ([subKey, subSchema]) => (
                            <FieldRenderer
                                key={subKey}
                                fieldKey={subKey}
                                fieldSchema={subSchema}
                                parentPath={fullPath}
                            />
                        )
                    )}
                </div>
            )}

            {/* Hidden input for HTML5 validation */}
            {required && (
                <input
                    type="text"
                    required
                    value={value && typeof value === 'object' && Object.keys(value).length > 0 ? 'valid' : ''}
                    onChange={() => { }}
                    style={{ display: 'none' }}
                    aria-hidden="true"
                />
            )}
        </fieldset>
    );
}
