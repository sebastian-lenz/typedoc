import * as assert from "assert";
import { Reflection, ReflectionKind } from "./abstract";
import type { SomeReflection } from "./index";
import { BaseSerialized, Serializer, Serialized } from "../../serialization";

/**
 * Describes a reflection which does not exist at this location, but is referenced. Used for imported reflections.
 *
 * Like the compiler API, references are collapsed. This provides some performance benefits for large projects.
 *
 * ```ts
 * // a.ts
 * export const a = 1;
 * // b.ts
 * import { a } from './a';
 * // Here to avoid extra work we create a reference to the original reflection in module a
 * // instead of copying the reflection.
 * export { a };
 * ```
 */
export class ReferenceReflection extends Reflection {
  readonly kind = ReflectionKind.Reference;

  private _target: number;

  /**
   * Creates a reference reflection.
   *
   * References can only be created for reflections which have already been registered.
   * If a reflection is removed from the project that this reflection is contained within,
   * the reference will fail to resolve.
   */
  constructor(name: string, reflection: SomeReflection) {
    super(name);
    this._target =
      reflection instanceof ReferenceReflection
        ? reflection._target
        : reflection.id;
  }

  /**
   * Tries to get the reflection that is referenced.
   */
  resolve(): Reflection | undefined {
    assert(
      this.project,
      "Reference reflection has no project and is unable to resolve."
    );
    return this.project.getReflectionById(this._target);
  }

  serialize(
    _serializer: Serializer,
    init: BaseSerialized<ReferenceReflection>
  ): SerializedReferenceReflection {
    return {
      ...init,
      target: this.resolve()?.id,
    };
  }
}

export interface SerializedReferenceReflection
  extends Serialized<ReferenceReflection, never> {
  /**
   * If undefined, then the reference is broken.
   */
  target: number | undefined;
}
