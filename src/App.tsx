import { ObjectInput } from "./form/index.ts";
import { DynamicForm } from "./components/input/string/index.tsx";
import { Toaster } from "sonner";

const schema = await fetch("http://localhost:3000/schema").then(res => res.json()) as ObjectInput;
console.log("Fetched schema:", schema);


// /**
//  * Creates a form based on the provided schema.
//  * @schema a form schema defining the structure and validation rules for the form
//  * @returns a form based on the given schema
//  */
// function createFormFromSchema(schema: TInput | undefined | null, isNested: boolean = false): React.ReactNode {
//   if (schema === undefined || schema === null) {
//     console.log("No schema provided");
//     return <div>No schema provided</div>;
//   }
//   console.log("Creating form for schema:", schema);
//   if (schema.type === "object") {
//     return (
//       <>
//         {!isNested && <form>
//           {schema.properties && Object.entries(schema.properties).map(([key, value]) => {
//             console.log("Processing field:", key, value);
//             return <div key={key} className="mb-4">
//               <label className="block mb-2 font-semibold">{key}</label>
//               {createFormFromSchema(value, true)}
//             </div>
//           })}
//           <button type="submit">Submit</button>
//         </form>
//         }
//         {isNested &&
//           <div className="p-4 border border-gray-300 rounded">
//             {schema.properties && Object.entries(schema.properties).map(([key, value]) => {
//               console.log("Processing nested field:", key, value);
//               return <div key={key} className="mb-4">
//                 <label className="block mb-2 font-semibold">{key}</label>
//                 {createFormFromSchema(value, true)}
//               </div>
//             })}
//           </div>
//         }
//       </>
//     );
//   } else if (schema.type === "number") {
//     return (
//       <Input
//         type="number"
//         defaultValue={schema.value as number | undefined}
//         min={schema.min}
//         max={schema.max}
//         className="w-full p-2 border border-gray-300 rounded"
//       />
//     );
//   } else if (schema.type === "boolean") {
//     return (
//       <Input
//         type="checkbox"
//         defaultChecked={schema.value as boolean | undefined}
//         className="w-4 h-4"
//       />
//     );
//   } else if (schema.type === "select") {
//     return (
//       <select
//         defaultValue={schema.value as string | undefined}
//         className="w-full p-2 border border-gray-300 rounded"
//       >
//         {schema.options.map((option) => (
//           <option key={option} value={option}>
//             {option}
//           </option>
//         ))}
//       </select>
//     );
//   }
//   else if (schema.type === "text" || schema.type === "email" || schema.type === "password" || schema.type === "url" || schema.type === "color") {
//     return (
//       <>
//         <Input
//           {...schema}
//           className="w-full p-2 border border-gray-300 rounded"
//         />
//       </>
//     );
//   }
//   else if (schema.type === "array") {
//     return (
//       <div>
//         {schema.items && createFormFromSchema(schema.items, true)}
//         <button type="button" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
//           Add Item
//         </button>
//       </div>
//     );
//   } else if (schema.type === "checkbox") {
//     return (
//       <input
//         type={schema.type}
//         defaultChecked={schema.checked}
//         className="w-4 h-4"
//       />
//     );
//   }
//   return <div>Unsupported field type</div>;
// }

export default function App() {

  return (
    // <main className="container p-[clamp(1rem,5vw,5rem)] grid place-content-center min-h-screen">
    //   <div className="w-[min(60rem,80vw)] space-y-6">
    //     <h1 className="text-[clamp(1.2rem,3vw,3rem)] font-bold text-center mb-4">
    //       Form Builder Example
    //     </h1>
    //     <pre className="p-4 bg-foreground/10 rounded-lg overflow-auto text-lg max-h-96">
    //       {JSON.stringify(data, null, 2)}
    //     </pre>
    //     <pre className="p-4 bg-foreground/10 rounded-lg overflow-auto text-lg max-h-96">
    //       {JSON.stringify(schema, null, 2)}
    //     </pre>
    <div className="p-4 max-w-50 bg-foreground/10 rounded-lg">
      <Toaster />
      {/* {schema && createFormFromSchema(schema)} */}
      <DynamicForm schema={schema as ObjectInput} />
    </div>
    //   </div>
    // </main>
  );
}
