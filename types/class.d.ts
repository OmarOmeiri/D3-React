type Class<T = any> = (new (...args: any[]) => T) & {prototype: object};

type ClassWithCtor<C = any[], T = any> = (new (...args: C) => T) & {prototype: object};

type ConstructorArgs<T> = T extends new(...args: infer U) => any ? U : never;

type TypeOfClassMethod<T, M extends keyof T> = T[M] extends Function ? T[M] : never;
type TypeOfClassMethods<T> = Exclude<T[keyof T] extends Function ? T[keyof T] : never, never>;

type ClassMethodKeys<C> = NonNullable<KeysOfType<C['prototype'], Function>>;

type ClassProperties<C, OptionalsRequired extends boolean = false> =
  OptionalsRequired extends true
  ? Required<Omit<C['prototype'], ClassMethodKeys<C>>>
  : Omit<C['prototype'], ClassMethodKeys<C>>

type ClassPropertyKeys<C> = Expand<keyof ClassProperties<C, true>>

type FuncKeys<T> = NonNullable<KeysOfType<T, Function>>;
