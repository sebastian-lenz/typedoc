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
import type { LiteralType, SerializedLiteralType } from "./string-literal";
import type { SerializedTupleType, TupleType } from "./tuple";
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
export { MappedType, SerializedMappedType } from "./mapped";
export {
  ObjectType,
  SerializedObjectType,
  PropertyType,
  SerializedPropertyType,
} from "./object";
export { PredicateType, SerializedPredicateType } from "./predicate";
export { QueryType, SerializedQueryType } from "./query";
export { ReferenceType, SerializedReferenceType } from "./reference";
export {
  SignatureParameterType,
  SerializedSignatureParameterType,
  SignatureType,
  SerializedSignatureType,
  ConstructorType,
  SerializedConstructorType,
} from "./signature";
export { LiteralType, SerializedLiteralType } from "./string-literal";
export { TupleType, SerializedTupleType } from "./tuple";
export { TypeOperatorType, SerializedTypeOperatorType } from "./type-operator";
export {
  TypeParameterType,
  SerializedTypeParameterType,
} from "./type-parameter";
export { UnionType, SerializedUnionType } from "./union";
export { UnknownType, SerializedUnknownType } from "./unknown";

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
}

export type SomeType = TypeKindToModel[TypeKind];

export type TypeToSerialized<T> = T extends SomeType
  ? TypeKindToSerialized[T["kind"]]
  : T;
