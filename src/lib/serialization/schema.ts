/**
 * Contains interfaces which describe the JSON output. Each interface is related to a specific type of serializer.
 *
 * ## Plugins
 * Plugins which modify the serialization process can use declaration merging
 * to add custom properties to the exported interfaces.
 * For example, if your custom serializer adds a property to all [[Reflection]] objects:
 * ```ts
 * declare module 'typedoc/dist/lib/serialization/schema' {
 *     export interface AbstractReflection {
 *         myCustomProp: boolean
 *     }
 * }
 * ```
 *
 * If a plugin defines a new Model type, [[ModelToObject]] will not pick up the serializer type and
 * the resulting type will not be included in the return type of {@link Serializer.toObject}.
 * To fix this, use declaration merging to augment the [[Serializer]] class.
 * ```ts
 * declare module 'typedoc/dist/lib/serialization/serializer' {
 *     export interface Serializer {
 *         toObject(value: CustomModel, obj?: Partial<CustomModel>): CustomOutput
 *     }
 * }
 * ```
 *
 * For documentation on the JSON output properties, view the corresponding model.
 */

/** */
import * as M from '../models';
import { SourceReferenceWrapper, DecoratorWrapper } from './serializers';

/**
 * Describes the mapping from Model types to the corresponding JSON output type.
 */
export type ModelToObject<T> = T extends Array<infer U> ? _ModelToObject<U>[] : _ModelToObject<T>;

// Order matters here. Some types are subtypes of other types.
type _ModelToObject<T> =
    // Reflections
    T extends M.ReflectionGroup ? ReflectionGroup :
    T extends M.ReflectionCategory ? ReflectionCategory :
    T extends M.SignatureReflection ? SignatureReflection :
    T extends M.ParameterReflection ? ParameterReflection :
    T extends M.DeclarationReflection ? DeclarationReflection | ReflectionPointer :
    T extends M.TypeParameterReflection ? TypeParameterReflection :
    T extends M.ProjectReflection ? ProjectReflection :
    T extends M.ContainerReflection ? ContainerReflection :
    T extends M.ReferenceReflection ? ReferenceReflection :
    T extends M.Reflection ? Reflection :
    // Types
    T extends M.ArrayType ? ArrayType :
    T extends M.ConditionalType ? ConditionalType :
    T extends M.IndexedAccessType ? IndexedAccessType :
    T extends M.InferredType ? InferredType :
    T extends M.IntersectionType ? IntersectionType :
    T extends M.IntrinsicType ? IntrinsicType :
    T extends M.PredicateType ? PredicateType :
    T extends M.ReferenceType ? ReferenceType :
    T extends M.ReflectionType ? ReflectionType :
    T extends M.StringLiteralType ? StringLiteralType :
    T extends M.TupleType ? TupleType :
    T extends M.UnknownType ? UnknownType :
    T extends M.Type ? SomeType : // Technically AbstractType, but the union is more useful
    // Miscellaneous
    T extends M.Comment ? Comment :
    T extends M.CommentTag ? CommentTag :
    T extends DecoratorWrapper ? Decorator :
    T extends SourceReferenceWrapper ? SourceReference :
    never;

type Primitive = string | number | undefined | null | boolean;

/**
 * Helper to describe a set of serialized properties. Primitive types are returned
 * directly, while other models are first passed through ModelToObject.
 * This helper removes the readonly modifier from properties since the result of serialization
 * is a plain object that consumers may modify as they choose, TypeDoc doesn't care.
 */
type S<T, K extends keyof T> = {
    -readonly [K2 in K]: T[K2] extends Primitive ? T[K2] : ModelToObject<T[K2]>
};

// Reflections

export interface ReflectionGroup extends S<M.ReflectionGroup, 'title' | 'kind' | 'categories'> {
    children?: M.ReflectionGroup['children'][number]['id'][];
}

export interface ReflectionCategory extends S<M.ReflectionCategory, 'title'> {
    children?: M.ReflectionCategory['children'][number]['id'][];
}

export interface ReferenceReflection extends DeclarationReflection, S<M.ReferenceReflection, never> {
    /**
     * -1 if the reference refers to a symbol that does not exist in the documentation.
     * Otherwise, the reflection ID.
     */
    target: number;
}

export interface SignatureReflection extends Reflection, S<M.SignatureReflection,
      'type'
    | 'overwrites'
    | 'inheritedFrom'
    | 'implementationOf'> {
}

export interface ParameterReflection extends Reflection, S<M.ParameterReflection, 'type' | 'defaultValue'> {
}

export interface DeclarationReflection extends ContainerReflection, S<M.DeclarationReflection,
      'type'
    | 'defaultValue'
    | 'overwrites'
    | 'inheritedFrom'
    | 'extendedTypes'
    | 'extendedBy'
    | 'implementedTypes'
    | 'implementedBy'
    | 'implementationOf'> {
}

export interface TypeParameterReflection extends Reflection, S<M.TypeParameterReflection, 'type'> {
}

// Nothing extra yet.
export interface ProjectReflection extends ContainerReflection { }

export interface ContainerReflection extends Reflection, S<M.ContainerReflection, 'groups' | 'categories'> {
    sources?: ModelToObject<SourceReferenceWrapper[]>;
}

/**
 * If a 3rd party serializer creates a loop when serializing, a pointer will be created
 * instead of re-serializing the [[DeclarationReflection]]
 */
export interface ReflectionPointer extends S<M.Reflection, 'id'> {
}

export interface Reflection extends S<M.Reflection,
      'id'
    | 'name'
    | 'kind'
    | 'comment'
    | 'decorates'> {
    originalName?: M.Reflection['originalName'];
    flags: ReflectionFlags;
    decorators?: ModelToObject<DecoratorWrapper[]>;

    children?: ModelToObject<M.Reflection>[];
    parameters?: ModelToObject<M.Reflection>[];
    typeParameter?: ModelToObject<M.Reflection>[];
    signatures?: ModelToObject<M.Reflection>[];
    indexSignature?: ModelToObject<M.Reflection>[];
    getSignature?: ModelToObject<M.Reflection>[];
    setSignature?: ModelToObject<M.Reflection>[];
}

// Types

export type SomeType =
    | ArrayType
    | ConditionalType
    | IndexedAccessType
    | InferredType
    | IntersectionType
    | IntrinsicType
    | PredicateType
    | ReferenceType
    | ReflectionType
    | StringLiteralType
    | TupleType
    | TypeOperatorType
    | TypeParameterType
    | UnionType
    | UnknownType;

export interface ArrayType extends Type, S<M.ArrayType, 'type' | 'elementType'> {
}

export interface ConditionalType extends Type, S<M.ConditionalType,
    'type' | 'checkType' | 'extendsType' | 'trueType' | 'falseType'> {

}

export interface IndexedAccessType extends Type, S<M.IndexedAccessType, 'type' | 'indexType' | 'objectType'> {
}

export interface InferredType extends Type, S<M.InferredType, 'type' | 'name'> {
}

export interface IntersectionType extends Type, S<M.IntersectionType, 'type' | 'types'> {
}

export interface IntrinsicType extends Type, S<M.IntrinsicType, 'type' | 'name'> {
}

export interface QueryType extends Type, S<M.QueryType, 'type' | 'queryType'> {
}

export interface PredicateType extends Type, S<M.PredicateType, 'type' | 'name' | 'asserts' | 'targetType'> {
}

export interface ReferenceType extends Type, S<M.ReferenceType, 'type' | 'name' | 'typeArguments'> {
    id?: number;
}

export interface ReflectionType extends Type, S<M.ReflectionType, 'type'> {
    declaration?: ModelToObject<M.ReflectionType['declaration']>;
}

export interface StringLiteralType extends Type, S<M.StringLiteralType, 'type' | 'value'> {
}

export interface TupleType extends Type, S<M.TupleType, 'type'> {
    elements?: ModelToObject<M.TupleType['elements']>;
}

export interface TypeOperatorType extends Type, S<M.TypeOperatorType, 'type' | 'operator' | 'target'> {
}

export interface TypeParameterType extends Type, S<M.TypeParameterType, 'type' | 'name' | 'constraint'> {
}

export interface UnionType extends Type, S<M.UnionType, 'type' | 'types'> {
}

export interface UnknownType extends Type, S<M.UnknownType, 'type' | 'name'> {
}

/**
 * Technically not correct, the `type` property will be set by the abstract serializer.
 * But to allow tagged literals, the `type` property is instead defined by each child type.
 */
export interface Type {
}

// Miscellaneous

export interface ReflectionFlags extends Partial<S<M.ReflectionFlags,
      'isPrivate'
    | 'isProtected'
    | 'isPublic'
    | 'isStatic'
    | 'isExported'
    | 'isExternal'
    | 'isOptional'
    | 'isRest'
    | 'hasExportAssignment'
    | 'isConstructorProperty'
    | 'isAbstract'
    | 'isConst'
    | 'isLet'>> {
}

export interface Comment extends Partial<S<M.Comment, 'shortText' | 'text' | 'returns' | 'tags'>> {
}

export interface CommentTag extends S<M.CommentTag, 'text'> {
    tag: M.CommentTag['tagName'];
    param?: M.CommentTag['paramName'];
}

export interface SourceReference extends S<M.SourceReference, 'fileName' | 'line' | 'character'> {
}

export interface Decorator extends S<M.Decorator, 'name' | 'type' | 'arguments'> {
}
