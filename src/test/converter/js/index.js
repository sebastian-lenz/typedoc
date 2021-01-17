/** */

/**
 * not included anywhere
 * @typedef {Object} InterfaceIsh
 * @property {string} foo docs for property
 * more docs for property
 */

/**
 * @typedef {object} AlsoInterfaceIsh docs for interface
 * @property {string} foo docs for property
 * @prop {string} bar can also use prop tag
 */

/**
 * @typedef {Object} ObjectAlias type alias since it doesn't have a property tag
 */

/**
 * @typedef {string | number} UnionType docs for alias
 * @typedef {{ x: string } & { y: number }} IntersectionType docs for alias
 */

/**
 * @callback NoReturnTag even though in the same comment block
 * @callback HasReturnTag
 * @returns {string}
 */

/**
 * @template T
 * @callback IdentityFn
 * @param {T} data
 * @return {T} the data
 */

/**
 * @callback OptionalArg
 * @param {string} [data] an optional argument
 */

/**
 * @template T comment on template
 * @typedef {T} Identity comment on alias
 */

/**
 * @callback Foo
 * @param {...string} args
 * @returns {number}
 */

/** @type {Foo} */
export const usedFoo = () => 1;

/** @enum {string} */
export const ColumnType = {
    STRING: "string",
    NUMBER: "number",
};
