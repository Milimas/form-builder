import { DynamicForm, useForm, FormProvider, getDefaultValue, validateForm } from "./components/input/index.ts";
import { ReadOnlyCodeMirror } from "./components/CodeMirrorEditor";
import { Toaster, toast } from "sonner";
import type { SchemaType } from "validator";
import { v } from "validator";
import { useEffect, useState } from "react";

const schema = v.object({
  // name: v.string().minLength(2).maxLength(50),
  // age: v.number().min(0).max(120),
  // email: v.string().pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  // preferences: v.object({
  //   newsletter: v.boolean().default(false),
  //   notifications: v.enum(["all", "mentions", "none"] as const).default("all"),
  // }),
  // nestedLevels: v.object({
  //   level1: v.object({
  //     level2: v.object({
  //       level3: v.object({
  //         level4: v.object({
  //           info: v.string().minLength(5).maxLength(100),
  //         }),
  //       }),
  //     }),
  //   }),
  // }),
  // tags: v.array(v.string().minLength(1).maxLength(20)).minLength(0).maxLength(10),
  // anyField: v.any(),
  // unknownField: v.unknown(),
  // union: v.union([
  //   v.object({
  //     value: v.string(),
  //     value2: v.string().optional(),
  //   }),
  //   v.object({
  //     value: v.number(),
  //   }),
  //   v.object({
  //     value: v.boolean().default(true),
  //     json: v.json(),
  //   }),
  // ]),
  record: v.record(v.string().min(10), v.number()),
  record2: v.record(v.number()).optional(),

});

export default function App() {
  const schemaJson = schema.toJSON();
  const initialValues = (() => {
    const values: Record<string, unknown> = {};
    Object.entries(schemaJson.properties || {}).forEach(([key, fieldSchema]) => {
      values[key] = getDefaultValue(fieldSchema);
    });
    return values;
  })();

  return (
    <FormProvider initialValues={initialValues}>
      <AppContent schema={schema} />
    </FormProvider>
  );
}

function AppContent({ schema }: { schema: SchemaType }) {
  const { formValues } = useForm();
  const schemaJson = schema.toJSON();
  const [errorPaths, setErrorPaths] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string>('');

  console.log('Current submissionResult state:', submissionResult);

  // Validate on form value changes
  useEffect(() => {
    const validationResult = validateForm(formValues, schema);

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
  }, [formValues, schema, hasValidated, isValid]);

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
              <ReadOnlyCodeMirror
                value={submissionResult}
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
              <ReadOnlyCodeMirror
                value={JSON.stringify(formValues, null, 2)}
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
              <ReadOnlyCodeMirror
                value={JSON.stringify(schemaJson, null, 2)}
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
                schema={schema}
                onSubmitSuccess={(values) => {
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
