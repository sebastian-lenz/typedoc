import * as assert from "assert";
import { removeIfPresent } from "../../utils";
import type {
  SomeReflection,
  IndependentReflection,
  ModelToSerialized,
  SomeContainerReflection,
} from "./index";
import type { ProjectReflection } from "./project";
import { makeToKindArray, makeToKindString } from "../../utils/enum";
import type { Serializer, BaseSerialized } from "../../serialization";
import { Comment } from "../comments";

/**
 * Current reflection id. This provides a quick way to look up a reference to a reflection.
 * Reflections may have different IDs across different versions of TypeScript since they are
 * generated according to the order each reflection is created in. They might also be
 * nondeterministic if event handlers return promises which must be awaited.
 */
let REFLECTION_ID = 0;

/**
 * Reset the reflection id.
 *
 * Used by the test cases to ensure the reflection ids won't change between runs.
 * May also be used by external tools to reset IDs between calls to {@link Application.convert}
 * If you use this function, you must ensure that reflections created in one run are not mixed
 * with reflections created in another run.
 */
export function resetReflectionID(): void {
  REFLECTION_ID = 0;
}

/**
 * Defines the available reflection kinds.
 */
export enum ReflectionKind {
  // It isn't possible to use the bit shifting directly here.
  // The enum doesn't care, but it prevents dynamically using these members
  // as properties elsewhere. Members are assigned powers of two so that
  // Module or Namespace can be efficiently checked with `kind & (Module | Namespace)`
  Project = 1,
  Module = 2,
  Namespace = 4,
  Enum = 8,
  EnumMember = 16,
  Variable = 32,
  Function = 64,
  Class = 128,
  Interface = 256,
  Object = 512,
  Property = 1024,
  Accessor = 2048,
  Method = 4096,
  Signature = 8192,
  Parameter = 16384,
  Alias = 32768,
  Reference = 65536,
}

export namespace ReflectionKind {
  const LAST_KIND = ReflectionKind.Reference;

  export const All: ReflectionKind = LAST_KIND * 2 - 1;

  export const toKindArray = makeToKindArray(LAST_KIND);

  export const toKindString = makeToKindString(ReflectionKind);
}

/**
 * Base class for all reflection classes.
 *
 * While generating a documentation, TypeDoc generates an instance of {@link ProjectReflection}
 * as the root for all reflections within the project.
 *
 * Note that several plugins extend this class, dynamically adding properties during conversion.
 * For example, the sources plugin adds the {@link sources} property. Plugins can use declaration
 * merging to add properties to the interface for typechecking.
 *
 * ### Reflection Creation
 * When a reflection is created and added to a project it must be registered with that reflection using
 * {@link ProjectReflection.registerReflection} so that references can be resolved. If the reflection is
 * not registered, then references will likely be broken.
 */
export abstract class Reflection {
  /**
   * Unique id of this reflection.
   */
  readonly id: number;

  /**
   * The parsed documentation comment attached to this reflection.
   * This will be set by the converter and mutated by the comment plugin during the reflectionCreated event.
   */
  comment?: Comment;

  /**
   * The symbol name of this reflection.
   */
  get name(): string {
    return this._name;
  }

  set name(value: string) {
    if (this._originalName === undefined) {
      this._originalName = this._name;
    }
    this._name = value;
  }

  /**
   * The original name of the TypeScript declaration.
   * In most cases, this will be the same as the reflection name. It will be
   * different for reflections describing a source file since TypeScript
   * includes the full absolute path as the name of a source file.
   */
  get originalName(): string {
    return this._originalName ?? this._name;
  }

  /**
   * The kind of this reflection.
   */
  abstract readonly kind: ReflectionKind;

  /**
   * Serialize this reflection to a JSON object.
   */
  abstract serialize(
    serializer: Serializer,
    init: BaseSerialized<SomeReflection>
  ): ModelToSerialized<SomeReflection>;

  /**
   * The reflection this reflection is a child of. This is set by the container reflection
   * when a child is added to the reflection.
   */
  get parent(): SomeContainerReflection | undefined {
    return this._parent;
  }

  set parent(value: SomeContainerReflection | undefined) {
    this._parent = value;
    this._projectCache = undefined;
  }

  /**
   * Gets the project associated with this reflection.
   * If a reflection has not been added to a project, this will return undefined.
   */
  get project(): ProjectReflection | undefined {
    if (this.isProject()) {
      return this;
    }
    if (this._projectCache !== undefined) {
      return this._projectCache;
    }
    return (this._projectCache = this.parent?.project);
  }

  private _name: string;
  private _originalName?: string;
  private _parent?: SomeContainerReflection;
  private _projectCache?: ProjectReflection;

  /**
   * Create a new Reflection instance.
   */
  constructor(name: string) {
    this.id = REFLECTION_ID++;
    this._name = name;
  }

  /**
   * Test whether this reflection is of the given kind.
   */
  kindOf<K extends ReflectionKind>(...kinds: K[]): this is { kind: K } {
    return kinds.some((kind) => (this.kind & kind) !== 0);
  }

  /**
   * Return the full name of this reflection.
   *
   * The full name contains the name of this reflection and the names of all parent reflections.
   *
   * @param separator  Separator used to join the names of the reflections.
   * @returns The full name of this reflection.
   */
  getFullName(separator = "."): string {
    if (!this.parent || this.parent.isProject()) {
      return this.name;
    } else {
      return this.parent.getFullName(separator) + separator + this.name;
    }
  }

  /**
   * Checks if the current reflection is the project.
   * This is used instead of `instanceof` to avoid circular dependencies.
   */
  isProject(): this is ProjectReflection {
    return false;
  }

  /**
   * Checks if the current reflection is some container reflection.
   * Provides a safer check than using `instanceof ContainerReflection` since the latter
   * will result in the `children` property being typed as `any[]`.
   */
  isContainer(): this is ContainerReflection<IndependentReflection> {
    return this instanceof ContainerReflection;
  }
}

/**
 * Describes a reflection which may contain other reflections.
 *
 * Container reflections describe object-like constructs which contain properties, including modules,
 * namespaces, and classes. Notably, while a {@link SignatureReflection} may contain several reflections
 * describing its parameters, and a {@link FunctionReflection} may contain several signature reflections,
 * they are not container reflections.
 */
export abstract class ContainerReflection<
  Child extends IndependentReflection
> extends Reflection {
  /**
   * The children of this reflection. The type of the children depends on what type the container is.
   * For example, or enums, children will be {@link EnumMemberReflection}, while namespaces can have
   * almost any member type.
   */
  children: Child[] = [];

  /**
   * Adds the given child to this container and sets the parent link.
   * @param child
   */
  addChild(child: Child): void {
    assert.strictEqual(
      child.parent,
      undefined,
      `${child.getFullName()} was added to two containers simultaneously.`
    );

    this.children.push(child);
    // TypeScript cannot verify this is safe because it cannot verify that SomeReflection
    // contains *every possible* subclass of ContainerReflection. However, practically, plugins
    // do not add new top level reflections and this can be verified manually.
    // I (GB) believe the unsafety here is worth the improved developer experience gained by
    // providing the type as a discriminated union.
    child.parent = this as SomeContainerReflection;
  }

  /**
   * Removes the given child from this container, it may be added to
   * another container afterwards. Mutates child, removing the parent link.
   *
   * @param child
   */
  removeChild(child: Child): void {
    assert.strictEqual(
      child.parent,
      this,
      `Tried to remove ${child.getFullName()} from ${this.getFullName()}, but child is not a child of this container.`
    );

    removeIfPresent(this.children, child);
    child.parent = undefined;
  }

  /**
   * Traverse member reflections contained within this reflection.
   *
   * This method will only yield reflections contained within the current reflection as
   * members, including namespace members, class members, and enum members. It *will not*
   * yield function parameter reflections since they aren't members of the signature.
   */
  *[Symbol.iterator](): IterableIterator<Child> {
    yield* this.children;
  }
}
