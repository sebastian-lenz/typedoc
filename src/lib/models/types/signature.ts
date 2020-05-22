import * as assert from 'assert';
import { Type } from './abstract';
import type { SomeType } from './index';
import { TypeParameterType } from './type-parameter';
import { cloned, wrap } from './utils';

/**
 * Type which describes a signature.
 *
 * ```ts
 * type T = () => string
 * type U = <A>(arg: A) => A
 * ```
 */
export class SignatureType extends Type {
    readonly type = 'signature';

    constructor(
        public typeParameters: TypeParameterType[],
        public parameters: SignatureParameterType[],
        public returnType: SomeType
    ) {
        super();
    }

    clone() {
        return new SignatureType(
            cloned(this.typeParameters),
            cloned(this.parameters),
            this.returnType.clone());
    }

    stringify(wrapped: boolean, useArrow = false): string {
        const typeParameters = this.typeParameters.map(String).join(', ');
        const parameters = this.parameters.map(String).join(', ');
        const returnIndicator = useArrow ? ': ' : ' => ';
        return wrap(wrapped, (typeParameters ? `<${typeParameters}>` : '') + `(${parameters})${returnIndicator}${this.returnType}`);
    }
}

/**
 * Type which describes a parameter of a signature.
 */
export class SignatureParameterType extends Type {
    readonly type = 'parameter';

    constructor(
        public name: string,
        public isOptional: boolean,
        public isRest: boolean,
        public parameterType: SomeType
    ) {
        super();
    }

    clone() {
        return new SignatureParameterType(this.name, this.isOptional, this.isRest, this.parameterType.clone());
    }

    stringify(wrapped: boolean): string {
        assert(wrapped === false, 'SignatureParameterTypes may not be contained within other types.');

        return (this.isRest ? '...' : '')
            + this.name
            + (this.isOptional ? '?' : '')
            + ': '
            + this.parameterType;
    }
}
