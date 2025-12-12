import { evaluateDependsOn } from '../utils/conditions';

/**
 * Validation result containing errors for fields
 */
export interface ValidationResult {
    errors: string[];
    isValid: boolean;
}

/**
 * Validates form data against schema
 */
export function validateForm(
    formValues: Record<string, unknown>,
    schema: any
): ValidationResult {
    const errors: string[] = [];

    const validateField = (
        fieldKey: string,
        fieldSchema: any,
        value: any,
        parentPath = ''
    ): void => {
        const fullPath = parentPath ? `${parentPath}.${fieldKey}` : fieldKey;

        const isVisible = evaluateDependsOn(fieldSchema['data-depends-on'], formValues);
        if (!isVisible) {
            return;
        }

        // Validate based on type
        if (fieldSchema.type === 'object') {
            // For objects, validate nested fields even if the object itself is not required
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const objectKeys = Object.keys(value);
                if (fieldSchema.minLength !== undefined && objectKeys.length < fieldSchema.minLength) {
                    errors.push(`${fullPath} must have at least ${fieldSchema.minLength} properties`);
                }
                if (fieldSchema.maxLength !== undefined && objectKeys.length > fieldSchema.maxLength) {
                    errors.push(`${fullPath} must have at most ${fieldSchema.maxLength} properties`);
                }
                // Validate nested fields
                if (fieldSchema.properties) {
                    Object.entries(fieldSchema.properties).forEach(([subKey, subSchema]) => {
                        validateField(subKey, subSchema, value[subKey], fullPath);
                    });
                }
            } else if (fieldSchema.required) {
                // Only show "is required" if the object field is required but missing
                errors.push(`${fullPath} is required`);
            }
        } else if (fieldSchema.type === 'array') {
            if (Array.isArray(value)) {
                if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
                    errors.push(`${fullPath} must have at least ${fieldSchema.minLength} items`);
                }
                if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
                    errors.push(`${fullPath} must have at most ${fieldSchema.maxLength} items`);
                }
                // Validate array items
                if (fieldSchema.items && fieldSchema.items[0]) {
                    value.forEach((item, index) => {
                        validateField(`${index}`, fieldSchema.items[0], item, fullPath);
                    });
                }
            } else if (fieldSchema.required) {
                errors.push(`${fullPath} is required`);
            }
        } else {
            // For primitive types, check required
            if (fieldSchema.required && (value === undefined || value === null || value === '')) {
                errors.push(`${fullPath} is required`);
            }
        }
    };

    // Validate all fields
    Object.entries(schema.properties).forEach(([key, fieldSchema]) => {
        validateField(key, fieldSchema, formValues[key]);
    });

    return {
        errors,
        isValid: errors.length === 0,
    };
}
