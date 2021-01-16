import { SourceReference } from "../sources/file";
import { Type } from "../types/index";
import { Comment } from "../comments/comment";
import { TypeParameterReflection } from "./type-parameter";
import { splitUnquotedString } from "./utils";
import { ProjectReflection } from "./project";

/**
 * Holds all data models used by TypeDoc.
 *
 * The [[BaseReflection]] is base class of all reflection models. The subclass [[ProjectReflection]]
 * serves as the root container for the current project while [[DeclarationReflection]] instances
 * form the structure of the project. Most of the other classes in this namespace are referenced by this
 * two base classes.
 *
 * The models [[NavigationItem]] and [[UrlMapping]] are special as they are only used by the [[Renderer]]
 * while creating the final output.
 */

/**
 * Current reflection id.
 */
let REFLECTION_ID = 0;

/**
 * Reset the reflection id.
 *
 * Used by the test cases to ensure the reflection ids won't change between runs.
 */
export function resetReflectionID() {
    REFLECTION_ID = 0;
}

/**
 * Defines the available reflection kinds.
 */
export enum ReflectionKind {
    Project = 0x1,
    Module = 0x2,
    Namespace = 0x4,
    Enum = 0x8,
    EnumMember = 0x10,
    Variable = 0x20,
    Function = 0x40,
    Class = 0x80,
    Interface = 0x100,
    Constructor = 0x200,
    Property = 0x400,
    Method = 0x800,
    CallSignature = 0x1000,
    IndexSignature = 0x2000,
    ConstructorSignature = 0x4000,
    Parameter = 0x8000,
    TypeLiteral = 0x10000,
    TypeParameter = 0x20000,
    Accessor = 0x40000,
    GetSignature = 0x80000,
    SetSignature = 0x100000,
    TypeAlias = 0x200000,
    Event = 0x400000,
    Reference = 0x800000,
}

/** @hidden */
export namespace ReflectionKind {
    export const All = ReflectionKind.Reference * 2 - 1;

    export const ClassOrInterface =
        ReflectionKind.Class | ReflectionKind.Interface;
    export const FunctionOrMethod =
        ReflectionKind.Function | ReflectionKind.Method;
    export const SomeModule = ReflectionKind.Namespace | ReflectionKind.Module;
}

export enum ReflectionFlag {
    None = 0,
    Private = 1,
    Protected = 2,
    Public = 4,
    Static = 8,
    External = 16,
    Optional = 32,
    Rest = 64,
    Abstract = 256,
    Readonly = 512,
}

const relevantFlags: ReflectionFlag[] = [
    ReflectionFlag.Private,
    ReflectionFlag.Protected,
    ReflectionFlag.Static,
    ReflectionFlag.Optional,
    ReflectionFlag.Rest,
    ReflectionFlag.Abstract,
    ReflectionFlag.Readonly,
];

/**
 * This must extend Array in order to work with Handlebar's each helper.
 */
export class ReflectionFlags extends Array<string> {
    private flags = ReflectionFlag.None;

    hasFlag(flag: ReflectionFlag) {
        return (flag & this.flags) !== 0;
    }

    /**
     * Is this a private member?
     */
    get isPrivate(): boolean {
        return this.hasFlag(ReflectionFlag.Private);
    }

    /**
     * Is this a protected member?
     */
    get isProtected(): boolean {
        return this.hasFlag(ReflectionFlag.Protected);
    }

    /**
     * Is this a public member?
     */
    get isPublic(): boolean {
        return this.hasFlag(ReflectionFlag.Public);
    }

    /**
     * Is this a static member?
     */
    get isStatic(): boolean {
        return this.hasFlag(ReflectionFlag.Static);
    }

    /**
     * Is this a declaration from an external document?
     */
    get isExternal(): boolean {
        return this.hasFlag(ReflectionFlag.External);
    }

    /**
     * Whether this reflection is an optional component or not.
     *
     * Applies to function parameters and object members.
     */
    get isOptional(): boolean {
        return this.hasFlag(ReflectionFlag.Optional);
    }

    /**
     * Whether it's a rest parameter, like `foo(...params);`.
     */
    get isRest(): boolean {
        return this.hasFlag(ReflectionFlag.Rest);
    }

    get isAbstract(): boolean {
        return this.hasFlag(ReflectionFlag.Abstract);
    }

    get isReadonly() {
        return this.hasFlag(ReflectionFlag.Readonly);
    }

    setFlag(flag: ReflectionFlag, set: boolean) {
        switch (flag) {
            case ReflectionFlag.Private:
                this.setSingleFlag(ReflectionFlag.Private, set);
                if (set) {
                    this.setFlag(ReflectionFlag.Protected, false);
                    this.setFlag(ReflectionFlag.Public, false);
                }
                break;
            case ReflectionFlag.Protected:
                this.setSingleFlag(ReflectionFlag.Protected, set);
                if (set) {
                    this.setFlag(ReflectionFlag.Private, false);
                    this.setFlag(ReflectionFlag.Public, false);
                }
                break;
            case ReflectionFlag.Public:
                this.setSingleFlag(ReflectionFlag.Public, set);
                if (set) {
                    this.setFlag(ReflectionFlag.Private, false);
                    this.setFlag(ReflectionFlag.Protected, false);
                }
                break;
            default:
                this.setSingleFlag(flag, set);
        }
    }

    private setSingleFlag(flag: ReflectionFlag, set: boolean) {
        const name = ReflectionFlag[flag].replace(
            /(.)([A-Z])/g,
            (_m, a, b) => a + " " + b.toLowerCase()
        );
        if (!set && this.hasFlag(flag)) {
            if (relevantFlags.includes(flag)) {
                this.splice(this.indexOf(name), 1);
            }
            this.flags ^= flag;
        } else if (set && !this.hasFlag(flag)) {
            if (relevantFlags.includes(flag)) {
                this.push(name);
            }
            this.flags |= flag;
        }
    }
}

export interface DefaultValueContainer extends Reflection {
    defaultValue?: string;
}

export interface TypeContainer extends Reflection {
    type?: Type;
}

export interface TypeParameterContainer extends Reflection {
    typeParameters?: TypeParameterReflection[];
}

export enum TraverseProperty {
    Children,
    Parameters,
    TypeLiteral,
    TypeParameter,
    Signatures,
    IndexSignature,
    GetSignature,
    SetSignature,
}

export interface TraverseCallback {
    /**
     * May return false to bail out of any further iteration. To preserve backwards compatibility, if
     * a function returns undefined, iteration must continue.
     */
    (reflection: Reflection, property: TraverseProperty): boolean | void;
}

/**
 * Defines the usage of a decorator.
 */
export interface Decorator {
    /**
     * The name of the decorator being applied.
     */
    name: string;

    /**
     * The type declaring the decorator.
     * Usually a ReferenceType instance pointing to the decorator function.
     */
    type?: Type;

    /**
     * A named map of arguments the decorator is applied with.
     */
    arguments?: any;
}

/**
 * Base class for all reflection classes.
 *
 * While generating a documentation, TypeDoc generates an instance of [[ProjectReflection]]
 * as the root for all reflections within the project. All other reflections are represented
 * by the [[DeclarationReflection]] class.
 *
 * This base class exposes the basic properties one may use to traverse the reflection tree.
 * You can use the [[children]] and [[parent]] properties to walk the tree. The [[groups]] property
 * contains a list of all children grouped and sorted for being rendered.
 */
export abstract class Reflection {
    /**
     * Unique id of this reflection.
     */
    id: number;

    /**
     * The symbol name of this reflection.
     */
    name: string;

    /**
     * The original name of the TypeScript declaration.
     */
    originalName: string;

    /**
     * The kind of this reflection.
     */
    kind: ReflectionKind;

    /**
     * The human readable string representation of the kind of this reflection.
     * Set during the resolution phase by GroupPlugin
     */
    kindString?: string;

    flags: ReflectionFlags = new ReflectionFlags();

    /**
     * The reflection this reflection is a child of.
     */
    parent?: Reflection;

    /**
     * The parsed documentation comment attached to this reflection.
     */
    comment?: Comment;

    /**
     * A list of all source files that contributed to this reflection.
     */
    sources?: SourceReference[];

    /**
     * A list of all decorators attached to this reflection.
     */
    decorators?: Decorator[];

    /**
     * A list of all types that are decorated by this reflection.
     */
    decorates?: Type[];

    /**
     * The url of this reflection in the generated documentation.
     * TODO: Reflections shouldn't know urls exist. Move this to a serializer.
     */
    url?: string;

    /**
     * The name of the anchor of this child.
     * TODO: Reflections shouldn't know anchors exist. Move this to a serializer.
     */
    anchor?: string;

    /**
     * Is the url pointing to an individual document?
     *
     * When FALSE, the url points to an anchor tag on a page of a different reflection.
     * TODO: Reflections shouldn't know how they are rendered. Move this to the correct serializer.
     */
    hasOwnDocument?: boolean;

    /**
     * A list of generated css classes that should be applied to representations of this
     * reflection in the generated markup.
     * TODO: Reflections shouldn't know about CSS. Move this property to the correct serializer.
     */
    cssClasses?: string;

    /**
     * Url safe alias for this reflection.
     *
     * @see [[BaseReflection.getAlias]]
     */
    private _alias?: string;

    private _aliases?: string[];

    /**
     * Create a new BaseReflection instance.
     */
    constructor(name: string, kind: ReflectionKind, parent?: Reflection) {
        this.id = REFLECTION_ID++;
        this.parent = parent;
        this.name = name;
        this.originalName = name;
        this.kind = kind;

        // If our parent is external, we are too.
        if (parent?.flags.isExternal) {
            this.setFlag(ReflectionFlag.External);
        }
    }

    /**
     * Test whether this reflection is of the given kind.
     */
    kindOf(kind: ReflectionKind | ReflectionKind[]): boolean {
        const kindArray = Array.isArray(kind) ? kind : [kind];
        return kindArray.some((kind) => (this.kind & kind) !== 0);
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
        if (this.parent && !this.parent.isProject()) {
            return this.parent.getFullName(separator) + separator + this.name;
        } else {
            return this.name;
        }
    }

    /**
     * Set a flag on this reflection.
     */
    setFlag(flag: ReflectionFlag, value = true) {
        this.flags.setFlag(flag, value);
    }

    /**
     * Return an url safe alias for this reflection.
     */
    getAlias(): string {
        if (!this._alias) {
            let alias = this.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
            if (alias === "") {
                alias = "reflection-" + this.id;
            }

            let target = <Reflection>this;
            while (
                target.parent &&
                !target.parent.isProject() &&
                !target.hasOwnDocument
            ) {
                target = target.parent;
            }

            if (!target._aliases) {
                target._aliases = [];
            }
            let suffix = "",
                index = 0;
            while (target._aliases.includes(alias + suffix)) {
                suffix = "-" + (++index).toString();
            }

            alias += suffix;
            target._aliases.push(alias);
            this._alias = alias;
        }

        return this._alias;
    }

    /**
     * Has this reflection a visible comment?
     *
     * @returns TRUE when this reflection has a visible comment.
     */
    hasComment(): boolean {
        return this.comment ? this.comment.hasVisibleComponent() : false;
    }

    hasGetterOrSetter(): boolean {
        return false;
    }

    /**
     * Return a child by its name.
     *
     * @param names The name hierarchy of the child to look for.
     * @returns The found child or undefined.
     */
    getChildByName(arg: string | string[]): Reflection | undefined {
        const names: string[] = Array.isArray(arg)
            ? arg
            : splitUnquotedString(arg, ".");
        const name = names[0];
        let result: Reflection | undefined;

        this.traverse((child) => {
            if (child.name === name) {
                if (names.length <= 1) {
                    result = child;
                } else {
                    result = child.getChildByName(names.slice(1));
                }
                return false;
            }
        });

        return result;
    }

    /**
     * Return whether this reflection is the root / project reflection.
     */
    isProject(): this is ProjectReflection {
        return false;
    }

    /**
     * Try to find a reflection by its name.
     *
     * @return The found reflection or null.
     */
    findReflectionByName(arg: string | string[]): Reflection | undefined {
        const names: string[] = Array.isArray(arg)
            ? arg
            : splitUnquotedString(arg, ".");

        const reflection = this.getChildByName(names);
        if (reflection) {
            return reflection;
        } else if (this.parent) {
            return this.parent.findReflectionByName(names);
        }
    }

    /**
     * Traverse all potential child reflections of this reflection.
     *
     * The given callback will be invoked for all children, signatures and type parameters
     * attached to this reflection.
     *
     * @param callback  The callback function that should be applied for each child reflection.
     */
    traverse(_callback: TraverseCallback) {
        // do nothing here, overridden by child classes
    }

    /**
     * Return a string representation of this reflection.
     */
    toString(): string {
        return ReflectionKind[this.kind] + " " + this.name;
    }

    /**
     * Return a string representation of this reflection and all of its children.
     *
     * @param indent  Used internally to indent child reflections.
     */
    toStringHierarchy(indent = "") {
        const lines = [indent + this.toString()];

        indent += "  ";
        this.traverse((child) => {
            lines.push(child.toStringHierarchy(indent));
        });

        return lines.join("\n");
    }
}
