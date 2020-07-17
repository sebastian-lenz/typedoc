/**
 * Helper function to wrap stringified types with parenthesis.
 * @param wrapped
 * @param text
 * @internal
 */
export function wrap(wrapped: boolean, text: string) {
  return wrapped ? `(${text})` : text;
}

/**
 * Helper to clone all types in an array.
 * @param arr
 */
export function cloned<T extends { clone(): T }>(arr: T[]) {
  return arr.map((item) => item.clone());
}
