import type { ReflectionKind } from './abstract';
import type { TypeAliasReflection } from './alias';
import type { ClassReflection } from './class';
import type { EnumMemberReflection, EnumReflection } from './enum';
import type { InterfaceReflection } from './interface';
import type { ModuleReflection } from './module';
import type { NamespaceReflection } from './namespace';
import type { ParameterReflection } from './parameter';
import type { ProjectReflection } from './project';
import type { DynamicPropertyReflection, PropertyReflection } from './property';
import type { ReferenceReflection } from './reference';
import type { FunctionReflection, MethodReflection } from './signature';
import type { VariableReflection } from './variable';

export { ContainerReflection, Reflection, ReflectionKind } from './abstract';
export { TypeAliasReflection } from './alias';
export { ClassReflection } from './class';
export { EnumMemberReflection, EnumReflection } from './enum';
export { ReflectionFlag, ReflectionFlags } from './flags';
export { InterfaceReflection } from './interface';
export { ModuleReflection } from './module';
export { NamespaceReflection } from './namespace';
export { ParameterReflection } from './parameter';
export { ProjectReflection } from './project';
export { ReferenceReflection } from './reference';
export { CallableReflection, FunctionReflection, MethodReflection, SignatureReflection } from './signature';
export { splitUnquotedString } from './utils';

export interface KindToReflection {
    [ReflectionKind.Project]: ProjectReflection;
    [ReflectionKind.Module]: ModuleReflection;
    [ReflectionKind.Namespace]: NamespaceReflection;
    [ReflectionKind.Enum]: EnumReflection;
    [ReflectionKind.EnumMember]: EnumMemberReflection;
    [ReflectionKind.Variable]: VariableReflection;
    [ReflectionKind.Function]: FunctionReflection;
    [ReflectionKind.Class]: ClassReflection;
    [ReflectionKind.Interface]: InterfaceReflection;
    [ReflectionKind.Property]: PropertyReflection;
    [ReflectionKind.DynamicProperty]: DynamicPropertyReflection;
    [ReflectionKind.Method]: MethodReflection;
    [ReflectionKind.Parameter]: ParameterReflection;
    [ReflectionKind.TypeAlias]: TypeAliasReflection;
    [ReflectionKind.Reference]: ReferenceReflection;
}

/**
 * A discriminated union on the `kind` property, allows better developer
 * experience than typing a property as the base class in some cases.
 */
export type SomeReflection = KindToReflection[keyof KindToReflection];

/**
 * These reflection types cannot stand on their own. They only make sense
 * when contained within another reflection. As such, they cannot be removed
 * from a project. To remove them, remove their parent.
 */
export type DependentReflection =
    | ParameterReflection;

export type IndependentReflection = Exclude<SomeReflection, DependentReflection>;

/**
 * Reflections that may be present at the top level of a module or namespace.
 */
export type TopLevelReflection =
    | NamespaceReflection
    | EnumReflection
    | VariableReflection
    | FunctionReflection
    | ClassReflection
    | InterfaceReflection
    | ReferenceReflection;
