/**
 * First type for union or intersection type tests.
 */
export interface FirstType {
  /**
   * Property of first type.
   */
  firstProperty: string;
}

/**
 * Second type for union or intersection type tests.
 */
export interface SecondType {
  /**
   * Property of second type.
   */
  secondProperty: number;
}

/**
 * Third type for union or intersection type tests.
 */
export interface ThirdType {
  /**
   * Union Property of third type.
   */
  thirdUnionProperty: FirstType | SecondType;

  /**
   * Intersection Property of third type.
   */
  thirdIntersectionProperty: FirstType & ThirdType;

  /**
   * Complex Property of third type.
   */
  thirdComplexProperty: ((FirstType & SecondType)[] | string)[];
}
