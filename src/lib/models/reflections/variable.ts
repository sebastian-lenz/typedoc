import { Reflection, ReflectionKind } from './abstract';
import type { SomeType } from '../types';

/**
 * Describes a variable.
 *
 * To determine if a variable is declared with `const`, `let` or `var`, check {@link VariableReflection.flags}
 *
 * ```ts
 * export const a = true
 * export let b = Math.random()
 * export var c = [1, 2, 3]
 * // This is treated as a function.
 * export var notAVariableReflection = () => true
 * ```
 */
export class VariableReflection extends Reflection {
    readonly kind = ReflectionKind.Variable;

    type: SomeType;

    defaultValue?: string;

    constructor(name: string, type: SomeType, defaultValue?: string) {
        super(name);
        this.type = type;
        this.defaultValue = defaultValue;
    }
}
