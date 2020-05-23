import { ContainerReflection, ReflectionKind } from './abstract';
import type { TopLevelReflection } from './index';
import { Serializer, BaseSerialized, Serialized } from '../../serialization';

/**
 * Describes a module.
 *
 * ```ts
 * // index.ts <-- module
 * export function a() {} <-- child of module
 * // or
 * module 'foo' {}
 * ```
 */
export class ModuleReflection extends ContainerReflection<TopLevelReflection> {
    readonly kind = ReflectionKind.Module;

    serialize(_serializer: Serializer, init: BaseSerialized<ModuleReflection>): SerializedModuleReflection {
        return init;
    }
}

export interface SerializedModuleReflection extends Serialized<ModuleReflection, never> {
}
