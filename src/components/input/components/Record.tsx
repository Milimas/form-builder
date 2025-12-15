import { useRef } from 'react';
import { FieldRenderer } from './FieldRenderer';
import { getDefaultValue } from '../utils';

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

export function RecordInput({ fieldKey, keySchema, valueSchema, value, required = false, parentPath = '', onChange }: RecordProps) {
    const newKeyRef = useRef<HTMLInputElement>(null);

    const recordValue: Record<string, unknown> =
        value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

    const renameKey = (oldKey: string, newKey: string) => {
        const k = newKey.trim();
        if (!k || k === oldKey || k in recordValue) return;
        const updated: Record<string, unknown> = { ...recordValue };
        updated[k] = updated[oldKey];
        delete updated[oldKey];
        onChange(updated);
    };

    const removeKey = (k: string) => {
        const updated: Record<string, unknown> = { ...recordValue };
        delete updated[k];
        onChange(updated);
    };

    const addKey = () => {
        const k = newKeyRef.current?.value?.trim() || '';
        if (!k || k in recordValue) return;
        const defVal = getDefaultValue(valueSchema);
        onChange({ ...recordValue, [k]: defVal });
        if (newKeyRef.current) newKeyRef.current.value = '';
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
                    style={{ display: 'none' }}
                    aria-hidden="true"
                />
            )}

            {Object.keys(recordValue).length === 0 && (
                <p className="text-sm text-gray-400 mb-2">No entries yet.</p>
            )}

            {Object.entries(recordValue).map(([k]) => (
                <div key={`row-${k}`} className="mb-3 border border-gray-700 rounded-md p-3 bg-gray-900/50">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="text"
                            defaultValue={k}
                            className="px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 flex-1"
                            onBlur={(e) => renameKey(k, e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => removeKey(k)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Remove
                        </button>
                    </div>
                    <FieldRenderer
                        key={`val-${k}`}
                        fieldKey={k}
                        fieldSchema={valueSchema}
                        parentPath={parentPath ? `${parentPath}.${fieldKey}` : fieldKey}
                    />
                </div>
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
