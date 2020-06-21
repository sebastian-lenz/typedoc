import type { ReflectionKind } from './abstract';
import type { SerializedTypeAliasReflection, TypeAliasReflection } from './alias';
import type { ClassReflection, SerializedClassReflection } from './class';
import type { EnumMemberReflection, EnumReflection, SerializedEnumMemberReflection, SerializedEnumReflection } from './enum';
import type { InterfaceReflection, SerializedInterfaceReflection } from './interface';
import type { ModuleReflection, SerializedModuleReflection } from './module';
import type { NamespaceReflection, SerializedNamespaceReflection } from './namespace';
import type { ObjectReflection, SerializedObjectReflection } from './object';
import type { ParameterReflection, SerializedParameterReflection } from './parameter';
import type { ProjectReflection, SerializedProjectReflection } from './project';
import type { AccessorReflection, PropertyReflection, SerializedDynamicPropertyReflection, SerializedPropertyReflection } from './property';
import type { ReferenceReflection, SerializedReferenceReflection } from './reference';
import type { FunctionReflection, MethodReflection, SerializedFunctionReflection, SerializedMethodReflection, SerializedSignatureReflection, SignatureReflection } from './signature';
import type { SerializedVariableReflection, VariableReflection } from './variable';

export { ContainerReflection, Reflection, ReflectionKind } from './abstract';
export { TypeAliasReflection } from './alias';
export { ClassReflection, Visibility } from './class';
export { EnumMemberReflection, EnumReflection } from './enum';
export { InterfaceReflection } from './interface';
export { ModuleReflection } from './module';
export { NamespaceReflection } from './namespace';
export { ParameterReflection } from './parameter';
export { ProjectReflection } from './project';
export { AccessorReflection as DynamicPropertyReflection, PropertyReflection } from './property';
export { ReferenceReflection } from './reference';
export { CallableReflection, FunctionReflection, MethodReflection, SignatureReflection } from './signature';
export { splitUnquotedString } from './utils';
export { VariableReflection } from './variable';

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
    [ReflectionKind.Object]: ObjectReflection;
    [ReflectionKind.Property]: PropertyReflection;
    [ReflectionKind.Accessor]: AccessorReflection;
    [ReflectionKind.Method]: MethodReflection;
    [ReflectionKind.Signature]: SignatureReflection;
    [ReflectionKind.Parameter]: ParameterReflection;
    [ReflectionKind.Alias]: TypeAliasReflection;
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
    [ReflectionKind.Object]: SerializedObjectReflection;
    [ReflectionKind.Property]: SerializedPropertyReflection;
    [ReflectionKind.Accessor]: SerializedDynamicPropertyReflection;
    [ReflectionKind.Method]: SerializedMethodReflection;
    [ReflectionKind.Signature]: SerializedSignatureReflection;
    [ReflectionKind.Parameter]: SerializedParameterReflection;
    [ReflectionKind.Alias]: SerializedTypeAliasReflection;
    [ReflectionKind.Reference]: SerializedReferenceReflection;
}

/**
 * A discriminated union on the `kind` property, allows better developer
 * experience than typing a property as the base class in some cases.
 */
export type SomeReflection = ReflectionKindToModel[ReflectionKind];

// Extract<SomeReflection, ContainerReflection<IndependentReflection>> doesn't work due to circularity...
// Not entirely sure where the circularity comes in. If you manage to fix it, please submit a PR!
export type SomeContainerReflection =
    | ProjectReflection
    | ModuleReflection
    | NamespaceReflection
    | EnumReflection
    | ClassReflection
    | InterfaceReflection
    | ObjectReflection

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
