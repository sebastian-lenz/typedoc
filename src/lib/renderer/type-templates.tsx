import { createElement, VNode, Fragment, ComponentChild } from "preact";
import { TypeKind, TypeKindToModel } from "../models";
import type { TypeProps } from "./templates";
import { OptionalModifier } from "../models/types/mapped";

function wrap(wrapped: boolean | undefined, node: VNode) {
  if (wrapped) {
    return <Fragment>({node})</Fragment>;
  }
  return node;
}

export const TypeTemplates: {
  [K in TypeKind]: (props: TypeProps<TypeKindToModel[K]>) => VNode;
} = {
  [TypeKind.Array](props) {
    const { type, templates } = props;
    return (
      <Fragment>
        <templates.Type {...props} type={type.elementType} />
        []
      </Fragment>
    );
  },
  [TypeKind.Conditional](props) {
    const { type, wrapped, templates } = props;
    return wrap(
      wrapped,
      <Fragment>
        <templates.Type {...props} type={type.checkType} wrapped />
        {" extends "}
        <templates.Type {...props} type={type.extendsType} wrapped />
        {" ? "}
        <templates.Type {...props} type={type.trueType} wrapped />
        {" : "}
        <templates.Type {...props} type={type.falseType} wrapped />
      </Fragment>
    );
  },
  [TypeKind.IndexedAccess](props) {
    const { type, templates } = props;
    return (
      <Fragment>
        <templates.Type {...props} type={type.objectType} wrapped />
        [<templates.Type {...props} type={type.indexType} />]
      </Fragment>
    );
  },
  [TypeKind.Inferred](props) {
    return wrap(props.wrapped, <Fragment>infer {props.type.name}</Fragment>);
  },
  [TypeKind.Intersection](props) {
    const { type, templates } = props;
    const children: ComponentChild[] = type.types.map((type) => (
      <templates.Type {...props} type={type} wrapped />
    ));
    for (let i = 1; i < children.length; i += 2) {
      children.splice(i, 0, " & ");
    }
    return wrap(props.wrapped, <Fragment>{children}</Fragment>);
  },
  [TypeKind.Intrinsic](props) {
    return <Fragment>{props.type.name}</Fragment>;
  },
  [TypeKind.Literal](props) {
    const { type } = props;

    if (typeof type.value === "object") {
      return (
        <Fragment>
          {type.value.negative ? "-" : ""}
          {type.value.value}n
        </Fragment>
      );
    }

    return <Fragment>{JSON.stringify(type.value)}</Fragment>;
  },
  [TypeKind.Mapped](props) {
    const { type, templates } = props;
    const children: ComponentChild[] = [
      "{",
      {
        [OptionalModifier.None]: " ",
        [OptionalModifier.Add]: " readonly ",
        [OptionalModifier.Remove]: " -readonly ",
      }[type.readonlyModifier],
      `[${type.parameter.name} in `,
      <templates.Type {...props} type={type.parameter.constraint} />,
      "]",
      {
        [OptionalModifier.None]: ": ",
        [OptionalModifier.Add]: "?: ",
        [OptionalModifier.Remove]: "-?: ",
      }[type.optionalModifier],
      <templates.Type {...props} type={type.type} />,
      " }",
    ];

    return <Fragment>{children}</Fragment>;
  },
  [TypeKind.Object](props) {
    const { type, templates } = props;

    const members: ComponentChild[] = [
      ...type.properties.map((prop) => (
        <templates.Type {...props} type={prop} />
      )),
      ...type.signatures.map((prop) => (
        <templates.Type {...props} type={prop} />
      )),
      ...type.constructSignatures.map((prop) => (
        <templates.Type {...props} type={prop} />
      )),
    ];
    for (let i = 1; i < members.length; i += 2) {
      members.splice(i, 0, "; ");
    }

    return (
      <Fragment>
        {"{ "}
        {members}
        {" }"}
      </Fragment>
    );
  },
  [TypeKind.Property](props) {
    const { type, templates } = props;
    const children: ComponentChild[] = [];
    if (type.isReadonly) {
      children.push("readonly ");
    }
    children.push(type.name, type.isOptional ? "?: " : ": ");
    children.push(<templates.Type {...props} type={type.propertyType} />);

    return <Fragment>{children}</Fragment>;
  },
  [TypeKind.Predicate](props) {
    const { type, templates } = props;

    const children: ComponentChild[] = type.asserts
      ? ["asserts ", type.name]
      : [type.name];
    if (type.targetType) {
      children.push(
        " is ",
        <templates.Type {...props} type={type.targetType} />
      );
    }

    return <Fragment>{children}</Fragment>;
  },
  [TypeKind.Query](props) {
    const { type, templates } = props;
    return (
      <Fragment>
        typeof <templates.Type {...props} type={type.queryType} />
      </Fragment>
    );
  },
  [TypeKind.Reference](props) {
    const { type, reflection, templates, router } = props;

    const name = type.reflection ? (
      <a href={router.createLink(reflection, type.reflection)}>
        {type.reflection.name}
      </a>
    ) : (
      type.name
    );

    const typeArgs: ComponentChild[] = type.typeArguments.map((arg) => (
      <templates.Type {...props} type={arg} />
    ));
    for (let i = 1; i < typeArgs.length; i += 2) {
      typeArgs.splice(i, 0, ", ");
    }
    if (typeArgs.length) {
      typeArgs.unshift("<");
      typeArgs.push(">");
    }

    return (
      <Fragment>
        {name}
        {typeArgs}
      </Fragment>
    );
  },
  [TypeKind.Signature](props) {
    const { type, templates } = props;

    const parameters: ComponentChild[] = type.parameters.map((param) => (
      <templates.Type {...props} type={param} />
    ));
    for (let i = 1; i < parameters.length; i += 2) {
      parameters.splice(i, 0, ", ");
    }
    parameters.unshift("(");
    parameters.push(")");

    return wrap(
      props.wrapped,
      <Fragment>
        <templates.TypeParameters {...props} params={type.typeParameters} />
        {parameters}:
        <templates.Type {...props} type={type.returnType} />
      </Fragment>
    );
  },
  [TypeKind.Constructor](props) {
    const { type, templates } = props;

    const parameters: ComponentChild[] = type.parameters.map((param) => (
      <templates.Type {...props} type={param} />
    ));
    for (let i = 1; i < parameters.length; i += 2) {
      parameters.splice(i, 0, ", ");
    }
    parameters.unshift("(");
    parameters.push(")");

    return wrap(
      props.wrapped,
      <Fragment>
        new
        <templates.TypeParameters {...props} params={type.typeParameters} />
        {parameters}:
        <templates.Type {...props} type={type.returnType} />
      </Fragment>
    );
  },
  [TypeKind.SignatureParameter](props) {
    const { type, templates } = props;
    const children: ComponentChild[] = [];

    if (type.isRest) {
      children.push("...");
    }
    children.push(type.name, type.isOptional ? "?: " : ": ");
    children.push(<templates.Type {...props} type={type.parameterType} />);

    return <Fragment>{children}</Fragment>;
  },
  [TypeKind.Tuple](props) {
    const { type, templates } = props;
    const children: ComponentChild[] = type.elements.map((type) => (
      <templates.Type {...props} type={type} />
    ));
    for (let i = 1; i < children.length; i += 2) {
      children.splice(i, 0, ", ");
    }
    return <Fragment>[{children}]</Fragment>;
  },
  [TypeKind.TypeOperator](props) {
    const { type, templates } = props;
    return (
      <Fragment>
        {type.operator} <templates.Type {...props} type={type.target} />
      </Fragment>
    );
  },
  [TypeKind.TypeParameter](props) {
    const { type, templates } = props;
    const children: ComponentChild[] = [type.name];

    if (type.constraint) {
      children.push(
        " extends ",
        <templates.Type {...props} type={type.constraint} />
      );
    }
    if (type.defaultValue) {
      children.push(
        " = ",
        <templates.Type {...props} type={type.defaultValue} />
      );
    }

    return <Fragment>{children}</Fragment>;
  },
  [TypeKind.Union](props) {
    const { type, templates } = props;
    const children: ComponentChild[] = type.types.map((type) => (
      <templates.Type {...props} type={type} wrapped />
    ));
    for (let i = 1; i < children.length; i += 2) {
      children.splice(i, 0, " | ");
    }
    return wrap(props.wrapped, <Fragment>{children}</Fragment>);
  },
  [TypeKind.Unknown](props) {
    return <Fragment>{props.type.name}</Fragment>;
  },
};
