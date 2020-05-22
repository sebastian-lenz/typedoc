import type { ArrayType } from './array';
import type { ConditionalType } from './conditional';
import type { IndexedAccessType } from './indexed-access';
import type { InferredType } from './inferred';
import type { IntersectionType } from './intersection';
import type { IntrinsicType } from './intrinsic';
import type { ObjectType, PropertyType } from './object';
import type { PredicateType } from './predicate';
import type { QueryType } from './query';
import type { ReferenceType } from './reference';
import type { SignatureParameterType, SignatureType } from './signature';
import type { StringLiteralType } from './string-literal';
import type { TupleType } from './tuple';
import type { TypeOperatorType } from './type-operator';
import type { TypeParameterType } from './type-parameter';
import type { UnionType } from './union';
import type { UnknownType } from './unknown';

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

export type SomeType =
    | ArrayType
    | ConditionalType
    | IndexedAccessType
    | InferredType
    | IntersectionType
    | IntrinsicType
    | ObjectType
    | PredicateType
    | PropertyType
    | QueryType
    | ReferenceType
    | SignatureParameterType
    | SignatureType
    | StringLiteralType
    | TupleType
    | TypeOperatorType
    | TypeParameterType
    | UnionType
    | UnknownType;
