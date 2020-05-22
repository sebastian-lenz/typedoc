/**
 * Flags which describe modifiers which may be applied to a reflection.
 * Some flags are mutually exclusive. Private/Protected/Public may only have
 * one flag applied at a time. This is correctly handled by the {@link ReflectionFlags}
 * class.
 */
export enum ReflectionFlag {
    None = 0,
    Private = 1,
    Protected = 2,
    Public = 4,
    Static = 8,
    Exported = 16, // TODO GERRIT
    ExportAssignment = 32,
    External = 64,
    Optional = 128,
    DefaultValue = 256,
    Rest = 512,
    ConstructorProperty = 1024, // TODO GERRIT
    Abstract = 2048,
    Const = 4096, // TODO GERRIT
    Let = 8192, // TODO GERRIT
    Readonly = 16384
}

/**
 * This must extend Array in order to work with Handlebars' each helper.
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
     * True if the reflection is exported from its containing declaration. Note that if a file
     * has no imports or exports, then TS assumes that the file is in a global scope and *all*
     * declarations are exported.
     * ```ts
     * // a.ts
     * namespace A { // isExported = false
     *   export const b = 1 // isExported = true, even though the container is false.
     * }
     * export const b = 2 // isExported = true
     * // b.ts
     * const c = 1 // isExported = true, no imports/exports
     * ```
     */
    get isExported(): boolean {
        return this.hasFlag(ReflectionFlag.Exported);
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

    get hasExportAssignment(): boolean {
        return this.hasFlag(ReflectionFlag.ExportAssignment);
    }

    get isConstructorProperty(): boolean {
        return this.hasFlag(ReflectionFlag.ConstructorProperty);
    }

    get isAbstract(): boolean {
        return this.hasFlag(ReflectionFlag.Abstract);
    }

    get isConst() {
        return this.hasFlag(ReflectionFlag.Const);
    }

    get isLet() {
        return this.hasFlag(ReflectionFlag.Let);
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
            case ReflectionFlag.Const:
            case ReflectionFlag.Let:
                this.setSingleFlag(flag, set);
                this.setSingleFlag((ReflectionFlag.Let | ReflectionFlag.Const) ^ flag, !set);
            default:
                this.setSingleFlag(flag, set);
        }
    }

    private setSingleFlag(flag: ReflectionFlag, set: boolean) {
        const name = ReflectionFlag[flag].replace(/(.)([A-Z])/g, (m, a, b) => a + ' ' + b.toLowerCase());
        if (!set && this.hasFlag(flag)) {
            this.splice(this.indexOf(name), 1);
            this.flags ^= flag;
        } else if (set && !this.hasFlag(flag)) {
            this.push(name);
            this.flags |= flag;
        }
    }
}
