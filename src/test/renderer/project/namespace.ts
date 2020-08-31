/** A namespace */
export namespace NS {
  /** A variable within the namespace */
  export const a = true;

  /**
   * Namespaces can be nested, and should still produce valid links.
   */
  export namespace Nested {
    export const b = false;
  }
}
