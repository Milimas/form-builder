/**
 * Helper to get nested values from objects using dot notation
 */
export function getNestedValue(obj: any, path: string): unknown {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

/**
 * Helper to set nested values in objects using dot notation
 * Supports both object properties and array indices
 */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
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
                        return;
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
                    return;
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
