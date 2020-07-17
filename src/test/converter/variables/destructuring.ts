/**
 * Destructuring objects.
 */
export const { destructObjectA, destructObjectB, destructObjectC } = {
  destructObjectA: 0,
  destructObjectB: "string",
  destructObjectC: 0,
};

/**
 * Destructuring arrays.
 */
export const [destructArrayA, destructArrayB, destructArrayC = 10] = [
  0,
  "string",
  0,
];

/**
 * Array Destructuring with rest
 */
export const [
  destructArrayWithRestA,
  destructArrayWithRestB,
  ...destructArrayWithRest
] = [1, 2, 3, 4];

/**
 * Array Destructuring with ignores
 */
export const [destructArrayWithIgnoresA, , ...destructArrayWithIgnoresRest] = [
  1,
  2,
  3,
  4,
];

/**
 * Destructuring function parameters.
 */
export function drawText({
  text = "",
  location: [x, y] = [0, 0],
  bold = false,
}) {}
