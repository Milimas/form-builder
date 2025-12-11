export interface BaseInput {
  type: string;
  defaultValue?: unknown;
  required?: boolean;
}

export interface StringInput<T extends readonly string[] = readonly string[]>
  extends BaseInput {
  type: "string";
  default?: string;
  options?: T;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export interface NumberInput<T extends readonly number[] = readonly number[]>
  extends BaseInput {
  type: "number";
  default?: number;
  options?: T;
  min?: number;
  max?: number;
}

export interface BooleanInput extends BaseInput {
  type: "boolean";
  default?: boolean;
}

export interface DateInput extends BaseInput {
  type: "date";
  default?: Date;
  min?: Date;
  max?: Date;
}

export interface ArrayInput extends BaseInput {
  type: "array";
  items: Input;
  minLength?: number;
  maxLength?: number;
}

export interface ObjectInput extends BaseInput {
  type: "object";
  defaultValue?: Record<string, unknown>;
  properties: Record<string, Input>;
}

// Union type - must remain as type alias
export type Input =
  | StringInput
  | NumberInput
  | BooleanInput
  | DateInput
  | ArrayInput
  | ObjectInput;

// Helper types for handling required/optional properties
type RequiredKeys<P extends Record<string, Input>> = {
  [K in keyof P]: P[K] extends { required: true } ? K : never;
}[keyof P];

type OptionalKeys<P extends Record<string, Input>> = {
  [K in keyof P]: P[K] extends { required: true } ? never : K;
}[keyof P];

type Prettify<T> = { [K in keyof T]: T[K] } & {};

// Infer TypeScript type from schema
export type InferedInput<T extends Input> = T extends {
  type: "string";
  options: infer O extends readonly string[];
}
  ? O[number]
  : T extends { type: "string" }
  ? string
  : T extends { type: "number"; options: infer O extends readonly number[] }
  ? O[number]
  : T extends { type: "number" }
  ? number
  : T extends { type: "boolean" }
  ? boolean
  : T extends { type: "date" }
  ? Date
  : T extends { type: "array"; items: infer I extends Input }
  ? InferedInput<I>[]
  : T extends {
      type: "object";
      properties: infer P extends Record<string, Input>;
    }
  ? Prettify<
      { [K in RequiredKeys<P>]: InferedInput<P[K]> } & {
        [K in OptionalKeys<P>]?: InferedInput<P[K]>;
      }
    >
  : never;

// Validation result types
export interface ValidationError {
  path: string;
  message: string;
}

// Discriminated union - must remain as type alias
export type ValidationResult =
  | { success: true; data: unknown }
  | { success: false; errors: ValidationError[] };
