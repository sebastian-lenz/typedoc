/**
 * A class with constructor properties.
 */
export class Vector2 {
  /**
   * @param x  X component of the Vector
   * @param y  Y component of the Vector
   * @param name Vector name
   */
  constructor(public x: number, public y: number, readonly name: string) {}
}

/**
 * A class with inherited and overwritten constructor properties.
 */
export class Vector3 extends Vector2 {
  /**
   * @param x  X component of the Vector
   * @param y  Y component of the Vector
   * @param z  Z component of the Vector
   * @param name Vector name
   */
  constructor(
    x: number,
    public y: number,
    public z: number,
    readonly name: string
  ) {
    super(x, y, name);
  }
}
