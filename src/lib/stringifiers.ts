import * as t from './models/types';
import * as r from './models/reflections';

const stringifyList = (list: t.Type[], separator: string): string => {
    return list.map(t => stringifyType(t)).join(separator);
};

export const stringifyArray = (node: t.ArrayType): string => {
    const elementTypeStr = stringifyType(node.elementType);
    if (node.elementType instanceof t.UnionType || node.elementType instanceof t.IntersectionType) {
        return `(${elementTypeStr})[]`;
    } else {
        return `${elementTypeStr}[]`;
    }
};

export const stringifyConditional = (node: t.ConditionalType): string => {
    return `${node.checkType} extends ${node.extendsType} ? ${node.trueType} : ${node.falseType}`;
};

export const stringifyIndexedAccess = (node: t.IndexedAccessType): string => {
    return `${stringifyType(node.objectType)}[${stringifyType(node.indexType)}]`;
};

export const stringifyInferred = (node: t.InferredType): string => {
    return `infer ${node.name}`;
};

export const stringifyIntersection = (node: t.IntersectionType): string => {
    return stringifyList(node.types, ' & ');
};

export const stringifyIntrinsic = (node: t.IntrinsicType): string => {
    return node.name;
};

export const stringifyPredicate = (node: t.PredicateType): string => {
    const out = node.asserts ? ['asserts', node.name] : [node.name];
    if (node.targetType) {
        out.push('is', stringifyType(node.targetType));
    }

    return out.join(' ');
};

export const stringifyQuery = (node: t.QueryType): string => {
    return `typeof ${stringifyType(node.queryType)}`;
};

export const stringifyReference = (node: t.ReferenceType): string => {
    const name = node.reflection ? node.reflection.name : node.name;
    let typeArgs = '';
    if (node.typeArguments) {
        typeArgs += '<';
        typeArgs += stringifyList(node.typeArguments, ', ');
        typeArgs += '>';
    }

    return name + typeArgs;
};

export const stringifyReflection = (node: t.ReflectionType): string => {
    if (!node.declaration.children && node.declaration.signatures) {
        return 'function';
    } else {
        return 'object';
    }
};

export const stringifyStringLiteral = (node: t.StringLiteralType): string => {
    return `"${node.value}"`;
};

export const stringifyTuple = (node: t.TupleType): string => {
    return `[${stringifyList(node.elements, ', ')}]`;
};

export const stringifyTypeOperator = (node: t.TypeOperatorType): string => {
    return `${node.operator} ${stringifyType(node.target)}`;
};

export const stringifyTypeParameter = (node: t.TypeParameterType): string => {
    return node.name;
};

export const stringifyUnion = (node: t.UnionType): string => {
    return stringifyList(node.types, ' | ');
};

export const stringifyUnknown = (node: t.UnknownType): string => {
    return node.name;
};

export const stringifyVoid = (): string => {
    return 'void';
};

const stringifiers = {
    array: stringifyArray,
    conditional: stringifyConditional,
    indexedAccess: stringifyIndexedAccess,
    inferred: stringifyInferred,
    intersection: stringifyIntersection,
    intrinsic: stringifyIntrinsic,
    predicate: stringifyPredicate,
    query: stringifyQuery,
    reference: stringifyReference,
    reflection: stringifyReflection,
    stringLiteral: stringifyStringLiteral,
    tuple: stringifyTuple,
    typeOperator: stringifyTypeOperator,
    typeParameter: stringifyTypeParameter,
    union: stringifyUnion,
    unknown: stringifyUnknown,
    void: stringifyVoid
};

/**
 * Return a string representation of the given type.
 */
export const stringifyType = (node: t.Type): string => {
    if (!node || !node.type || !{}.hasOwnProperty.call(stringifiers, node.type)) {
        throw new TypeError(`Cannot stringify type '${node.type}'`);
    }

    return stringifiers[node.type](node);
};

export const stringifyCallSignature = (node: r.SignatureReflection, name = '') => {
    const {
        parameters = [],
        typeParameters = [],
        type
    } = node;

    const types = typeParameters.map(t => t.name).join(', ');

    const params = parameters.map(p => {
        const type = p.type ? ': ' + stringifyType(p.type) : '';
        return `${p.flags.isRest ? '...' : ''}${p.name}${type}`;
    }).join(', ');

    const returns = type ? stringifyType(type) : '';

    const returnToken = name === '' ? ' => ' : ': ';
    const typeParams = types === '' ? '' : ' <' + types + '>';

    return `
        ${name}${typeParams} (${params})${returnToken}${returns}
    `.trim();
};
