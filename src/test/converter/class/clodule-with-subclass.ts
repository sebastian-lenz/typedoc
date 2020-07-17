// see https://github.com/TypeStrong/typedoc/issues/869
export class Foo {}
export namespace Foo {
  // merges with static side of class `Foo`
  export const x = 1;
}

export class Bar extends Foo {}
