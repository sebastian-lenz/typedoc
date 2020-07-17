import * as assert from "assert";

/**
 * Create a helper function to split a bitwise combination of a flags enum
 * into an array of discrete numbers.
 * @param upperBound the last member of the enumeration.
 */
export function makeToKindArray(
  upperBound: number
): (kind: number) => number[] {
  return (kind) => {
    const kinds: number[] = [];
    for (let i = 1; i <= upperBound; i *= 2) {
      if (kind & i) {
        kinds.push(i);
      }
    }
    return kinds;
  };
}

/**
 * Create a helper function to return the name of a kind given a bitwise kind TS enum.
 * @param enumObj the enumeration itself.
 */
export function makeToKindString(
  enumObj: Record<number, string | number>
): (kind: number) => string {
  return (kind) => {
    assert(
      Number.isInteger(Math.log2(kind)),
      `Tried to get a kind string for kind ${kind}, which is not an exact kind.`
    );
    const kindString = enumObj[kind];
    assert(
      typeof kindString === "string",
      `Tried to get a kind string for kind ${kind}, but the provided kind does not exist.`
    );
    return kindString[0].toLowerCase() + kindString.substr(1);
  };
}
