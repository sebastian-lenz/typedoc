const x = "literal";
/**
 * An object literal.
 */
const objectLiteral = {
  valueZ: "foo",
  valueY: function () {
    return "foo";
  },
  valueX: {
    valueZ: "foo",
    valueY: (z: string) => {
      return { a: "test", b: z };
    },
    valueA: [100, 200, 300],
  },
  valueA: 100,
  valueB: true,
  [Symbol.toStringTag]: "computed",
  [x]: true,
  ["literal2"]: true,
};

/**
 * A typed literal without an initializer.
 */
let typeLiteral: {
  valueZ: string;
  valueY: { (): string };
  valueX: {
    valueZ: string;
    valueY: { (z: string): { a: string; b: string } };
    valueA: number[];
  };
  valueA?: number;
  valueB?: boolean;
};

const recursive = {
  property: () => recursive,
};

export { objectLiteral, recursive, typeLiteral, x };
