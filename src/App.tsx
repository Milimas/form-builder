import { useEffect } from "react";
import { evaluate, type Input, type InferedInput } from "./form/index.ts";

const schema = {
  type: "object",
  properties: {
    firstName: {
      type: "string",
      minLength: 3,
      required: true,
    },
    lastName: {
      type: "string",
      required: true,
    },
    email: {
      type: "string",
      required: true,
    },
    age: {
      type: "number",
      required: true,
    },
    isStudent: {
      type: "boolean",
      required: true,
    },
    dateOfBirth: {
      type: "date",
      required: true,
    },
    hobbies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            required: true,
          },
          description: {
            type: "object",
            properties: {
              value: {
                type: "string",
                required: true,
              },
            },
          },
        },
      },
      required: true,
    },
  },
} as const satisfies Input;

const data: InferedInput<typeof schema> = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  age: 20,
  isStudent: true,
  dateOfBirth: new Date(),
  hobbies: [
    {
      name: "Reading",
      description: {
        value: "hello",
      },
    },
  ],
};

export default function App() {
  useEffect(() => {
    // Evaluate the data against the schema
    const result = evaluate(schema, data);

    if (result.success) {
      console.log("Validation passed!", result.data);
    } else {
      console.log("Validation failed:", result.errors);
    }
  }, []);

  return (
    <main className="container p-[clamp(1rem,5vw,5rem)] grid place-content-center">
      <div className="w-[min(60rem,80vw)]">
        <h1 className="text-[clamp(1.2rem,3vw,3rem)] font-bold text-center mb-4">
          Form Builder Example
        </h1>
        <pre className="p-4 bg-foreground/10  rounded-lg overflow-auto text-lg">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </main>
  );
}
