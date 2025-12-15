import { useRef, useEffect } from 'react';
import { FieldRenderer } from './FieldRenderer';
import { getDefaultValue } from '../utils';
import { FormProvider } from '../context/FormContext';
import { useForm } from '../hooks';

// Wrapper component to sync record field value changes back to parent
function RecordFieldWrapper({ fieldSchema, onValueChange }: {
    fieldKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fieldSchema: any;
    onValueChange: (val: unknown) => void;
}) {
    const { formValues } = useForm();
    // Use a safe field key to avoid numeric key issues with setNestedValue
    const safeFieldKey = 'value';
    const currentValue = formValues[safeFieldKey];
    const prevValueRef = useRef(currentValue);

    useEffect(() => {
        // Only sync if value actually changed (not just initial mount or re-render)
        if (prevValueRef.current !== currentValue) {
            onValueChange(currentValue);
            prevValueRef.current = currentValue;
        }
    }, [currentValue, onValueChange]);

    return <FieldRenderer fieldKey={safeFieldKey} fieldSchema={fieldSchema} parentPath="" />;
}

// Entry component for each record key-value pair
function RecordEntry({
    entryKey,
    entryValue,
    valueSchema,
    onRename,
    onRemove,
    onValueChange,
    keyInputRefs
}: {
    entryKey: string;
    entryValue: unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    valueSchema: any;
    onRename: (oldKey: string, newKey: string) => void;
    onRemove: (key: string) => void;
    onValueChange: (key: string, val: unknown) => void;
    keyInputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>;
}) {
    // Create initialValues with current entryValue, but don't recreate on every value change
    // Only recreate when key changes or when parent explicitly updates the value from outside
    // Use 'value' as the key to avoid numeric key issues in setNestedValue
    const initialValuesRef = useRef({ value: entryValue });

    // Update the ref when key changes (rename) or value changes from parent
    useEffect(() => {
        initialValuesRef.current = { value: entryValue };
    }, [entryKey, entryValue]);

    return (
        <div className="mb-3 border border-gray-700 rounded-md p-3 bg-gray-900/50">
            <div className="flex items-center gap-2 mb-2">
                <input
                    type="text"
                    key={`key-input-${entryKey}`}
                    ref={(el) => {
                        if (el) keyInputRefs.current.set(entryKey, el);
                        else keyInputRefs.current.delete(entryKey);
                    }}
                    defaultValue={entryKey}
                    className="px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 flex-1"
                    onBlur={(e) => onRename(entryKey, e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={() => onRemove(entryKey)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Remove
                </button>
            </div>
            <FormProvider key={entryKey} initialValues={initialValuesRef.current}>
                <RecordFieldWrapper
                    fieldKey={entryKey}
                    fieldSchema={valueSchema}
                    onValueChange={(val) => onValueChange(entryKey, val)}
                />
            </FormProvider>
        </div>
    );
}

interface RecordProps {
    fieldKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keySchema: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    valueSchema: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
    required?: boolean;
    parentPath?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (next: any) => void;
}

export function RecordInput({ fieldKey, keySchema, valueSchema, value, required = false, onChange }: RecordProps) {
    const newKeyRef = useRef<HTMLInputElement>(null);
    const keyInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    const recordValue: Record<string, unknown> =
        value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

    const updateValue = (key: string, val: unknown) => {
        const updated: Record<string, unknown> = Object.create(null);
        for (const [k, v] of Object.entries(recordValue)) {
            updated[k] = k === key ? val : v;
        }
        onChange(updated);
    };

    const renameKey = (oldKey: string, newKey: string) => {
        const k = newKey.trim();
        if (!k || k === oldKey || k in recordValue) {
            // Reset input to original value if invalid
            const input = keyInputRefs.current.get(oldKey);
            if (input) input.value = oldKey;
            return;
        }
        const updated: Record<string, unknown> = Object.create(null);
        // Preserve order and rename key
        for (const [key, val] of Object.entries(recordValue)) {
            if (key === oldKey) {
                updated[k] = val;
            } else {
                updated[key] = val;
            }
        }
        onChange(updated);
    };

    const removeKey = (k: string) => {
        const updated: Record<string, unknown> = Object.create(null);
        for (const [key, val] of Object.entries(recordValue)) {
            if (key !== k) {
                updated[key] = val;
            }
        }
        onChange(updated);
    };

    const addKey = () => {
        const inputElement = newKeyRef.current;
        if (!inputElement) return;

        // Trigger HTML5 validation
        if (!inputElement.checkValidity()) {
            inputElement.reportValidity();
            return;
        }

        const k = inputElement.value?.trim() || '';
        if (!k || k in recordValue) return;
        const defVal = getDefaultValue(valueSchema);
        const updated: Record<string, unknown> = Object.create(null);
        for (const [key, val] of Object.entries(recordValue)) {
            updated[key] = val;
        }
        updated[k] = defVal;
        onChange(updated);
        inputElement.value = '';
    };

    return (
        <fieldset className="mb-4 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
            <legend className="font-bold text-lg text-gray-200 px-2">
                {fieldKey}
                {required && <span className="text-red-500 ml-1">*</span>}
                <span className="ml-2 text-xs text-gray-400">(record)</span>
            </legend>

            {required && (
                <input
                    type="text"
                    required
                    value={Object.keys(recordValue).length > 0 ? 'valid' : ''}
                    onChange={() => { }}
                    style={{
                        position: 'absolute',
                        opacity: 0,
                        height: 0,
                        width: 0,
                        padding: 0,
                        margin: 0,
                        border: 'none',
                        pointerEvents: 'none'
                    }}
                    tabIndex={-1}
                    aria-hidden="true"
                />
            )}

            {Object.keys(recordValue).length === 0 && (
                <p className="text-sm text-gray-400 mb-2">No entries yet.</p>
            )}

            {Object.entries(recordValue).map(([k, v]) => (
                <RecordEntry
                    key={k}
                    entryKey={k}
                    entryValue={v}
                    valueSchema={valueSchema}
                    onRename={renameKey}
                    onRemove={removeKey}
                    onValueChange={updateValue}
                    keyInputRefs={keyInputRefs}
                />
            ))}

            <div className="flex items-center gap-2 mt-2">
                <input
                    ref={newKeyRef}
                    type={keySchema.type || 'text'}
                    placeholder="New key"
                    className="bg-gray-800 text-gray-100 p-3 rounded-lg border border-gray-600 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                    minLength={keySchema.minLength}
                    maxLength={keySchema.maxLength}
                    pattern={keySchema.pattern}
                    list={keySchema.list}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addKey();
                        }
                    }}
                />
                {keySchema.list && keySchema.dataList && (
                    <datalist id={keySchema.list}>
                        {keySchema.dataList.map((item: string) => (
                            <option key={item} value={item} />
                        ))}
                    </datalist>
                )}
                <button
                    type="button"
                    onClick={addKey}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Add
                </button>
            </div>
        </fieldset>
    );
}
