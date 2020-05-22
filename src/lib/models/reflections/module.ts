import { ContainerReflection, ReflectionKind } from './abstract';
import type { TopLevelReflection } from './index';

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
}
