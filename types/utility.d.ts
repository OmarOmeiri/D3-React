type primitive = string | number | boolean | undefined | null;

type ValueOf<T> = T[keyof T];

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

type Primitives = string | number | boolean | symbol

// expands object types one level deep
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// expands object types recursively
type ExpandRecursively<T> = T extends object
  ? T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
  : T;

type ToString<T> = `${T}`

type PartialNullable<T> = { [P in keyof T]?: T[P] | undefined | null; }


 type NullableK<O, K extends keyof O> =
 { [P in keyof O]: P extends K ? O[P] | null : O[P] };

 type RequiredExcept<T, K extends keyof T> = Expand<Omit<{
  [P in keyof T]-?: T[P];
}, K> & {
  [P in K]: T[P];
}>;

type Cast<X, Y> = X extends Y ? X : Y

type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true