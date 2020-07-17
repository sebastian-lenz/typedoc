import ModDefault, { a as b } from "./mod";
import * as Mod from "./mod";
export * from "./mod";

export { b as c, add, Mod, ModDefault };

function add(x: number, y: number) {
  return x + y;
}

// Note that this will show up in the docs, not the default function from mod2.
// export * from './mod2' does *not* re-export the default function.
export default function (a: number) {}
