/**
 * This is a simple Enumeration.
 */
export enum Directions {
  /**
   * A simple enum member.
   */
  Top,

  /**
   * A simple enum member.
   */
  Right,

  /**
   * A simple enum member.
   */
  Bottom,

  /**
   * A simple enum member.
   */
  Left,

  /**
   * A composite enum member.
   */
  TopLeft = Top | Left,

  /**
   * A composite enum member.
   */
  TopRight = Top | Right,
}

/**
 * This is a enumeration extended by a module.
 *
 * You should see both the enum members and the module members.
 */
export enum Size {
  /**
   * A simple enum member.
   */
  Small,

  /**
   * A simple enum member.
   */
  Medium,

  /**
   * A simple enum member.
   */
  Large,
}

/**
 * This comment is ignored, as the enumeration is already defined.
 */
export module Size {
  /**
   * A variable that is attached to an enumeration.
   */
  let defaultSize: Size = Size.Medium;

  /**
   * A function that is attached to an enumeration.
   *
   * @param value The value that should be tested.
   * @returns TRUE when the given value equals Size.Small.
   */
  function isSmall(value: Size): boolean {
    return value === Size.Small;
  }
}
