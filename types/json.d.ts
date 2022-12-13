/**
 * Extends JSON.parse and JSON.stringify to be typed
 */
interface JSON {
  // stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string;
  stringify<T>(value: T, replacer?: (key: string, value: any) => any, space?: string | number): string & Stringified<T>;
  // parse(text: string, reviver?: (key: any, value: any) => any): any;
  parse<T>(text: Stringified<T>, reviver?: (key: string, value: any) => any): T;
}

/**
 * Creates a typed JSON.stringifiy
 */
type Stringified<T> = string & {
  [P in keyof T]: { '_ value': T[P] }
};

/**
 * Returns the string from JSON.strigify to its original type
 */
type ParsedJSON<T> = T extends Stringified<infer X> ? X : never;
