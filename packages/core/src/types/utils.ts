/**
 * Type utilities for AI Kit
 * Provides branded types, type guards, and utility types for type-safe development
 */

// ============================================================================
// Branded Types
// ============================================================================

/**
 * Creates a branded type to prevent accidental mixing of similar primitive types
 */
declare const brand: unique symbol;

export type Brand<T, TBrand extends string> = T & { readonly [brand]: TBrand };

/**
 * User identifier - branded string to prevent mixing with other IDs
 */
export type UserId = Brand<string, 'UserId'>;

/**
 * Session identifier - branded string for session management
 */
export type SessionId = Brand<string, 'SessionId'>;

/**
 * Message identifier - branded string for message tracking
 */
export type MessageId = Brand<string, 'MessageId'>;

/**
 * Agent identifier - branded string for agent identification
 */
export type AgentId = Brand<string, 'AgentId'>;

/**
 * Model identifier - branded string for AI model identification
 */
export type ModelId = Brand<string, 'ModelId'>;

/**
 * Tool identifier - branded string for tool identification
 */
export type ToolId = Brand<string, 'ToolId'>;

/**
 * Conversation identifier - branded string for conversation tracking
 */
export type ConversationId = Brand<string, 'ConversationId'>;

/**
 * Timestamp in milliseconds - branded number for time values
 */
export type Timestamp = Brand<number, 'Timestamp'>;

/**
 * Helper function to create branded IDs
 */
export function createBrandedId<T extends string>(
  value: string,
  _brand?: T
): Brand<string, T> {
  return value as Brand<string, T>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Makes all properties in T deeply partial
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Makes all properties in T deeply readonly
 */
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

/**
 * Makes all properties in T deeply required
 */
export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>;
    }
  : T;

/**
 * Requires at least one property from Keys to be present
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Requires exactly one property from Keys to be present
 */
export type RequireExactlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, never>>;
  }[Keys];

/**
 * Makes specified properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specified properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * Extracts keys of T where the value is of type V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Makes properties K mutable (removes readonly)
 */
export type Mutable<T, K extends keyof T = keyof T> = Omit<T, K> & {
  -readonly [P in K]: T[P];
};

/**
 * Creates a union of all possible paths through an object
 */
export type Paths<T, D extends number = 3> = [D] extends [never]
  ? never
  : T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | (Paths<T[K], Prev[D]> extends infer R ? `${K}.${R & string}` : never)
        : never;
    }[keyof T]
  : never;

type Prev = [never, 0, 1, 2, 3, ...0[]];

/**
 * Gets the value type at a given path in an object
 */
export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

/**
 * Converts union type to intersection type
 */
export type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Gets the last element of a union type
 */
export type LastOf<T> = UnionToIntersection<
  T extends unknown ? () => T : never
> extends () => infer R
  ? R
  : never;

/**
 * Converts a union to a tuple
 */
export type UnionToTuple<T, L = LastOf<T>> = [T] extends [never]
  ? []
  : [...UnionToTuple<Exclude<T, L>>, L];

/**
 * Non-nullable version of T
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Nullable version of T
 */
export type Nullable<T> = T | null;

/**
 * Maybe version of T (nullable or undefined)
 */
export type Maybe<T> = T | null | undefined;

/**
 * Awaited type - extracts the type a Promise resolves to
 */
export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

/**
 * JSON-serializable types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Ensures a type is JSON-serializable
 */
export type Jsonable<T> = T extends JsonValue
  ? T
  : T extends { toJSON(): infer R }
  ? R
  : never;

/**
 * Extracts all string literal types from a type
 */
export type StringLiteral<T> = T extends string
  ? string extends T
    ? never
    : T
  : never;

/**
 * Extracts all number literal types from a type
 */
export type NumberLiteral<T> = T extends number
  ? number extends T
    ? never
    : T
  : never;

/**
 * Makes a type writable (removes readonly at all levels)
 */
export type Writable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * Ensures a function type
 */
export type Fn<Args extends unknown[] = unknown[], R = unknown> = (
  ...args: Args
) => R;

/**
 * Ensures an async function type
 */
export type AsyncFn<Args extends unknown[] = unknown[], R = unknown> = (
  ...args: Args
) => Promise<R>;

/**
 * Extracts the parameters of a function type
 */
export type FunctionParams<T> = T extends (...args: infer P) => unknown
  ? P
  : never;

/**
 * Extracts the return type of a function
 */
export type FunctionReturn<T> = T extends (...args: unknown[]) => infer R
  ? R
  : never;

/**
 * Creates a type with all properties set to undefined
 */
export type AllUndefined<T> = {
  [P in keyof T]: undefined;
};

/**
 * Flattens nested Pick types
 */
export type FlatPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Creates a strict version of Omit that ensures keys exist
 */
export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Creates a strict version of Pick that ensures keys exist
 */
export type StrictPick<T, K extends keyof T> = Pick<T, K>;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Type guard to check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Type guard to check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if value is an object (excluding null and arrays)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if value is a function
 */
export function isFunction(value: unknown): value is Fn {
  return typeof value === 'function';
}

/**
 * Type guard to check if value is a Promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise ||
    (isObject(value) &&
      'then' in value &&
      typeof value['then'] === 'function')
  );
}

/**
 * Type guard to check if value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown,
  property: K
): value is Record<K, unknown> {
  return isObject(value) && property in value;
}

/**
 * Type guard to check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

/**
 * Type guard to check if value is a non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return isArray<T>(value) && value.length > 0;
}

/**
 * Type guard to check if value is JSON-serializable
 */
export function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;

  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (type === 'object') {
    return Object.values(value as object).every(isJsonValue);
  }

  return false;
}

/**
 * Type predicate to filter null/undefined values from arrays
 */
export function notNullish<T>(value: T | null | undefined): value is T {
  return !isNullish(value);
}

// ============================================================================
// Assertion Functions
// ============================================================================

/**
 * Asserts that a condition is true, throwing an error otherwise
 */
export function assert(
  condition: unknown,
  message = 'Assertion failed'
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Asserts that a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value must be defined'
): asserts value is T {
  if (!isDefined(value)) {
    throw new Error(message);
  }
}

/**
 * Asserts that a value is a string
 */
export function assertString(
  value: unknown,
  message = 'Value must be a string'
): asserts value is string {
  if (!isString(value)) {
    throw new Error(message);
  }
}

/**
 * Asserts that a value is a number
 */
export function assertNumber(
  value: unknown,
  message = 'Value must be a number'
): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(message);
  }
}

/**
 * Asserts that a value is an object
 */
export function assertObject(
  value: unknown,
  message = 'Value must be an object'
): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new Error(message);
  }
}

/**
 * Asserts that a value is never reached (useful for exhaustive checks)
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(
    message ?? `Unexpected value: ${JSON.stringify(value)}`
  );
}

// ============================================================================
// Nominal Types
// ============================================================================

/**
 * Creates a nominal type that is distinct from its base type
 */
export type Nominal<T, Name extends string> = T & {
  readonly __nominal: Name;
};

/**
 * Email address - nominal string type
 */
export type Email = Nominal<string, 'Email'>;

/**
 * URL - nominal string type
 */
export type Url = Nominal<string, 'Url'>;

/**
 * ISO 8601 date string - nominal string type
 */
export type ISODateString = Nominal<string, 'ISODateString'>;

/**
 * UUID - nominal string type
 */
export type UUID = Nominal<string, 'UUID'>;

/**
 * Positive integer - nominal number type
 */
export type PositiveInt = Nominal<number, 'PositiveInt'>;

/**
 * Non-negative integer - nominal number type
 */
export type NonNegativeInt = Nominal<number, 'NonNegativeInt'>;

// ============================================================================
// Discriminated Unions
// ============================================================================

/**
 * Helper to create discriminated union types
 */
export type DiscriminatedUnion<
  K extends string,
  T extends Record<K, string>
> = T;

/**
 * Extracts a specific variant from a discriminated union
 */
export type ExtractVariant<
  Union,
  Discriminator extends string,
  Value extends string
> = Extract<Union, Record<Discriminator, Value>>;

/**
 * Gets all possible values of a discriminator field
 */
export type DiscriminatorValues<
  Union,
  Discriminator extends string
> = Union extends Record<Discriminator, infer V> ? V : never;

// ============================================================================
// Result Type (for error handling)
// ============================================================================

/**
 * Success result type
 */
export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * Failure result type
 */
export interface Failure<E = Error> {
  readonly success: false;
  readonly error: E;
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Creates a success result
 */
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * Creates a failure result
 */
export function failure<E = Error>(error: E): Failure<E> {
  return { success: false, error };
}

/**
 * Type guard for success results
 */
export function isSuccess<T, E>(
  result: Result<T, E>
): result is Success<T> {
  return result.success;
}

/**
 * Type guard for failure results
 */
export function isFailure<T, E>(
  result: Result<T, E>
): result is Failure<E> {
  return !result.success;
}

// ============================================================================
// Option Type (for nullable values)
// ============================================================================

/**
 * Some value type
 */
export interface Some<T> {
  readonly kind: 'some';
  readonly value: T;
}

/**
 * None value type
 */
export interface None {
  readonly kind: 'none';
}

/**
 * Option type for values that may not exist
 */
export type Option<T> = Some<T> | None;

/**
 * Creates a Some option
 */
export function some<T>(value: T): Some<T> {
  return { kind: 'some', value };
}

/**
 * Creates a None option
 */
export function none(): None {
  return { kind: 'none' };
}

/**
 * Type guard for Some options
 */
export function isSome<T>(option: Option<T>): option is Some<T> {
  return option.kind === 'some';
}

/**
 * Type guard for None options
 */
export function isNone<T>(option: Option<T>): option is None {
  return option.kind === 'none';
}

/**
 * Converts a nullable value to an Option
 */
export function fromNullable<T>(value: T | null | undefined): Option<T> {
  return isDefined(value) ? some(value) : none();
}

/**
 * Converts an Option to a nullable value
 */
export function toNullable<T>(option: Option<T>): T | null {
  return isSome(option) ? option.value : null;
}
