import classes = require("./classes");

/**
 * This is an internal function.
 */
function internalFunction(): void {}

/**
 * This is a simple exported function.
 */
export function exportedFunction(): void {}

/**
 * This is a function with multiple arguments and a return value.
 * @param paramZ  This is a string parameter.
 * @param paramG  This is a parameter flagged with any.
 *     This sentence is placed in the next line.
 *
 * @param paramA
 * This is a **parameter** pointing to an interface.
 *
 * ~~~
 * var value:BaseClass = new BaseClass('test');
 * functionWithArguments('arg', 0, value);
 * ~~~
 *
 */
let variableFunction = function (
  paramZ: string,
  paramG: any,
  paramA: classes.NameInterface
): number {
  return 0;
};

/**
 * This is a function with multiple arguments and a return value.
 * @param paramZ  This is a string parameter.
 * @param paramG  This is a parameter flagged with any.
 *     This sentence is placed in the next line.
 *
 * @param paramA
 * This is a **parameter** pointing to an interface.
 *
 * ~~~
 * var value:BaseClass = new BaseClass('test');
 * functionWithArguments('arg', 0, value);
 * ~~~
 *
 */
export function functionWithArguments(
  paramZ: string,
  paramG: any,
  paramA: classes.NameInterface
): number {
  return 0;
}

/**
 * This is a function with a parameter that is optional.
 *
 * @param requiredParam  A normal parameter.
 * @param optionalParam  An optional parameter.
 */
export function functionWithOptionalValue(
  requiredParam: string,
  optionalParam?: string
) {}

/**
 * This is a function with a parameter that has a default value.
 *
 * @param value  An optional return value.
 * @returns The input value or the default value.
 */
export function functionWithDefaults(
  valueA: string = "defaultValue",
  valueB: number = 100,
  valueC: number = Number.NaN,
  valueD: boolean = true,
  valueE: boolean = false
): string {
  return valueA;
}

/**
 * This is a function with rest parameter.
 *
 * @param rest  Multiple strings.
 * @returns The combined string.
 */
function functionWithRest(...rest: string[]): string {
  return rest.join(", ");
}

/**
 * This is the first signature of a function with multiple signatures.
 *
 * @param value  The name value.
 */
export function multipleSignatures(value: string): string;

/**
 * This is the second signature of a function with multiple signatures.
 *
 * @param value       An object containing the name value.
 * @param value.name  A value of the object.
 */
export function multipleSignatures(value: { name: string }): string;

/**
 * This is the actual implementation, this comment will not be visible
 * in the generated documentation.
 */
export function multipleSignatures(): string {
  if (arguments.length > 0) {
    if (typeof arguments[0] === "object") {
      return arguments[0].name;
    } else {
      return arguments[0];
    }
  }

  return "";
}

/**
 * This is a generic function.
 *
 * @param T  The type parameter.
 * @param value  The typed value.
 * @return  Returns the typed value.
 */
export function genericFunction<T>(value: T): T {
  return value;
}

/**
 * This is a function that is extended by a module.
 *
 * @param arg An argument.
 */
export function moduleFunction(arg: string): string {
  return "";
}

/**
 * This is the module extending the function moduleFunction().
 */
export module moduleFunction {
  /**
   * This variable is appended to a function.
   */
  let functionVariable: string;

  /**
   * This function is appended to another function.
   */
  function append() {}

  /**
   * This function is appended to another function.
   */
  function prepend() {}
}

/**
 * A function that returns an object.
 * Also no type information is given, the object should be correctly reflected.
 */
export function createSomething() {
  return {
    foo: "bar",
    doSomething: (a: number) => a + 1,
    doAnotherThing: () => {},
  };
}

/**
 * See {@linkcode INameInterface} and [INameInterface's name property]{@link INameInterface.name}.
 * Also, check out {@link https://www.google.com|Google} and
 * {@link https://github.com GitHub}.
 *
 * Taken from http://usejsdoc.org/tags-inline-link.html.
 */
export function functionWithDocLink(): void {}
