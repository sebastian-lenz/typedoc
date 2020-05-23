import type { ReflectionKind, ContainerReflection } from './abstract';
import type { TypeAliasReflection, SerializedTypeAliasReflection } from './alias';
import type { ClassReflection, SerializedClassReflection } from './class';
import type { EnumMemberReflection, EnumReflection, SerializedEnumReflection, SerializedEnumMemberReflection } from './enum';
import type { InterfaceReflection, SerializedInterfaceReflection } from './interface';
import type { ModuleReflection, SerializedModuleReflection } from './module';
import type { NamespaceReflection, SerializedNamespaceReflection } from './namespace';
import type { ParameterReflection, SerializedParameterReflection } from './parameter';
import type { ProjectReflection, SerializedProjectReflection } from './project';
import type { DynamicPropertyReflection, PropertyReflection, SerializedPropertyReflection, SerializedDynamicPropertyReflection } from './property';
import type { ReferenceReflection, SerializedReferenceReflection } from './reference';
import type { FunctionReflection, MethodReflection, SerializedFunctionReflection, SerializedMethodReflection } from './signature';
import type { VariableReflection, SerializedVariableReflection } from './variable';

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

export interface ReflectionKindToModel {
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

export interface ReflectionKindToSerialized {
    [ReflectionKind.Project]: SerializedProjectReflection;
    [ReflectionKind.Module]: SerializedModuleReflection;
    [ReflectionKind.Namespace]: SerializedNamespaceReflection;
    [ReflectionKind.Enum]: SerializedEnumReflection;
    [ReflectionKind.EnumMember]: SerializedEnumMemberReflection;
    [ReflectionKind.Variable]: SerializedVariableReflection;
    [ReflectionKind.Function]: SerializedFunctionReflection;
    [ReflectionKind.Class]: SerializedClassReflection;
    [ReflectionKind.Interface]: SerializedInterfaceReflection;
    [ReflectionKind.Property]: SerializedPropertyReflection;
    [ReflectionKind.DynamicProperty]: SerializedDynamicPropertyReflection;
    [ReflectionKind.Method]: SerializedMethodReflection;
    [ReflectionKind.Parameter]: SerializedParameterReflection;
    [ReflectionKind.TypeAlias]: SerializedTypeAliasReflection;
    [ReflectionKind.Reference]: SerializedReferenceReflection;
}

/**
 * A discriminated union on the `kind` property, allows better developer
 * experience than typing a property as the base class in some cases.
 */
export type SomeReflection = ReflectionKindToModel[keyof ReflectionKindToModel];

export type SomeContainerReflection = Extract<SomeReflection, ContainerReflection<IndependentReflection>>;

export type ModelToSerialized<T> = T extends SomeReflection ? ReflectionKindToSerialized[T['kind']] : T;

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
