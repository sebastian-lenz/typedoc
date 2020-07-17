/**
 * This is a simple enumeration.
 */
export enum SimpleEnum {
  /**
   * This is the first enum member.
   */
  EnumValue1 = 1,

  /**
   * This is the second enum member.
   */
  EnumValue2 = 2,

  /**
   * This is the third enum member.
   */
  EnumValue3 = 4,
}

/**
 * This is an enumeration extended by a module.
 */
export enum ModuleEnum {
  /**
   * This is the first enum member.
   */
  EnumValue1 = 1,

  /**
   * This is the second enum member.
   */
  EnumValue2 = 2,

  /**
   * This is the third enum member.
   */
  EnumValue3 = 4,
}

/**
 * This is a module extending an enumeration.
 */
export namespace ModuleEnum {
  /**
   * This is a variable appended to an enumeration.
   */
  export let enumValue: string;

  /**
   * This is a function appended to an enumeration.
   */
  export function enumFunction() {}
}

/**
 * This is a const enum.
 */
export const enum ConstEnum {
  a = 1,
  b = a + 1,
}
