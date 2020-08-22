import { TypeKind, TypeKindToModel, Reflection, SomeType } from "../models";
import type { TypeProps } from "./templates";
import { OptionalModifier } from "../models/types/mapped";

function wrap(wrapped: boolean | undefined, text: string) {
  if (wrapped) {
    return `(${text})`;
  }
  return text;
}

function toString(
  props: TypeProps<SomeType> & { linkTargets: (Reflection | string)[] }
) {
  // Cast is necessary due to discriminated unions not playing well with an intersection.
  return TypeTemplates[props.type.kind](props as never);
}

export const TypeTemplates: {
  [K in TypeKind]: (
    props: TypeProps<TypeKindToModel[K]> & {
      linkTargets: (Reflection | string)[];
    }
  ) => string;
} = {
  [TypeKind.Array](props) {
    return (
      toString({ ...props, type: props.type.elementType, wrapped: true }) + "[]"
    );
  },
  [TypeKind.Conditional](props) {
    const { type, wrapped } = props;
    return wrap(
      wrapped,
      toString({ ...props, wrapped: true, type: type.checkType }) +
        " extends " +
        toString({ ...props, wrapped: true, type: type.extendsType }) +
        " ? " +
        toString({ ...props, wrapped: true, type: type.trueType }) +
        " : " +
        toString({ ...props, wrapped: true, type: type.falseType })
    );
  },
  [TypeKind.IndexedAccess](props) {
    const { type } = props;
    return (
      toString({ ...props, type: type.objectType, wrapped: true }) +
      "[" +
      toString({ ...props, type: type.indexType, wrapped: false }) +
      "]"
    );
  },
  [TypeKind.Inferred](props) {
    return wrap(props.wrapped, `infer ${props.type.name}`);
  },
  [TypeKind.Intersection](props) {
    const { type } = props;
    const children = type.types.map((type) =>
      toString({ ...props, type, wrapped: true })
    );
    return wrap(props.wrapped, children.join(" & "));
  },
  [TypeKind.Intrinsic](props) {
    return props.type.name;
  },
  [TypeKind.Literal](props) {
    const { type } = props;

    if (typeof type.value === "object" && type.value) {
      return `${type.value.negative ? "-" : ""}${type.value.value}n`;
    }

    return JSON.stringify(type.value);
  },
  [TypeKind.Mapped](props) {
    const { type, linkTargets } = props;
    linkTargets.push(type.parameter.name);
    const children = [
      "{",
      {
        [OptionalModifier.None]: " ",
        [OptionalModifier.Add]: " readonly ",
        [OptionalModifier.Remove]: " -readonly ",
      }[type.readonlyModifier],
      `[${type.parameter.name} in `,
      toString({ ...props, type: type.parameter.constraint }),
      "]",
      {
        [OptionalModifier.None]: ": ",
        [OptionalModifier.Add]: "?: ",
        [OptionalModifier.Remove]: "-?: ",
      }[type.optionalModifier],
      toString({ ...props, type: type.type }),
      " }",
    ];

    return children.join("");
  },
  [TypeKind.Object](props) {
    const { type } = props;

    const members = [
      ...type.properties.map((prop) => toString({ ...props, type: prop })),
      ...type.signatures.map((prop) => toString({ ...props, type: prop })),
      ...type.constructSignatures.map((prop) =>
        toString({ ...props, type: prop })
      ),
    ];
    return `{ ${members.join(", ")} }`;
  },
  [TypeKind.Property](props) {
    const { type } = props;
    const children: string[] = [];
    if (type.isReadonly) {
      children.push("readonly ");
    }
    // Checking if it is a valid identifier & thus doesn't need to be quoted is... ridiculuous.
    // Instead, use an intentionally simplistic check. https://stackoverflow.com/a/9337047/7186598
    if (/^[A-Za-z0-9_$]+$/.test(type.name)) {
      children.push(type.name);
    } else {
      children.push(JSON.stringify(type.name));
    }
    children.push(type.isOptional ? "?: " : ": ");
    children.push(toString({ ...props, type: type.propertyType }));

    return children.join("");
  },
  [TypeKind.Predicate](props) {
    const { type, linkTargets } = props;

    linkTargets.push(type.name);
    const children = type.asserts ? ["asserts ", type.name] : [type.name];
    if (type.targetType) {
      children.push(" is ", toString({ ...props, type: type.targetType }));
    }

    return children.join("");
  },
  [TypeKind.Query](props) {
    const { type } = props;
    return `typeof ${toString({ ...props, type: type.queryType })}`;
  },
  [TypeKind.Reference](props) {
    const { type, linkTargets } = props;

    linkTargets.push(type.reflection ?? type.name);

    let typeArgs = type.typeArguments
      .map((arg) => toString({ ...props, type: arg }))
      .join(", ");
    if (typeArgs.length) {
      typeArgs = `<${typeArgs}>`;
    }

    return `${type.reflection?.name ?? type.name}${typeArgs}`;
  },
  [TypeKind.Signature](props) {
    const { type } = props;

    const parameters = type.parameters
      .map((param) => toString({ ...props, type: param }))
      .join(", ");

    let typeParameters = type.typeParameters
      .map((param) => toString({ ...props, type: param }))
      .join(", ");
    if (typeParameters.length) {
      typeParameters = `<${typeParameters}>`;
    }

    return wrap(
      props.wrapped,
      `${typeParameters}(${parameters}): ${toString({
        ...props,
        type: type.returnType,
      })}`
    );
  },
  [TypeKind.Constructor](props) {
    const { type } = props;

    const parameters = type.parameters
      .map((param) => toString({ ...props, type: param }))
      .join(", ");

    let typeParameters = type.typeParameters
      .map((param) => toString({ ...props, type: param }))
      .join(", ");
    if (typeParameters.length) {
      typeParameters = `<${typeParameters}>`;
    }

    return wrap(
      props.wrapped,
      `new ${typeParameters}(${parameters}): ${toString({
        ...props,
        type: type.returnType,
      })}`
    );
  },
  [TypeKind.SignatureParameter](props) {
    const { type, linkTargets } = props;
    const children: string[] = [];

    if (type.isRest) {
      children.push("...");
    }
    linkTargets.push(type.name);
    children.push(type.name, type.isOptional ? "?: " : ": ");
    children.push(toString({ ...props, type: type.parameterType }));

    return children.join("");
  },
  [TypeKind.Tuple](props) {
    const { type } = props;
    return `[${type.elements.map((type) => toString({ ...props, type }))}]`;
  },
  [TypeKind.TupleMember](props) {
    const { type, linkTargets } = props;
    linkTargets.push(type.name);
    const opt = type.isOptional ? "?" : "";
    return `${type.name}${opt}: ${toString({ ...props, type: type.type })}`;
  },
  [TypeKind.TypeOperator](props) {
    const { type } = props;
    return `${type.operator} ${toString({ ...props, type: type.target })}`;
  },
  [TypeKind.TypeParameter](props) {
    const { type, linkTargets } = props;
    linkTargets.push(type.name);
    const children = [type.name];

    if (type.constraint) {
      children.push(" extends ", toString({ ...props, type: type.constraint }));
    }
    if (type.defaultValue) {
      children.push(" = ", toString({ ...props, type: type.defaultValue }));
    }

    return children.join("");
  },
  [TypeKind.Union](props) {
    const { type } = props;
    const children = type.types.map((type) =>
      toString({ ...props, type, wrapped: true })
    );
    return wrap(props.wrapped, children.join(" | "));
  },
  [TypeKind.Unknown](props) {
    // Ideally we should never run into this code. If we do, we might have broken links
    // in the type displayed after this type...
    return props.type.name;
  },
};
