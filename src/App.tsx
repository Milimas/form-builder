import { ObjectInput } from "./form/index.ts";
import { DynamicForm, useForm, FormProvider, getDefaultValue, validateForm } from "./components/input/index.ts";
import { CodeMirrorEditor } from "./components/CodeMirrorEditor";
import { Toaster, toast } from "sonner";
import { s } from "validator";
import { useEffect, useState } from "react";

const fileAttachmentSchema = s.object({
  "@odata.type": s.string().default("#microsoft.graph.fileAttachment").readOnly(),
  name: s.string().default("Attached File"),
  contentType: s.string().default("text/plain"),
  contentBytes: s.string(),
});

const eventAttachmentSchema = s.object({
  "@odata.type": s.string().default("#microsoft.graph.eventAttachment").readOnly(),
  name: s.string().default("Attached Event"),
  event: s.object({
    subject: s.string(),
    body: s
      .object({
        contentType: s.enum(["None", "Text", "HTML"] as const).optional(),
        text: s.string().dependsOn([{ field: "eventAttachmentSchema.event.body.contentType", condition: /Text/ }]),
        html: s.html().dependsOn([{ field: "eventAttachmentSchema.event.body.contentType", condition: /HTML/ }]),
      })
      .optional(),
    start: s.string().optional(),
    end: s.string().optional(),
    location: s
      .object({
        displayName: s.string().optional(),
      })
      .optional(),
    attendees: s
      .array(
        s.object({
          emailAddress: s.object({
            address: s.string(),
            name: s.string().optional(),
          }),
          type: s
            .enum(["required", "optional", "resource"] as const)
            .default("required"),
        })
      )
      .optional(),
    isAllDay: s.boolean().optional().default(false),
    sensitivity: s
      .enum(["normal", "personal", "private", "confidential"] as const)
      .optional()
      .default("normal"),
  }).optional(),
});
const schema = s.object({
  option: s.enum(["A", "B", "C"] as const).default("A"),
  a: s.string().dependsOn([{ field: "option", condition: /A/ }]),
  b: s.number().dependsOn([{ field: "option", condition: /B/ }]),
  c: s.string().dependsOn([{ field: "option", condition: /C/ }]),
  name: s.string().minLength(2).maxLength(50).required(),
  age: s.number().min(0).max(120).required(),
  email: s.string().pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).required(),
  preferences: s
    .object({
      newsletter: s.boolean().default(false),
      notifications: s.enum(["all", "mentions", "none"] as const).default("all"),
    })
    .required(),
  tags: s.array(s.string().minLength(1).maxLength(20)).minLength(0).maxLength(10),
  fileAttachmentSchema: fileAttachmentSchema.required(true),
  eventAttachmentSchema: eventAttachmentSchema.required(true),
});
const schemaJson = schema.toJSON();
console.log("Fetched schema:", schemaJson);



export default function App() {
  const schemaJson = schema.toJSON();
  const initialValues = (() => {
    const values: Record<string, any> = {};
    Object.entries(schemaJson.properties || {}).forEach(([key, fieldSchema]) => {
      values[key] = getDefaultValue(fieldSchema);
    });
    return values;
  })();

  return (
    <FormProvider initialValues={initialValues}>
      <AppContent schema={schemaJson as ObjectInput} />
    </FormProvider>
  );
}

function AppContent({ schema }: { schema: ObjectInput }) {
  const { formValues } = useForm();
  const schemaJson = schema;
  const [errorPaths, setErrorPaths] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string>('');

  console.log('Current submissionResult state:', submissionResult);

  // Validate on form value changes
  useEffect(() => {
    const validationResult = validateForm(formValues, schemaJson);

    if (validationResult.errors.length > 0) {
      // Extract field paths from error messages
      const paths = validationResult.errors.map(err => {
        const match = err.match(/^(.+?)\s+(is required|must have)/);
        return match ? match[1] : '';
      }).filter(Boolean);

      setErrorPaths(paths);
      setIsValid(false);
      setHasValidated(true);
    } else {
      setErrorPaths([]);
      if (hasValidated && !isValid) {
        toast.success('All fields are valid! ✅');
      }
      setIsValid(true);
      setHasValidated(true);
    }
  }, [formValues, schemaJson, hasValidated, isValid]);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Toaster />

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 shadow-lg">
        <h1 className="text-2xl font-bold text-white">Form Builder</h1>
        <p className="text-sm text-gray-400">Design and preview dynamic forms with real-time schema validation</p>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Results & Schema */}
        <div className="w-1/2 flex flex-col border-r border-gray-700 overflow-hidden bg-gray-900">
          {/* Submission Result */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Submission Result</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeMirrorEditor
                value={submissionResult}
                readOnly={true}
                height="100%"
              />
            </div>
          </div>

          {/* Current Values */}
          <div className="flex-1 flex flex-col overflow-hidden border-t border-gray-700">
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">
                Current Values
                {isValid && hasValidated && <span className="ml-2 text-green-500 text-sm">✓ Valid</span>}
                {!isValid && hasValidated && <span className="ml-2 text-red-500 text-sm">⚠ {errorPaths.length} errors</span>}
              </h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeMirrorEditor
                value={JSON.stringify(formValues, null, 2)}
                readOnly={true}
                height="100%"
                errorPaths={!isValid ? errorPaths : []}
              />
            </div>
          </div>

          {/* Schema */}
          <div className="flex-1 flex flex-col overflow-hidden border-t border-gray-700">
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Schema</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <CodeMirrorEditor
                value={JSON.stringify(schemaJson, null, 2)}
                readOnly={true}
                height="100%"
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-1/2 flex flex-col overflow-hidden bg-gray-900">
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Form</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex justify-center">
            <div className="w-full max-w-2xl">
              <DynamicForm 
                schema={schemaJson} 
                onSubmitSuccess={(values) => {
                  console.log('Setting submission result:', values);
                  // Filter out undefined values before stringifying
                  const filteredValues = JSON.parse(JSON.stringify(values));
                  const jsonString = JSON.stringify(filteredValues, null, 2);
                  console.log('JSON string to set:', jsonString);
                  setSubmissionResult(jsonString);
                }}
                onSubmitError={() => setSubmissionResult('')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
