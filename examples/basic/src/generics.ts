/**
 * A generic function
 *
 * @typeparam T  The generic type parameter.
 * @param value  A generic parameter.
 * @returns A generic return value.
 */
function testFunction<T>(value: T): T {
  return value;
}

/**
 * A generic interface.
 *
 * @param T  The generic type parameter.
 */
interface A<T> {
  /**
   * A generic member function.
   *
   * @return  A generic return value.
   */
  getT(): T;
}

/**
 * A generic interface with two type parameters.
 *
 * @param <T>  The first generic type parameter.
 * @param <C>  The second generic type parameter.
 */
interface B<T, C> {
  /**
   * A generic member function.
   *
   * @param value  A generic parameter.
   */
  setT(value: T): void;

  /**
   * A generic member function.
   *
   * @return  A generic return value.
   */
  getC(): C;
}

/**
 * A generic interface extending two other generic interfaces
 * and setting one of the type parameters.
 *
 * @typeparam T  The leftover generic type parameter.
 */
interface AB<T> extends A<T>, B<T, boolean> {}

/**
 * An interface extending a generic interface and setting its type parameter.
 */
interface ABString extends AB<string> {}

/**
 * An interface extending a generic interface and setting its type parameter.
 */
interface ABNumber extends AB<number> {}

/**
 * A function returning a generic array with type parameters.
 *
 * @return The return value with type arguments.
 */
function getGenericArray(): Array<string> {
  return [""];
}

/**
 * Conditional type with infer
 */
type PopFront<T extends any[]> = ((...args: T) => any) extends (
  a: any,
  ...r: infer R
) => any
  ? R
  : never;

/**
 * See GH#1150. Calling typeChecker.typeToString on this type will send TS into an infinite
 * loop, which is undesirable.
 */
type HorribleRecursiveTypeThatShouldNotBeUsedByAnyone<
  T extends any[],
  R = {}
> = {
  0: R;
  1: HorribleRecursiveTypeThatShouldNotBeUsedByAnyone<
    PopFront<T>,
    {
      [K in keyof R | keyof T[0]]: K extends keyof R ? R[K] : T[0][K];
    }
  >;
}[T["length"] extends 0 ? 0 : 1];
