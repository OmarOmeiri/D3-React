/**
 * Gets the last param type of a rest function paramater.
 */
type Tail<T extends any[]> = ((...args: T) => any) extends (head: any, ...tail: infer I) => any
  ? I : never


/**
 * Gets overloaded functions as INTERSECTION
 *
 */
type OverloadsI<T> =
T extends {
  (...args: infer A1): infer R1; (...args: infer A2): infer R2;
  (...args: infer A3): infer R3; (...args: infer A4): infer R4
} ? [
  (...args: A1) => R1, (...args: A2) => R2,
  (...args: A3) => R3, (...args: A4) => R4
] : T extends {
  (...args: infer A1): infer R1; (...args: infer A2): infer R2;
  (...args: infer A3): infer R3
} ? [
  (...args: A1) => R1, (...args: A2) => R2,
  (...args: A3) => R3
] : T extends {
  (...args: infer A1): infer R1; (...args: infer A2): infer R2
} ? [
  (...args: A1) => R1, (...args: A2) => R2
] : T extends {
  (...args: infer A1): infer R1
} ? [
  (...args: A1) => R1
] : any

/**
 * Gets overloaded function parameters as INTERSECTION
 * 
 * @example
 * interface Emitter {
 *   emit(event: 'event_1'): void;
 *   emit(event: 'event_2'): number;
 *   emit(event: 'event_3'): void;
 *   emit(event: 'event_4'): string;
 * }
 *
 * type EmitterEmitParams = OverloadedParametersI<Emitter["emit"]>
 * // type EmitterEmitParams = [[event: "event_1"], [event: "event_2"], [event: "event_3"], [event: "event_4"]]
 *
 * type EventName =  OverloadedParametersI<Emitter["emit"]>[number][0]
 * // type EventName = "event_1" | "event_2" | "event_3" | "event_4"
 * 
 * const a: EventName = "event_4";
 * const b: EventName = "event_1";
 */
type OverloadedParametersI<T> =
  OverloadsI<T> extends infer O ?
  { [K in keyof O]: Parameters<Extract<O[K], (...args: any) => any>> } : never

  /**
 * Gets overloaded function return type as INTERSECTION
 * 
 * @example
 * interface Emitter {
 *   emit(event: 'event_1'): void;
 *   emit(event: 'event_2'): number;
 *   emit(event: 'event_3'): void;
 *   emit(event: 'event_4'): string;
 * }
 *
 * type EmitterEmitReturn = OverloadedReturnTypeI<Emitter["emit"]>
 * // type EmitterEmitR = [void, number, void, string]
 *
 */
type OverloadedReturnTypeI<T> =
  OverloadsI<T> extends infer O ?
  { [K in keyof O]: ReturnType<Extract<O[K], (...args: any) => any>> } : never

/**
 *  END OVERLOAD AS INTERSECTION
 */


/**
 * Gets overloaded functions as UNION
 */
  type OverloadsU<T extends (...args: any[]) => any> =
  T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4; (...args: infer A5): infer R5; (...args: infer A6): infer R6 } ?
    ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5) | ((...args: A6) => R6)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4; (...args: infer A5): infer R5 } ?
    ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4 } ?
    ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3 } ?
    ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2 } ?
    ((...args: A1) => R1) | ((...args: A2) => R2)
  : T extends { (...args: infer A1): infer R1 } ?
    (...args: A1) => R1
  : never

  /**
 * Gets overloaded function parameters as UNION
 * 
 * @example
 * interface Emitter {
 *   emit(event: 'event_1'): void;
 *   emit(event: 'event_2'): number;
 *   emit(event: 'event_3'): void;
 *   emit(event: 'event_4'): string;
 * }
 *
 * type EmitterEmitParams = OverloadedParametersU<Emitter["emit"]>
 * // type EmitterEmitParams = [event: "event_1"] | [event: "event_2"] | [event: "event_3"] | [event: "event_4"]
 *
 */
type OverloadedParametersU<T extends (...args: any[]) => any> = Parameters<OverloadsU<T>>;

  /**
 * Gets overloaded function retrun types as UNION
 * 
 * @example
 * interface Emitter {
 *   emit(event: 'event_1'): void;
 *   emit(event: 'event_2'): number;
 *   emit(event: 'event_3'): void;
 *   emit(event: 'event_4'): string;
 * }
 *
 * type EmitterEmitReturnType = OverloadedReturnTypeU<Emitter["emit"]>
 * // type EmitterEmitReturnType = string | number | void
 *
 */
type OverloadedReturnTypeU<T extends (...args: any[]) => any> = ReturnType<OverloadsU<T>>;