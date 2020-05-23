import type { ArrayType, SerializedArrayType } from './array';
import type { ConditionalType, SerializedConditionalType } from './conditional';
import type { IndexedAccessType, SerializedIndexedAccessType } from './indexed-access';
import type { InferredType, SerializedInferredType } from './inferred';
import type { IntersectionType, SerializedIntersectionType } from './intersection';
import type { IntrinsicType, SerializedIntrinsicType } from './intrinsic';
import type { ObjectType, PropertyType, SerializedObjectType, SerializedPropertyType } from './object';
import type { PredicateType, SerializedPredicateType } from './predicate';
import type { QueryType, SerializedQueryType } from './query';
import type { ReferenceType, SerializedReferenceType } from './reference';
import type { SignatureParameterType, SignatureType, SerializedSignatureType, SerializedSignatureParameterType } from './signature';
import type { StringLiteralType, SerializedStringLiteralType } from './string-literal';
import type { TupleType, SerializedTupleType } from './tuple';
import type { TypeOperatorType, SerializedTypeOperatorType } from './type-operator';
import type { TypeParameterType, SerializedTypeParameterType } from './type-parameter';
import type { UnionType, SerializedUnionType } from './union';
import type { UnknownType, SerializedUnknownType } from './unknown';
import type { TypeKind } from './abstract';

export { Type, TypeKind } from './abstract';
export { ArrayType } from './array';
export { ConditionalType } from './conditional';
export { IndexedAccessType } from './indexed-access';
export { InferredType } from './inferred';
export { IntersectionType } from './intersection';
export { IntrinsicType } from './intrinsic';
export { ObjectType, PropertyType } from './object';
export { PredicateType } from './predicate';
export { QueryType } from './query';
export { ReferenceType } from './reference';
export { SignatureParameterType, SignatureType } from './signature';
export { StringLiteralType } from './string-literal';
export { TupleType } from './tuple';
export { TypeOperatorType } from './type-operator';
export { TypeParameterType } from './type-parameter';
export { UnionType } from './union';
export { UnknownType } from './unknown';

export interface TypeKindToModel {
    [TypeKind.Array]: ArrayType;
    [TypeKind.Conditional]: ConditionalType;
    [TypeKind.IndexedAccess]: IndexedAccessType;
    [TypeKind.Inferred]: InferredType;
    [TypeKind.Intersection]: IntersectionType;
    [TypeKind.Intrinsic]: IntrinsicType;
    [TypeKind.Object]: ObjectType;
    [TypeKind.Predicate]: PredicateType;
    [TypeKind.Property]: PropertyType;
    [TypeKind.Query]: QueryType;
    [TypeKind.Reference]: ReferenceType;
    [TypeKind.Signature]: SignatureType;
    [TypeKind.SignatureParameter]: SignatureParameterType;
    [TypeKind.StringLiteral]: StringLiteralType;
    [TypeKind.Tuple]: TupleType;
    [TypeKind.TypeOperator]: TypeOperatorType;
    [TypeKind.TypeParameter]: TypeParameterType;
    [TypeKind.Union]: UnionType;
    [TypeKind.Unknown]: UnknownType;
}

export interface TypeKindToSerialized {
    [TypeKind.Array]: SerializedArrayType;
    [TypeKind.Conditional]: SerializedConditionalType;
    [TypeKind.IndexedAccess]: SerializedIndexedAccessType;
    [TypeKind.Inferred]: SerializedInferredType;
    [TypeKind.Intersection]: SerializedIntersectionType;
    [TypeKind.Intrinsic]: SerializedIntrinsicType;
    [TypeKind.Object]: SerializedObjectType;
    [TypeKind.Predicate]: SerializedPredicateType;
    [TypeKind.Property]: SerializedPropertyType;
    [TypeKind.Query]: SerializedQueryType;
    [TypeKind.Reference]: SerializedReferenceType;
    [TypeKind.Signature]: SerializedSignatureType;
    [TypeKind.SignatureParameter]: SerializedSignatureParameterType;
    [TypeKind.StringLiteral]: SerializedStringLiteralType;
    [TypeKind.Tuple]: SerializedTupleType;
    [TypeKind.TypeOperator]: SerializedTypeOperatorType;
    [TypeKind.TypeParameter]: SerializedTypeParameterType;
    [TypeKind.Union]: SerializedUnionType;
    [TypeKind.Unknown]: SerializedUnknownType;
}

export type SomeType = TypeKindToModel[TypeKind];

export type TypeToSerialized<T> = T extends SomeType ? TypeKindToSerialized[T['kind']] : T;
