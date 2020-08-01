import type * as ts from "typescript";
import type { IndependentReflection, ModuleReflection } from ".";
import type {
  BaseSerialized,
  Serialized,
  Serializer,
} from "../../serialization";
import { ContainerReflection, Reflection, ReflectionKind } from "./abstract";
import { ReferenceReflection } from "./reference";

/**
 * A reflection that represents the root of the project.
 *
 * This reflection will contain {@link ModuleReflection}s for each entry point of the program.
 * When rendering, if there is only one module it is recommended to not render the top level
 * module, instead immediately rendering the children of that module.
 */
export class ProjectReflection extends ContainerReflection<ModuleReflection> {
  readonly kind = ReflectionKind.Project;

  // Maps a TypeScript symbol to the reflection ID it refers to.
  // Note that one symbol might refer to multiple reflections in the case of references or merged declarations.
  private _symbolToReflection = new WeakMap<ts.Symbol, Set<number>>();

  // Maps a reflection ID to all references eventually referring to it.
  private _referenceGraph?: Map<number, number[]>;

  /**
   * All independent reflections within the project.
   */
  private _reflections = new Map<number, IndependentReflection>();

  /**
   * The contents of the `readme.md` file associated with this project.
   */
  readme: string;

  constructor(name: string, readme: string) {
    super(name);
    this.readme = readme;
  }

  /**
   * Registers the given reflection so that it can be quickly looked up by references.
   * Should be called for every independent reflection added to the project.
   */
  registerReflection(
    reflection: IndependentReflection,
    symbol: ts.Symbol
  ): void {
    this._referenceGraph = undefined;
    this._reflections.set(reflection.id, reflection);
    const set = this._symbolToReflection.get(symbol) ?? new Set();
    set.add(reflection.id);
    this._symbolToReflection.set(symbol, set);
  }

  /**
   * Removes a reflection from the documentation. Can be used by plugins to filter reflections
   * out of the generated documentation. Has no effect if the reflection is not present in the
   * project.
   */
  removeReflection(reflection: Reflection): void {
    // First cleanup references
    for (const id of this.getReferenceGraph().get(reflection.id) ?? []) {
      const ref = this.getReflectionById(id);
      if (ref) {
        this.removeReflection(ref);
      }
    }
    this.getReferenceGraph().delete(reflection.id);

    // Remove children + references to children.
    if (reflection.isContainer()) {
      for (const child of reflection) {
        this.removeReflection(child);
      }
    }

    // Remove reflection from parent.
    if (reflection.parent?.isContainer()) {
      // We know reflection is the right type because it is already a child.
      reflection.parent.removeChild(reflection as never);
    }

    this._reflections.delete(reflection.id);
  }

  /**
   * Gets the reflection registered for the given reflection ID, or undefined if it is not present
   * in the project.
   */
  getReflectionById(id: number): IndependentReflection | undefined {
    return this._reflections.get(id);
  }

  /**
   * Gets the reflection registered for the given TypeScript symbol, or undefined if it is not present
   * in the project.
   */
  getReflectionsFromSymbol(symbol: ts.Symbol): Set<IndependentReflection> {
    const reflections = new Set<IndependentReflection>();
    for (const id of this._symbolToReflection.get(symbol) ?? []) {
      const reflection = this.getReflectionById(id);
      if (reflection) {
        reflections.add(reflection);
      }
    }
    return reflections;
  }

  serialize(
    _serializer: Serializer,
    init: BaseSerialized<ProjectReflection>
  ): SerializedProjectReflection {
    return init;
  }

  /** @inheritdoc */
  isProject(): boolean {
    return true;
  }

  private getReferenceGraph(): Map<number, number[]> {
    if (!this._referenceGraph) {
      this._referenceGraph = new Map();
      for (const ref of this._reflections.values()) {
        if (ref instanceof ReferenceReflection) {
          const target = ref.resolve();
          if (target) {
            const refs = this._referenceGraph.get(target.id) ?? [];
            refs.push(ref.id);
            this._referenceGraph.set(target.id, refs);
          }
        }
      }
    }

    return this._referenceGraph;
  }
}

export interface SerializedProjectReflection
  extends Serialized<ProjectReflection, never> {}
