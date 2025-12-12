import { useContext } from 'react';
import { FormContext, FormContextType } from '../context/FormContext';

export function useForm(): FormContextType {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('useForm must be used within FormProvider');
    }
    return context;
}
