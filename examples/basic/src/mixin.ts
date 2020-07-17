// Note: This is a copy of the mixin test case for the converter.

/**
 * Any function
 */
export type AnyFunction<A = any> = (...input: any[]) => A;

/**
 * Any constructor function
 */
export type AnyConstructor<A = object> = new (...input: any[]) => A;

/**
 * Mixin type helper
 */
export type Mixin<T extends AnyFunction> = InstanceType<ReturnType<T>>;

/**
 * Base class
 */
export class Base {
  baseProperty = "init";

  baseMethod(): number {
    return 42;
  }
}

/**
 * The "mixin function" of the Mixin1
 */
export const Mixin1Func = <T extends AnyConstructor<Base>>(base: T) =>
  /**
   * Internal class of the Mixin1
   */
  class Mixin1Class extends base {
    property1 = "init";

    method1(arg: Mixin1Type): Mixin1Type[] {
      return [arg, this];
    }
  };

/**
 * The "instance type" of the Mixin1 using the interface notation (supports recursive type definition)
 */
export interface Mixin1Type extends Mixin<typeof Mixin1Func> {}

/**
 * The "mixin function" of the Mixin2
 */
export const Mixin2 = <T extends AnyConstructor<Mixin1Type & Base>>(base: T) =>
  /**
   * Internal class of the Mixin2
   */
  class Mixin2 extends base {
    property2 = "init";

    method2(arg: Mixin2): Mixin2[] {
      return [arg, this];
    }
  };

/**
 * The "instance type" of the Mixin2 using the interface notation (supports recursive type definition)
 */
export interface Mixin2 extends Mixin<typeof Mixin2> {}

/**
 * The "mixin function" of the Mixin3
 */
export const Mixin3 = <T extends AnyConstructor<object>>(base: T) =>
  /**
   * Internal class of the Mixin3
   */
  class Mixin3 extends base {};

/**
 * The "instance type" of the Mixin3 using the regular type notation (does not work well for recursive type definition)
 * Is not well supported by the TypeDoc
 */
export type Mixin3 = Mixin<typeof Mixin3>;

/**
 * Class that inherits from Base and consumes Mixin1 and Mixin2, in order.
 */
export class SomeClassWithMixin extends Mixin2(Mixin1Func(Base)) {
  classWithMixinProperty = "init";

  classWithMixinMethod(): string {
    return "42";
  }
}
