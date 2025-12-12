import { ObjectInput } from "./form/index.ts";
import { DynamicForm } from "./components/input/string/index.tsx";
import { Toaster } from "sonner";
import { s } from "validator";

const schema = s.object({
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
});
const schemaJson = schema.toJSON();
console.log("Fetched schema:", schemaJson);



export default function App() {

  return (

    <div className="p-4 max-w-50 bg-foreground/10 rounded-lg">
      <Toaster />
      <DynamicForm schema={schemaJson as ObjectInput} />
    </div>
    //   </div>
    // </main>
  );
}
