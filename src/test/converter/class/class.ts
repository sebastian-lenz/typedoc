/**
 * TestClass comment short text.
 *
 * TestClass comment text.
 *
 * @see [[TestClass]] @ fixtures
 */
export class TestClass {
  /**
   * publicProperty short text.
   */
  public publicProperty: string;

  /**
   * privateProperty short text.
   */
  private privateProperty: number[];

  /**
   * privateProperty short text.
   */
  static staticProperty: TestClass;

  /**
   * Constructor short text.
   */
  constructor() {}

  /**
   * publicMethod short text.
   * @category Test
   */
  public publicMethod() {}

  /**
   * protectedMethod short text.
   * @category Test
   */
  protected protectedMethod() {}

  /**
   * privateMethod short text.
   */
  private privateMethod() {}

  /**
   * staticMethod short text.
   */
  static staticMethod() {}

  /**
   * arrow method
   */
  arrowMethod = () => {};

  get getterOnly() {
    return 1;
  }

  get getterSetter() {
    return 1;
  }
  set getterSetter(value: number) {}

  set setterOnly(value: string) {}
}

export class TestSubClass extends TestClass {
  /**
   * publicMethod short text.
   */
  public publicMethod() {}

  /**
   * protectedMethod short text.
   */
  protected protectedMethod() {}

  /**
   * Constructor short text.
   *
   * @param p1 Constructor param
   * @param p2 Private string property
   * @param p3 Public number property
   * @param p4 Public implicit any property
   */
  constructor(p1, private p2: string, public p3: number, public p4) {
    super();
  }
}

export abstract class TestAbstractClass {
  abstract myAbstractProperty: string;

  protected abstract myAbstractMethod(): void;
}

export class TestAbstractClassImplementation extends TestAbstractClass {
  myAbstractProperty: string;

  protected myAbstractMethod(): void {}
}

export interface TestSubClass {
  /**
   * mergedMethod short text.
   */
  mergedMethod();
}

export module TestSubClass {
  /**
   * staticMergedMethod short text.
   */
  export function staticMergedMethod() {}
}

const x = "literal";

export class ComputedNames {
  [Symbol.toStringTag] = "computed";
  [x] = true;
  ["literal2"] = true;
  y = false;
}

export class Ts38PrivateFields {
  /** Docs */
  #foo = 1;
}
