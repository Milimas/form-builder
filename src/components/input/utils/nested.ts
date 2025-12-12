/**
 * Helper to get nested values from objects using dot notation
 */
export function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split(".").reduce((acc: any, part) => acc?.[part], obj);
}

/**
 * Helper to set nested values in objects using dot notation
 * Supports both object properties and array indices
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split(".");
  let current: Record<string, unknown> | unknown[] = obj;
  let parent: Record<string, unknown> | unknown[] | null = null;
  let parentKey: string | number | null = null;

  for (let i = 0; i < parts.length; i++) {
    const rawKey = parts[i];
    const isIndex = /^\d+$/.test(rawKey);
    const key: string | number = isIndex ? Number(rawKey) : rawKey;
    const isLast = i === parts.length - 1;
    const nextRawKey = parts[i + 1];
    const nextIsIndex = nextRawKey !== undefined && /^\d+$/.test(nextRawKey);

    // Ensure current is an object/array before proceeding
    if (
      (typeof current !== "object" || current === null) &&
      parent !== null &&
      parentKey !== null
    ) {
      (parent as Record<string, unknown>)[parentKey as string] = {};
      current = (parent as Record<string, unknown>)[
        parentKey as string
      ] as Record<string, unknown>;
    }

    if (isLast) {
      if (isIndex) {
        if (!Array.isArray(current)) {
          if (parent !== null && parentKey !== null) {
            (parent as Record<string, unknown>)[parentKey as string] = [];
            current = (parent as Record<string, unknown>)[
              parentKey as string
            ] as unknown[];
          } else {
            return;
          }
        }
        (current as unknown[])[Number(key)] = value;
      } else {
        (current as Record<string, unknown>)[key as string] = value;
      }
      return;
    }

    if (isIndex) {
      if (!Array.isArray(current)) {
        if (parent !== null && parentKey !== null) {
          (parent as Record<string, unknown>)[parentKey as string] = [];
          current = (parent as Record<string, unknown>)[
            parentKey as string
          ] as unknown[];
        } else {
          return;
        }
      }
      if (
        current[key as number] === undefined ||
        current[key as number] === null ||
        typeof current[key as number] !== "object"
      ) {
        current[key as number] = nextIsIndex ? [] : {};
      }
      parent = current;
      parentKey = key;
      current = (current as unknown[])[Number(key)] as
        | Record<string, unknown>
        | unknown[];
    } else {
      if (
        (current as Record<string, unknown>)[key as string] === undefined ||
        (current as Record<string, unknown>)[key as string] === null ||
        typeof (current as Record<string, unknown>)[key as string] !== "object"
      ) {
        (current as Record<string, unknown>)[key as string] = nextIsIndex
          ? []
          : {};
      }
      parent = current;
      parentKey = key;
      current = (current as Record<string, unknown>)[key as string] as
        | Record<string, unknown>
        | unknown[];
    }
  }
}
