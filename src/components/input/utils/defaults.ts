import { evaluateDependsOn } from './conditions';

/**
 * Gets default value for a field schema
 * Recursively handles objects and arrays
 */
export function getDefaultValue(schema: any, formValues: Record<string, unknown> = {}): any {
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
