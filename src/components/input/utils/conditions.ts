/**
 * Evaluates conditional visibility rules for form fields
 * Supports both regex patterns and boolean expressions
 */
export function evaluateDependsOn(
  dependsOn: { field: string; condition: string }[] | undefined,
  formValues: Record<string, unknown>
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

  return dependsOn.every(({ field, condition }) => {
    const fieldValue = getNestedValue(formValues, field);
    const regex = toRegex(condition);
    if (regex) {
      return regex.test(String(fieldValue ?? ""));
    }
    return false;
  });
}
