/**
 * This class is not exported.
 */
class NotExportedClass {
  /**
   * Property of not exported class.
   */
  public notExportedProperty: string;

  /**
   * This is the constructor of the not exported class.
   */
  constructor() {}

  /**
   * Method of not exported class.
   */
  public getNotExportedProperty(): string {
    return this.notExportedProperty;
  }
}

/**
 * This class is exported by being assigned to ´export´.
 *
 * ~~~
 * export = SingleExportedClass;
 * ~~~
 */
class SingleExportedClass {
  /**
   * Property of exported class.
   */
  public exportedProperty: string;

  /**
   * This is the constructor of the exported class.
   */
  constructor() {}

  /**
   * Method of exported class.
   */
  public getExportedProperty(): string {
    return this.exportedProperty;
  }
}

/**
 * The export statement.
 */
export = SingleExportedClass;
