import { createContext } from "react";

export interface FormContextType {
  formValues: Record<string, unknown>;
  updateField: (path: string, value: unknown) => void;
}

export const FormContext = createContext<FormContextType | undefined>(
  undefined
);
