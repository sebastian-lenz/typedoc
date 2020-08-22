import type { TypeKind } from "./abstract";
import type { ArrayType, SerializedArrayType } from "./array";
import type { ConditionalType, SerializedConditionalType } from "./conditional";
import type {
  IndexedAccessType,
  SerializedIndexedAccessType,
} from "./indexed-access";
import type { InferredType, SerializedInferredType } from "./inferred";
import type {
  IntersectionType,
  SerializedIntersectionType,
} from "./intersection";
import type { IntrinsicType, SerializedIntrinsicType } from "./intrinsic";
import type { LiteralType, SerializedLiteralType } from "./literal";
import type { MappedType, SerializedMappedType } from "./mapped";
import type {
  ObjectType,
  PropertyType,
  SerializedObjectType,
  SerializedPropertyType,
} from "./object";
import type { PredicateType, SerializedPredicateType } from "./predicate";
import type { QueryType, SerializedQueryType } from "./query";
import type { ReferenceType, SerializedReferenceType } from "./reference";
import type {
  ConstructorType,
  SerializedConstructorType,
  SerializedSignatureParameterType,
  SerializedSignatureType,
  SignatureParameterType,
  SignatureType,
} from "./signature";
import type { SerializedTupleType, TupleType } from "./tuple";
import type {
  SerializedTupleNamedMemberType,
  TupleNamedMemberType,
} from "./tuple-member";
import type {
  SerializedTypeOperatorType,
  TypeOperatorType,
} from "./type-operator";
import type {
  SerializedTypeParameterType,
  TypeParameterType,
} from "./type-parameter";
import type { SerializedUnionType, UnionType } from "./union";
import type { SerializedUnknownType, UnknownType } from "./unknown";

export { Type, TypeKind } from "./abstract";
export { ArrayType, SerializedArrayType } from "./array";
export { ConditionalType, SerializedConditionalType } from "./conditional";
export {
  IndexedAccessType,
  SerializedIndexedAccessType,
} from "./indexed-access";
export { InferredType, SerializedInferredType } from "./inferred";
export { IntersectionType, SerializedIntersectionType } from "./intersection";
export { IntrinsicType, SerializedIntrinsicType } from "./intrinsic";
export { LiteralType, SerializedLiteralType } from "./literal";
export { MappedType, SerializedMappedType } from "./mapped";
export {
  ObjectType,
  PropertyType,
  SerializedObjectType,
  SerializedPropertyType,
} from "./object";
export { PredicateType, SerializedPredicateType } from "./predicate";
export { QueryType, SerializedQueryType } from "./query";
export { ReferenceType, SerializedReferenceType } from "./reference";
export {
  ConstructorType,
  SerializedConstructorType,
  SerializedSignatureParameterType,
  SerializedSignatureType,
  SignatureParameterType,
  SignatureType,
} from "./signature";
export { SerializedTupleType, TupleType } from "./tuple";
export {
  SerializedTupleNamedMemberType,
  TupleNamedMemberType,
} from "./tuple-member";
export { SerializedTypeOperatorType, TypeOperatorType } from "./type-operator";
export {
  SerializedTypeParameterType,
  TypeParameterType,
} from "./type-parameter";
export { SerializedUnionType, UnionType } from "./union";
export { SerializedUnknownType, UnknownType } from "./unknown";

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
  [TypeKind.Constructor]: ConstructorType;
  [TypeKind.SignatureParameter]: SignatureParameterType;
  [TypeKind.Literal]: LiteralType;
  [TypeKind.Tuple]: TupleType;
  [TypeKind.TypeOperator]: TypeOperatorType;
  [TypeKind.TypeParameter]: TypeParameterType;
  [TypeKind.Union]: UnionType;
  [TypeKind.Unknown]: UnknownType;
  [TypeKind.Mapped]: MappedType;
  [TypeKind.TupleMember]: TupleNamedMemberType;
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
  [TypeKind.Constructor]: SerializedConstructorType;
  [TypeKind.SignatureParameter]: SerializedSignatureParameterType;
  [TypeKind.Literal]: SerializedLiteralType;
  [TypeKind.Tuple]: SerializedTupleType;
  [TypeKind.TypeOperator]: SerializedTypeOperatorType;
  [TypeKind.TypeParameter]: SerializedTypeParameterType;
  [TypeKind.Union]: SerializedUnionType;
  [TypeKind.Unknown]: SerializedUnknownType;
  [TypeKind.Mapped]: SerializedMappedType;
  [TypeKind.TupleMember]: SerializedTupleNamedMemberType;
}

export type SomeType = TypeKindToModel[TypeKind];

export type TypeToSerialized<T> = T extends SomeType
  ? TypeKindToSerialized[T["kind"]]
  : T;
