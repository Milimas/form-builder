import { evaluateDependsOn } from "../utils/conditions";

/**
 * Validation result containing errors for fields
 */
export interface ValidationResult {
  errors: string[];
  isValid: boolean;
}

/**
  if (schema.type === "json") {
    const target = path ? getPathValue(formData, path) : formData;
    const valueToCheck = target ?? schema.defaultValue ?? {};
    try {
      if (typeof valueToCheck === "string") {
        JSON.parse(valueToCheck);
      } else {
        JSON.parse(JSON.stringify(valueToCheck));
      }
    } catch (err) {
      return { isValid: false, errors: [`${path || "value"} should be valid JSON`] };
    }
  }

 * Validates form data against schema
 */
import v, { SchemaType } from "validator";
import { HtmlObjectType } from "../../../../../validator/lib/types";

export function validateForm(
  formValues: Record<string, unknown>,
  schema: SchemaType
): ValidationResult {
  const errors: string[] = [];
  const schemaJson: HtmlObjectType<v.infer<typeof schema>> =
    schema.toJSON() as HtmlObjectType<v.infer<typeof schema>>;

  // Using any for runtime schema flexibility

  const validateField = (
    fieldKey: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fieldSchema: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    parentPath = ""
  ): void => {
    const fullPath = parentPath ? `${parentPath}.${fieldKey}` : fieldKey;

    const isVisible = evaluateDependsOn(
      fieldSchema["data-depends-on"],
      formValues,
      fullPath
    );
    if (!isVisible) {
      return;
    }

    // Validate based on type
    if (fieldSchema.type === "object") {
      // For objects, validate nested fields even if the object itself is not required
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        const objectKeys = Object.keys(value);
        if (
          fieldSchema.minLength !== undefined &&
          objectKeys.length < fieldSchema.minLength
        ) {
          errors.push(
            `${fullPath} must have at least ${fieldSchema.minLength} properties`
          );
        }
        if (
          fieldSchema.maxLength !== undefined &&
          objectKeys.length > fieldSchema.maxLength
        ) {
          errors.push(
            `${fullPath} must have at most ${fieldSchema.maxLength} properties`
          );
        }
        // Validate nested fields
        if (fieldSchema.properties) {
          Object.entries(fieldSchema.properties).forEach(
            ([subKey, subSchema]) => {
              validateField(subKey, subSchema, value[subKey], fullPath);
            }
          );
        }
      } else if (fieldSchema.required) {
        // Only show "is required" if the object field is required but missing
        errors.push(`${fullPath} is required`);
      }
    } else if (fieldSchema.type === "array") {
      if (Array.isArray(value)) {
        if (
          fieldSchema.minLength !== undefined &&
          value.length < fieldSchema.minLength
        ) {
          errors.push(
            `${fullPath} must have at least ${fieldSchema.minLength} items`
          );
        }
        if (
          fieldSchema.maxLength !== undefined &&
          value.length > fieldSchema.maxLength
        ) {
          errors.push(
            `${fullPath} must have at most ${fieldSchema.maxLength} items`
          );
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
    } else if (fieldSchema.type === "union") {
      // For union types, validate against at least one of the anyOf schemas
      if (fieldSchema.anyOf && Array.isArray(fieldSchema.anyOf)) {
        let validAgainstAny = false;

        for (const variantSchema of fieldSchema.anyOf) {
          const savedErrors = errors.length;

          // Try to validate against this variant
          if (variantSchema.type === "object" && variantSchema.properties) {
            Object.entries(variantSchema.properties).forEach(
              ([subKey, subSchema]) => {
                const subValue = value?.[subKey];
                validateField(subKey, subSchema, subValue, fullPath);
              }
            );

            // If no new errors were added, this variant is valid
            if (errors.length === savedErrors) {
              validAgainstAny = true;
              break;
            } else {
              // Collect these errors and rollback
              errors.splice(savedErrors);
            }
          }
        }

        // If no variant was valid and field is required, add error
        if (!validAgainstAny) {
          if (fieldSchema.required) {
            errors.push(`${fullPath} must match one of the union types`);
          }
        }
      } else if (fieldSchema.required) {
        errors.push(`${fullPath} is required`);
      }
    } else if (fieldSchema.type === "any" || fieldSchema.type === "unknown") {
      // Any and unknown types always pass validation (accept any value)
      // Only check if required and value is undefined
      if (fieldSchema.required && value === undefined) {
        errors.push(`${fullPath} is required`);
      }
    } else if (fieldSchema.type === "json") {
      if (value === undefined || value === null || value === "") {
        if (fieldSchema.required) {
          errors.push(`${fullPath} is required`);
        }
      } else {
        const raw = typeof value === "string" ? value : JSON.stringify(value);
        try {
          JSON.parse(raw);
        } catch {
          errors.push(`${fullPath} must be valid JSON`);
        }
      }
    } else {
      // For primitive types, check required
      if (fieldSchema.required) {
        // Special handling for checkboxes - they must be explicitly set (true or false)
        if (fieldSchema.type === "boolean") {
          if (value === undefined || value === null) {
            errors.push(`${fullPath} is required`);
          }
        } else if (value === undefined || value === null || value === "") {
          errors.push(`${fullPath} is required`);
        }
      }
    }
  };

  // Validate all fields
  Object.entries(schemaJson.properties).forEach(([key, fieldSchema]) => {
    validateField(key, fieldSchema, formValues[key]);
  });

  const result = schema.safeParse(formValues);
  if (!result.success) {
    result.errors.forEach((err) => {
      const path = err.path.join(".");
      errors.push(`${path}: ${err.message}`);
    });
  }

  return {
    errors,
    isValid: errors.length === 0,
  };
}
