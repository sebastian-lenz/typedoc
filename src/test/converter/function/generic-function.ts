/**
 * Generic function short text.
 * @param T      Generic function type parameter.
 * @param value  Generic function parameter.
 * @returns      Generic function return value.
 */
function genericFunction<T extends Object>(value: T): T {
  return value;
}

/**
 * A function with a generic type array parameter.
 *
 * @param param A generic parameter.
 * @param params A generic array parameter.
 * @returns A generic array.
 */
function functionWithGenericArrayParameter<T>(param: T, params: T[]): T[] {
  return params;
}

/**
 * @param param this describes param
 * @template T this describes T
 */
function functionWithTemplate<T>(param: T): T {
  return param;
}

export {};
