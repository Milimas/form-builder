import { useCallback, useState, ReactNode, useEffect } from 'react';
import { setNestedValue } from '../utils/nested';
import { FormContext, FormContextType } from './FormContextType';

export { FormContext };
export type { FormContextType };

interface FormProviderProps {
    children: ReactNode;
    initialValues: Record<string, unknown>;
}

export function FormProvider({ children, initialValues }: FormProviderProps) {
    const [formValues, setFormValues] = useState(initialValues);

    // Sync external changes to initialValues
    useEffect(() => {
        setFormValues(initialValues);
    }, [initialValues]);

    const updateField = useCallback((path: string, value: unknown) => {
        setFormValues((prev) => {
            const newValues = { ...prev };
            setNestedValue(newValues, path, value);
            return newValues;
        });
    }, []);

    return (
        <FormContext.Provider value={{ formValues, updateField }}>
            {children}
        </FormContext.Provider>
    );
}
