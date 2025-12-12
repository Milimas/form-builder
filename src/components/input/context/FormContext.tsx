import { createContext, useCallback, useState, ReactNode } from 'react';
import { setNestedValue } from '../utils/nested';

export interface FormContextType {
    formValues: Record<string, unknown>;
    updateField: (path: string, value: unknown) => void;
}

export const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
    children: ReactNode;
    initialValues: Record<string, unknown>;
}

export function FormProvider({ children, initialValues }: FormProviderProps) {
    const [formValues, setFormValues] = useState(initialValues);

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
