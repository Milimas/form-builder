import type { Input, ValidationResult, ValidationError } from "./types";

// Evaluate/validate input data against schema
export function evaluate(
  schema: Input,
  data: unknown,
  path: string = ""
): ValidationResult {
  const errors: ValidationError[] = [];

  const addError = (message: string) => {
    errors.push({ path: path || "root", message });
  };

  // Handle null/undefined for required fields
  if (data === undefined || data === null) {
    if (schema.required) {
      addError("Value is required");
    }
    return errors.length > 0
      ? { success: false, errors }
      : { success: true, data };
  }

  switch (schema.type) {
    case "string": {
      if (typeof data !== "string") {
        addError(`Expected string, got ${typeof data}`);
      } else {
        if (schema.options !== undefined && !schema.options.includes(data)) {
          addError(`Value must be one of: ${schema.options.join(", ")}`);
        }
        if (schema.minLength !== undefined && data.length < schema.minLength) {
          addError(`String length must be at least ${schema.minLength}`);
        }
        if (schema.maxLength !== undefined && data.length > schema.maxLength) {
          addError(`String length must be at most ${schema.maxLength}`);
        }
        if (schema.pattern !== undefined && !schema.pattern.test(data)) {
          addError(`String does not match pattern ${schema.pattern}`);
        }
      }
      break;
    }

    case "number": {
      if (typeof data !== "number" || Number.isNaN(data)) {
        addError(`Expected number, got ${typeof data}`);
      } else {
        if (schema.options !== undefined && !schema.options.includes(data)) {
          addError(`Value must be one of: ${schema.options.join(", ")}`);
        }
        if (schema.min !== undefined && data < schema.min) {
          addError(`Number must be at least ${schema.min}`);
        }
        if (schema.max !== undefined && data > schema.max) {
          addError(`Number must be at most ${schema.max}`);
        }
      }
      break;
    }

    case "boolean": {
      if (typeof data !== "boolean") {
        addError(`Expected boolean, got ${typeof data}`);
      }
      break;
    }

    case "date": {
      if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
        addError(`Expected valid Date, got ${typeof data}`);
      } else {
        if (schema.min !== undefined && data < schema.min) {
          addError(`Date must be at least ${schema.min.toISOString()}`);
        }
        if (schema.max !== undefined && data > schema.max) {
          addError(`Date must be at most ${schema.max.toISOString()}`);
        }
      }
      break;
    }

    case "array": {
      if (!Array.isArray(data)) {
        addError(`Expected array, got ${typeof data}`);
      } else {
        if (schema.minLength !== undefined && data.length < schema.minLength) {
          addError(`Array length must be at least ${schema.minLength}`);
        }
        if (schema.maxLength !== undefined && data.length > schema.maxLength) {
          addError(`Array length must be at most ${schema.maxLength}`);
        }
        data.forEach((item, index) => {
          const itemResult = evaluate(
            schema.items,
            item,
            `${path}[${index}]`
          );
          if (!itemResult.success) {
            errors.push(...itemResult.errors);
          }
        });
      }
      break;
    }

    case "object": {
      if (typeof data !== "object" || data === null || Array.isArray(data)) {
        addError(`Expected object, got ${Array.isArray(data) ? "array" : typeof data}`);
      } else {
        const dataObj = data as Record<string, unknown>;

        // Validate each property in schema
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const propPath = path ? `${path}.${key}` : key;
          const propValue = dataObj[key];

          const propResult = evaluate(propSchema, propValue, propPath);
          if (!propResult.success) {
            errors.push(...propResult.errors);
          }
        }
      }
      break;
    }
  }

  return errors.length > 0
    ? { success: false, errors }
    : { success: true, data };
}

