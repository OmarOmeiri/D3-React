/* eslint-disable  */
type WithKey<K extends string | number | symbol, T> = {
  [k in K]: T
}

type FlattenByKeys<K extends keyof T, T> = K extends any ?
(T[K] extends object ? {__r: FlattenByKeys<keyof T[K], T[K]>} : WithKey<K, T[K]>):
never;

type FR<T> = T extends {__r: infer U} ? U : T;
type FR10<T> = FR<FR<FR<FR<FR<FR<FR<FR<FR<FR<FR<T>>>>>>>>>>>;

type UnionToIntersection<U> =
(U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never

type Pretty<T> = {
[K in keyof T] : T[K]
}



/*

type Test = {
  a: number;
  b: number;
  x: number;
  y: number;
  l: string;
  m: string;
}

*/
type RecursiveFlatten<O extends Record<string, unknown>> = Pretty<UnionToIntersection<FR10<FlattenByKeys<keyof O, O>>>>;
