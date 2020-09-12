/** Generic class */
export class Generic<T extends string = "foo"> {
  property?: T;

  readonly readonlyProp = 5;

  /**
   * Specialized toString method with a stronger type
   */
  toString(): T | "" {
    return this.property ?? "";
  }

  get data() {
    return "";
  }

  set data(_value: string) {
    // nothing
  }
}

/** A basic class */
export class Standard {
  property!: string;

  /** Static method with the same name as an instance method. */
  static setProperty() {}

  /** Static property with the same name as an instance property. */
  static property = "str";

  /** Method with inferred void return type */
  setProperty(value: string) {
    this.property = value;
  }

  get data() {
    return "";
  }
}

// Merged with the above class
export interface Standard {
  propertyDefinedInMergedInterface: string;
}
