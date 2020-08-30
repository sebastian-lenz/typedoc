/** Normal function */
export function fn() {
  return 1;
}

/** Generic identity function. */
export function identity<T = undefined>(arg: T): T {
  return arg;
}
