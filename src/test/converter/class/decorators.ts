/**
 * A decorated class.
 */
@decoratorWithOptions({
  name: "Name of class",
})
class DecoratedClass {
  /**
   * A decorated method.
   */
  @decoratorAtom
  @decoratorWithParam(false)
  decoratedMethod() {}
}

/**
 * A decorator with no options.
 */
function decoratorAtom(
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<any>
) {
  target[propertyKey].writable = true;
}

/**
 * A decorator with a parameter.
 *
 * @param value  The parameter of this decorator.
 */
function decoratorWithParam(value: boolean): MethodDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    target[propertyKey].enumerable = value;
  };
}

/**
 * A decorator consuming an options object.
 *
 * @param options  The options object of this decorator.
 * @param options.name  A property on the options object of this decorator.
 */
function decoratorWithOptions(options: { name: string }): ClassDecorator {
  return function (target) {
    (target as any).options = options;
  };
}

export {};
