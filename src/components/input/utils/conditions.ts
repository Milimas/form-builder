/**
 * Evaluates conditional visibility rules for form fields
 * Supports both regex patterns and boolean expressions
 */
export function evaluateDependsOn(
  dependsOn: { field: string; condition: string }[] | undefined,
  formValues: Record<string, unknown>,
  currentPath = ""
): boolean {
  if (!dependsOn || dependsOn.length === 0) return true;

  const toRegex = (condition: string): RegExp | null => {
    const regexLiteralMatch = condition.match(/^\/(.*)\/(\w*)$/);
    if (regexLiteralMatch) {
      try {
        return new RegExp(regexLiteralMatch[1], regexLiteralMatch[2]);
      } catch {
        return null;
      }
    }
    try {
      return new RegExp(condition);
    } catch {
      return null;
    }
  };

  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string
  ): unknown => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return path.split(".").reduce((acc: any, part) => acc?.[part], obj);
  };

  const resolveFieldPath = (fieldPath: string): string => {
    // If currentPath is empty, use fieldPath as-is
    if (!currentPath) return fieldPath;

    // Split both paths into parts
    const currentParts = currentPath.split(".");
    const fieldParts = fieldPath.split(".");

    // Check if fieldPath starts with a parent path component
    // For example: if currentPath is "array.0.option1" and fieldPath is "array.options"
    // We need to check if "array" matches and then resolve relative to current item
    
    // Find common prefix
    let commonPrefixLength = 0;
    for (let i = 0; i < Math.min(currentParts.length, fieldParts.length); i++) {
      if (currentParts[i] === fieldParts[i] || /^\d+$/.test(currentParts[i])) {
        // Match or current part is an index
        if (currentParts[i] === fieldParts[i]) {
          commonPrefixLength = i + 1;
        } else if (/^\d+$/.test(currentParts[i]) && i > 0 && currentParts[i - 1] === fieldParts[i - 1]) {
          // Current part is array index, previous parts match
          // Replace the field path with the current index
          const resolvedParts = [...fieldParts];
          resolvedParts.splice(i, 0, currentParts[i]);
          return resolvedParts.join(".");
        }
      } else {
        break;
      }
    }

    return fieldPath;
  };

  return dependsOn.every(({ field, condition }) => {
    const resolvedField = resolveFieldPath(field);
    const fieldValue = getNestedValue(formValues, resolvedField);
    const regex = toRegex(condition);
    if (regex) {
      return regex.test(String(fieldValue ?? ""));
    }
    return false;
  });
}
