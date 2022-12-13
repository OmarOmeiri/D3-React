/**
 * Extracts a generic type
 */
type TypeWithGeneric<T> = T[]
type ExtractGeneric<Type> = Type extends TypeWithGeneric<infer X> ? X : never
type ExtractedGeneric<T> = ExtractGeneric<TypeWithGeneric<T>>

