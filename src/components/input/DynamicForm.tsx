import React from 'react';
import { useForm } from './hooks/useForm';
import { FieldRenderer } from './components/FieldRenderer';
import { validateForm } from './validators';
import { toast } from 'sonner';
import v, { SchemaType } from 'validator';
import { HtmlObjectType } from '../../../../validator/lib/types';

// Using any for schema to support flexible runtime schemas
interface DynamicFormProps {
    schema: SchemaType;
    onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
    onSubmitSuccess?: (values: Record<string, unknown>) => void;
    onSubmitError?: () => void;
}

function DynamicFormContent({ schema, onSubmit, onSubmitSuccess, onSubmitError }: DynamicFormProps) {
    const { formValues } = useForm();
    // Support passing either a validator schema instance or plain JSON
    const schemaJson = schema.toJSON();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate form using actual form values from context
        const validationResult = validateForm(formValues, schema);

        if (!validationResult.isValid) {
            // Clear submission result on validation failure
            if (onSubmitError) {
                onSubmitError();
            }
            // Show validation errors
            validationResult.errors.forEach((error: string) => {
                toast.error(error);
            });
            return;
        }

        // Update submission result on success
        if (onSubmitSuccess) {
            onSubmitSuccess(formValues);
        }

        // Call onSubmit if provided
        if (onSubmit) {
            try {
                await onSubmit(formValues);
                toast.success(
                    <div>
                        <div className="font-semibold mb-2">Form submitted successfully!</div>
                        <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(formValues, null, 2)}
                        </pre>
                    </div>,
                    { duration: 5000 }
                );
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : 'Failed to submit form'
                );
            }
        } else {
            // No callback provided, just show success with parsed values
            toast.success(
                <div>
                    <div className="font-semibold mb-2">Form submitted successfully!</div>
                    <pre className="text-xs p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(formValues, null, 2)}
                    </pre>
                </div>,
                { duration: 5000 }
            );
            console.log('Form values:', formValues);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-full">
            <div className="flex-1 overflow-y-auto pr-4">
                {Object.entries((schemaJson as HtmlObjectType<v.infer<typeof schema>>).properties || {}).map(([fieldKey, fieldSchema]) => (
                    <FieldRenderer
                        key={fieldKey}
                        fieldKey={fieldKey}
                        fieldSchema={fieldSchema}
                    />
                ))}
            </div>
            <button
                type="submit"
                className="sticky bottom-0 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-lg"
            >
                Submit
            </button>
        </form>
    );
}

export function DynamicForm({ schema, onSubmit, onSubmitSuccess, onSubmitError }: DynamicFormProps) {
    return <DynamicFormContent schema={schema} onSubmit={onSubmit} onSubmitSuccess={onSubmitSuccess} onSubmitError={onSubmitError} />;
}
