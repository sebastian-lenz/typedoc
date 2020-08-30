/** Generic class */
export class Generic<T extends string = "foo"> {
  property?: T;

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
