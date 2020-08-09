import { stringifyType } from '../../stringifiers';

/**
 * Base class of all type definitions.
 *
 * Instances of this class are also used to represent the type `void`.
 */
export abstract class Type {

    /**
     * The type name identifier.
     */
    readonly type: string = 'void';

    /**
     * Clone this type.
     *
     * @return A clone of this type.
     */
    abstract clone(): Type;

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: Type): boolean {
        return false;
    }

    /**
     * Return a string representation of this type.
     */
    toString(): string {
        return stringifyType(this);
    }

    /**
     * Test whether the two given list of types contain equal types.
     *
     * @param a
     * @param b
     */
    static isTypeListSimilar(a: Type[], b: Type[]): boolean {
        if (a.length !== b.length) {
            return false;
        }
        outerLoop: for (let an = 0, count = a.length; an < count; an++) {
            const at = a[an];
            for (let bn = 0; bn < count; bn++) {
                if (b[bn].equals(at)) {
                    continue outerLoop;
                }
            }

            return false;
        }

        return true;
    }

    /**
     * Test whether the two given list of types are equal.
     *
     * @param a
     * @param b
     */
    static isTypeListEqual(a: Type[], b: Type[]): boolean {
        if (a.length !== b.length) {
            return false;
        }
        for (let index = 0, count = a.length; index < count; index++) {
            if (!a[index].equals(b[index])) {
                return false;
            }
        }

        return true;
    }
}
