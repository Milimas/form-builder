// Base input type definitions
export type StringInput = {
  type: "string";
  default?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  required?: boolean;
};

export type NumberInput = {
  type: "number";
  default?: number;
  min?: number;
  max?: number;
  required?: boolean;
};

export type BooleanInput = {
  type: "boolean";
  default?: boolean;
  required?: boolean;
};

export type DateInput = {
  type: "date";
  default?: Date;
  min?: Date;
  max?: Date;
  required?: boolean;
};

export type ArrayInput = {
  type: "array";
  items: Input;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
};

export type ObjectInput = {
  type: "object";
  properties: Record<string, Input>;
  required?: boolean;
};

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
export type InferedInput<T extends Input> = T extends { type: "string" }
  ? string
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
export type ValidationError = {
  path: string;
  message: string;
};


export type ValidationResult =
  | { success: true; data: unknown }
  | { success: false; errors: ValidationError[] };

