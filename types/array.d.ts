/**
 * Returns true if is array
 */
type IsArrayType<T> = T extends (infer E)[] ? true : false;

/**
 * Creates a union type of all types inside an array
 */
type ElementType < T extends ReadonlyArray < unknown > > = T extends ReadonlyArray<
  infer ElementType
>
  ? ElementType
  : never


type ArrayOfType<T> = T extends ReadonlyArray<
  infer ElementType
>
  ? ElementType[]
  : never

type TypeOrArrayOfType<T> = T | T[]

type ArrayElement<A> = A extends readonly (infer T)[]
? T
: never

type UnionToArray<T, A extends unknown[] = []> = IsUnion<T> extends true
  ? UnionToArray<Exclude<T, PopUnion<T>>, [PopUnion<T>, ...A]>
  : [T, ...A];