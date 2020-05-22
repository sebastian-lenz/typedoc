import { ContainerReflection, ReflectionKind } from './abstract';
import type { TopLevelReflection } from './index';

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
}
