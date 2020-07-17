/**
 * This is a simple interface.
 *
 * Links - these should all point to the name property:
 * - {@link name}
 * - {@link NameInterface.name}
 * - {@link "classes".NameInterface.name}
 * - {@link name Text} &lt;-- This one goes away eventually
 * - {@link name|Text}
 * - {@link name | Text}
 * - {@link NameInterface.name | Text}
 */
export interface NameInterface {
  /**
   * This is a interface member of INameInterface.
   *
   * It should be inherited by all subinterfaces.
   *
   * Links - these should all point to this property:
   * - {@link name}
   * - {@link NameInterface.name}
   * - {@link "classes".NameInterface.name}
   * - {@link name Text} &lt;-- This one goes away eventually
   * - {@link name|Text}
   * - {@link name | Text}
   * - {@link NameInterface.name | Text}
   *
   * Links - these should point to the containing interface
   * - {@link NameInterface}
   * - {@link "classes".NameInterface}
   */
  name: string;

  /**
   * This is a interface function of INameInterface.
   *
   * It should be inherited by all subinterfaces.
   */
  getName(): string;
}

/**
 * This is a simple interface.
 */
export interface PrintInterface {
  /**
   * This is a interface function of IPrintInterface
   *
   * It should be inherited by all subinterfaces.
   */
  print(value: string): void;
}

/**
 * This is a interface inheriting from two other interfaces.
 */
export interface PrintNameInterface extends NameInterface, PrintInterface {
  /**
   * This is a interface function of IPrintNameInterface
   */
  printName(): void;
}

/**
 * This is a simple base class.
 *
 * [[include:class-example.md]]
 *
 * Links:
 * - {@link name | The name property on this class}
 * - {@link NameInterface.name | The name property we inherit from the interface}
 */
export abstract class BaseClass implements NameInterface {
  /**
   * This is a simple public member.
   */
  public name: string;

  /**
   * This is a simple protected member.
   */
  protected kind: number;

  /**
   * This is a static member.
   *
   * Static members should not be inherited.
   */
  static instance: BaseClass;
  static instances: BaseClass[];

  /**
   * This is an instance member of an internal class.
   */
  private internalClass: InternalClass<keyof BaseClass>;

  constructor(name: string);
  constructor(source: BaseClass);
  constructor() {
    if (arguments.length > 0) {
      if (typeof arguments[0] === "string") {
        this.name = arguments[0];
      } else if (arguments[0] instanceof BaseClass) {
        this.name = arguments[0].name;
      }
    }

    this.checkName();
  }

  public abstract abstractMethod(): void;

  /**
   * This is a simple member function.
   *
   * It should be inherited by all subclasses. This class has a static
   * member with the same name, both should be documented.
   *
   * @returns Return the name.
   */
  public getName(): string {
    return this.name;
  }

  /**
   * This is a simple static member function.
   *
   * Static functions should not be inherited. This class has a
   * member with the same name, both should be documented.
   *
   * @returns Return the name.
   */
  static getName(): string {
    return "A name";
  }

  /**
   * This is a simple member function.
   *
   * It should be inherited by all subclasses.
   *
   * @param name The new name.
   */
  public setName(name: string) {
    this.name = name;
    this.checkName();
  }

  /**
   * This is a simple fat arrow function.
   *
   * @param param1 The first parameter needed by this function.
   * @param param2 The second parameter needed by this function.
   * @see https://github.com/sebastian-lenz/typedoc/issues/37
   */
  public arrowFunction = (param2: string, param1: number): void => {};

  /**
   * This is a private function.
   */
  private checkName() {
    return true;
  }

  /**
   * This is a static function.
   *
   * Static functions should not be inherited.
   *
   * @returns An instance of BaseClass.
   */
  static getInstance(): BaseClass {
    return BaseClass.instance;
  }

  /**
   * @see https://github.com/sebastian-lenz/typedoc/issues/42
   */
  public static caTest(
    originalValues: BaseClass,
    newRecord: any,
    fieldNames: string[],
    mandatoryFields: string[]
  ): string {
    let returnval = "";
    let updates: string[] = [];
    let allFields: string[] = fieldNames;
    for (let j = 0; j < allFields.length; j++) {
      let field = allFields[j];
      let oldValue = originalValues[field];
      let newValue = newRecord[field];
    }
    return returnval;
  }
}

/**
 * This is an internal class, it is not exported.
 */
class InternalClass<TTT extends keyof BaseClass> {
  constructor(options: { name: string }) {}
}

/**
 * This is a class that extends another class.
 *
 * This class has no own constructor, so its constructor should be inherited
 * from BaseClass.
 */
export class SubClassA extends BaseClass implements PrintNameInterface {
  public name: string;

  /**
   * This is a simple interface function.
   */
  public print(value: string): void {}

  /**
   * @inheritdoc
   */
  public printName(): void {
    this.print(this.getName());
  }

  /**
   * Returns the name. See [[BaseClass.name]].
   *
   * @returns The return value.
   */
  public get nameProperty(): string {
    return this.name;
  }

  /**
   * Sets the name. See [[BaseClass.name]].
   *
   * @param value The new name.
   * @returns The return value.
   */
  public set nameProperty(value: string) {
    this.name = value;
  }

  /**
   * Returns the name. See [[BaseClass.name]].
   *
   * @returns The return value.
   */
  public get readOnlyNameProperty(): string {
    return this.name;
  }

  /**
   * Sets the name. See [[BaseClass.name]].
   *
   * @param value The new name.
   * @returns The return value.
   */
  public set writeOnlyNameProperty(value: string) {
    this.name = value;
  }

  public abstractMethod(): void {}
}

/**
 * This is a class that extends another class.
 *
 * The constructor of the original class should be overwritten.
 */
export class SubClassB extends BaseClass {
  public name: string;

  constructor(name: string) {
    super(name);
  }

  abstractMethod(): void {}

  doSomething(value: [string, SubClassA, SubClassB]) {}
}

/**
 * This is a generic class.
 *
 * @param T  This a type parameter.
 */
export class GenericClass<T extends BaseClass> {
  public value: T;

  /**
   * Constructor short text.
   *
   * @param p1 Constructor param
   * @param p2 Private string property
   * @param p3 Public number property
   * @param p4 Public implicit any property
   * @param p5 Readonly property
   */
  constructor(
    p1,
    protected p2: T,
    public p3: number,
    private p4: number,
    readonly p5: string
  ) {}

  /**
   * @param value [[getValue]] is the counterpart.
   */
  public setValue(value: T) {
    this.value = value;
  }

  public getValue(): T {
    return this.value;
  }
}

/**
 * This a non generic class derived from a [[GenericClass|generic class]].
 */
export class NonGenericClass extends GenericClass<SubClassB> {}
