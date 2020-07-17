/**
 * This class is exported under a different name. The exported name is
 * "ExportedClassName"
 *
 * ```JavaScript
 * export {NotExportedClassName as ExportedClassName};
 * ```
 */
class NotExportedClassName {
  /**
   * Property of NotExportedClassName class.
   */
  public notExportedProperty: string;

  /**
   * This is the constructor of the NotExportedClassName class.
   */
  constructor() {}

  /**
   * Method of NotExportedClassName class.
   */
  public getNotExportedProperty(): string {
    return this.notExportedProperty;
  }
}

/**
 * This class is exported via es6 export syntax.
 *
 * ```
 * export default class DefaultExportedClass
 * ```
 */
export default class DefaultExportedClass {
  /**
   * Property of default exported class.
   */
  public exportedProperty: string;

  /**
   * This is the constructor of the default exported class.
   */
  constructor() {}

  /**
   * Method of default exported class.
   */
  public getExportedProperty(): string {
    return this.exportedProperty;
  }
}

// Rename class on export
export { NotExportedClassName as ExportedClassName };
