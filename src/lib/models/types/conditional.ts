import { Type } from './abstract';

/**
 * Represents a conditional type.
 *
 * ~~~
 * let value: C extends E ? T : F;
 * let value2: Check extends Extends ? True : False;
 * ~~~
 */
export class ConditionalType extends Type {
    /**
     * The type name identifier.
     */
    readonly type: string = 'conditional';

    constructor(
        public checkType: Type,
        public extendsType: Type,
        public trueType: Type,
        public falseType: Type
    ) {
        super();
    }

    /**
     * Clone this type.
     *
     * @return A clone of this type.
     */
    clone(): Type {
        return new ConditionalType(this.checkType, this.extendsType, this.trueType, this.falseType);
    }

    /**
     * Test whether this type equals the given type.
     *
     * @param type  The type that should be checked for equality.
     * @returns TRUE if the given type equals this type, FALSE otherwise.
     */
    equals(type: any): boolean {
        if (!(type instanceof ConditionalType)) {
            return false;
        }
        return this.checkType.equals(type.checkType) &&
            this.extendsType.equals(type.extendsType) &&
            this.trueType.equals(type.trueType) &&
            this.falseType.equals(type.falseType);
    }
}
