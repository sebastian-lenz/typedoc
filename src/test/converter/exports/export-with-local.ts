export const x = 5;

export function add(x: number, y: number) {
  return x + y;
}

// Add a local var/function to make sure typedoc won't choke
// if excludeNotExported is true
let localVar = "local";

function times(x: number, y: number) {
  return x * y;
}
