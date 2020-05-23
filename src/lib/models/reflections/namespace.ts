import { ContainerReflection, ReflectionKind } from './abstract';
import type { TopLevelReflection } from './index';
import type { Serialized, Serializer, BaseSerialized } from '../../serialization';

/**
 * Describes a namespace.
 *
 * ```ts
 * namespace Foo {}
 * module Bar {}
 * // But not
 * module 'foo' {}
 * ```
 */
export class NamespaceReflection extends ContainerReflection<TopLevelReflection> {
    readonly kind = ReflectionKind.Namespace;

    serialize(_serializer: Serializer, init: BaseSerialized<NamespaceReflection>): SerializedNamespaceReflection {
        return init;
    }
}

export interface SerializedNamespaceReflection extends Serialized<NamespaceReflection, never> {
}
