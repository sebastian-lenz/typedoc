import * as assert from "assert";
import { createElement, VNode, Fragment } from "preact";
import { Templates, TemplateProps } from "./templates";
import {
  ReflectionKind,
  ReflectionKindToModel,
  SomeReflection,
} from "../models";

// See the Templates interface for doc comments.
// TODO: Lots to do to make this good yet.

// TODO: Color scheme
// window.matchMedia('(prefers-color-scheme: dark)').matches / .addEventListener

const kindNames: Record<ReflectionKind, string> = {
  [ReflectionKind.Project]: "", // We just want to display the name.
  [ReflectionKind.Module]: "Module",
  [ReflectionKind.Namespace]: "Namespace",
  [ReflectionKind.Enum]: "Enumeration",
  [ReflectionKind.EnumMember]: "Enumeration Member",
  [ReflectionKind.Variable]: "Variable",
  [ReflectionKind.Function]: "Function",
  [ReflectionKind.Class]: "Class",
  [ReflectionKind.Interface]: "Interface",
  [ReflectionKind.Object]: "Object",
  [ReflectionKind.Property]: "Property",
  [ReflectionKind.Accessor]: "Accessor",
  [ReflectionKind.Method]: "Method",
  [ReflectionKind.Signature]: "Signature",
  [ReflectionKind.Parameter]: "Parameter",
  [ReflectionKind.Alias]: "Type Alias",
  [ReflectionKind.Reference]: "Reference",
};

export const defaultTemplates: Templates = {
  Page(props) {
    const { reflection, templates, hooks } = props;
    return (
      <html>
        <head>
          {hooks.emit("head.begin", reflection)}
          <meta charSet="utf-8" />
          <meta
            name="description"
            content={`Documentation for ${reflection.project?.name}`}
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="generator" content="typedoc" />
          <title>
            {reflection.isProject()
              ? reflection.name
              : `${reflection.name} | ${reflection.project?.name}`}
          </title>
          <link
            rel="stylesheet"
            href={props.router.createAssetLink(reflection, "style.css")}
          />
          <link
            rel="stylesheet"
            href={props.router.createAssetLink(reflection, "theme.css")}
          />
          {hooks.emit("head.end", reflection)}
        </head>
        <body>
          <script>
            const loads = +localStorage.getItem('loads') || 0;
            localStorage.setItem('loads', loads + 1); if (loads % 2)
            document.body.classList.add('dark')
          </script>
          {hooks.emit("body.begin", reflection)}
          <templates.Header {...props} />
          <main>
            <templates.Navigation {...props} />
            <section id="main">
              <templates.Reflection {...props} />
            </section>
          </main>
          <templates.Footer {...props} />
          {hooks.emit("body.end", reflection)}
        </body>
      </html>
    );
  },

  Header(props) {
    const { templates, reflection, router } = props;
    assert(reflection.project);

    let displayName = reflection.name;
    if (
      reflection.kindOf(ReflectionKind.Class, ReflectionKind.Interface) &&
      reflection.typeParameters.length
    ) {
      displayName += `<${reflection.typeParameters
        .map((param) => param.toString())
        .join(", ")}>`;
    }

    return (
      <header>
        <div class="toolbar">
          <a href={router.createLink(reflection, reflection.project)}>
            {reflection.project.name}
          </a>
          <input id="search" placeholder="Click or press S for search" />
        </div>
        <div class="title">
          <templates.Breadcrumbs {...props} />
          <h1>
            {kindNames[reflection.kind]} {displayName}
          </h1>
        </div>
      </header>
    );
  },

  Navigation({ reflection, router }) {
    let navMembers: SomeReflection[];
    // Special case for use with a single entry point, we go straight from the project to the entry point's members.
    if (reflection.isProject() && reflection.children.length === 1) {
      navMembers = reflection.children[0].children;
    } else if (router.hasOwnDocument(reflection) && reflection.isContainer()) {
      navMembers = reflection.children;
    } else {
      assert(reflection.parent && reflection.parent.isContainer());
      navMembers = reflection.parent.children;
    }

    return (
      <nav>
        <ul>
          {navMembers.map((member) => (
            <li>
              <a href={router.createLink(reflection, member)}>{member.name}</a>
            </li>
          ))}
        </ul>
      </nav>
    );
  },

  Breadcrumbs({ reflection, router }) {
    const path: SomeReflection[] = [];
    let iter = reflection.parent;
    while (iter) {
      path.unshift(iter);
      iter = iter.parent;
    }

    if (path.length < 1) {
      return <Fragment />;
    }

    return (
      <ul class="breadcrumbs">
        {path.map((refl) => (
          <li>
            <a href={router.createLink(reflection, refl)}>{refl.name}</a>
          </li>
        ))}
      </ul>
    );
  },

  Footer() {
    // TODO hideGenerator, legend
    return (
      <footer>
        <p>
          Generated using{" "}
          <a href="https://typedoc.org/" target="_blank">
            TypeDoc
          </a>
        </p>
      </footer>
    );
  },

  // TODO: This needs to group according to categories.
  PageChildren(props) {
    const { router, reflection, templates } = props;
    return (
      <Fragment>
        {router.getChildrenInPage(reflection).map((child) => (
          <Fragment>
            <h3>
              {kindNames[child.kind]} {child.name}
            </h3>
            <templates.Reflection {...props} reflection={child} />
          </Fragment>
        ))}
      </Fragment>
    );
  },

  Reflection(props) {
    const { reflection, templates, hooks, router } = props;

    const templateMap: {
      [K in ReflectionKind]: (
        props: TemplateProps<ReflectionKindToModel[K]>
      ) => VNode;
    } = {
      [ReflectionKind.Project]: templates.Project,
      [ReflectionKind.Module]: templates.Module,
      [ReflectionKind.Namespace]: templates.Namespace,
      [ReflectionKind.Enum]: templates.Enum,
      [ReflectionKind.EnumMember]: templates.EnumMember,
      [ReflectionKind.Variable]: templates.Variable,
      [ReflectionKind.Function]: templates.Function,
      [ReflectionKind.Class]: templates.Class,
      [ReflectionKind.Interface]: templates.Interface,
      [ReflectionKind.Object]: templates.Object,
      [ReflectionKind.Property]: templates.Property,
      [ReflectionKind.Accessor]: templates.Accessor,
      [ReflectionKind.Method]: templates.Method,
      [ReflectionKind.Signature]: templates.Signature,
      [ReflectionKind.Parameter]: templates.Parameter,
      [ReflectionKind.Alias]: templates.TypeAlias,
      [ReflectionKind.Reference]: templates.Reference,
    };

    const Template = templateMap[reflection.kind];

    if (!Template) {
      const kindString =
        reflection.kind in ReflectionKind
          ? ReflectionKind.toKindString(reflection.kind)
          : `${reflection.kind}`;
      throw new Error(
        `Invalid reflection kind ${kindString} for reflection ${reflection.getFullName()}`
      );
    }

    return (
      <Fragment>
        {hooks.emit("reflection.before", reflection)}
        <div
          class={`reflection reflection-${ReflectionKind.toKindString(
            reflection.kind
          )}`}
          id={router.createSlug(reflection) || "#"} // Empty ID isn't valid HTML, and the slugger won't produce a `#`
        >
          {hooks.emit("reflection.begin", reflection)}
          <Template
            {...props}
            // Discriminated unions don't play nicely here... TS infers the required type to be `never`
            reflection={reflection as never}
          />
          {hooks.emit("reflection.end", reflection)}
        </div>
        {hooks.emit("reflection.after", reflection)}
      </Fragment>
    );
  },

  Comment({ reflection, parseMarkdown }) {
    const comment = reflection.comment;
    if (!comment) {
      return <Fragment />;
    }

    const parsed = parseMarkdown(
      `${comment.shortText}\n\n${comment.text}`,
      reflection
    );
    const rendered = (
      <div
        class="comment markdown"
        dangerouslySetInnerHTML={{ __html: parsed }}
      />
    );

    if (comment.tags?.length) {
      return (
        <Fragment>
          {rendered}
          <dl class="comment-tags">
            {comment.tags.map((tag) => (
              <Fragment>
                <dt>{tag.tagName}</dt>
                <dd
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(tag.text, reflection),
                  }}
                ></dd>
              </Fragment>
            ))}
          </dl>
        </Fragment>
      );
    }

    return rendered;
  },

  Project(props) {
    const { reflection, templates, parseMarkdown } = props;

    return (
      <Fragment>
        <div
          class="markdown"
          dangerouslySetInnerHTML={{
            __html: parseMarkdown(reflection.readme, reflection),
          }}
        />
        <templates.PageChildren {...props} />
      </Fragment>
    );
  },

  Module(props) {
    const { templates } = props;

    // TODO: Index.
    return (
      <Fragment>
        <templates.Comment {...props} />
        <templates.PageChildren {...props} />
      </Fragment>
    );
  },
  Namespace(props) {
    const { templates } = props;

    return (
      <Fragment>
        <templates.Comment {...props} />
        <templates.PageChildren {...props} />
      </Fragment>
    );
  },
  Interface(props) {
    const { reflection } = props;

    return <Fragment>TODO {reflection.name}</Fragment>;
  },
  TypeAlias(props) {
    const { reflection } = props;

    return <Fragment>TODO {reflection.name}</Fragment>;
  },
  Enum(props) {
    const { reflection } = props;

    return <Fragment>TODO {reflection.name}</Fragment>;
  },
  EnumMember(props) {
    const { reflection } = props;

    return <Fragment>TODO {reflection.name}</Fragment>;
  },
  Function(props) {
    const { reflection, templates } = props;

    return (
      <Fragment>
        {reflection.children.map((s) => {
          return <templates.Reflection {...props} reflection={s} />;
        })}
      </Fragment>
    );
  },
  Class(props) {
    const { reflection } = props;

    return <Fragment>TODO {reflection.name}</Fragment>;
  },
  Object(props) {
    const { reflection } = props;

    return <Fragment>TODO {reflection.name}</Fragment>;
  },
  Method(props) {
    const { reflection } = props;

    return <Fragment>TODO {reflection.name}</Fragment>;
  },
  Property(props) {
    const { reflection } = props;

    return <Fragment>TODO {reflection.name}</Fragment>;
  },
  Accessor(props) {
    const { reflection } = props;

    return <Fragment>TODO {reflection.name}</Fragment>;
  },
  Variable(props) {
    const { reflection } = props;

    return <Fragment>TODO {reflection.name}</Fragment>;
  },
  Signature(props) {
    const { reflection, templates } = props;

    const typeArgs = reflection.typeParameters.length
      ? `<${reflection.typeParameters.map((param) => param.toString())}>`
      : "";

    const parameters = reflection.parameters
      .map((s) => {
        const rest = s.isRest ? "..." : "";
        const sep = s.isOptional ? "?: " : ": ";
        const init = s.defaultValue == null ? "" : ` = ${s.defaultValue}`;
        return rest + s.name + sep + s.type.toString() + init;
      })
      .join(", ");

    const signature = `${reflection.name}${typeArgs}(${parameters}): ${reflection.returnType}`;

    const renderedParameters = reflection.parameters.length && (
      <Fragment>
        <h4>Parameters</h4>
        <ul>
          {reflection.parameters.map((p) => (
            <li>
              <templates.Reflection {...props} reflection={p} />
            </li>
          ))}
        </ul>
      </Fragment>
    );

    return (
      <Fragment>
        <div class="signature">{signature}</div>
        <templates.Comment {...props} />
        {renderedParameters}
      </Fragment>
    );
  },
  Parameter(props) {
    const { reflection, templates } = props;
    return (
      <Fragment>
        <b>{reflection.name}</b>: {reflection.type.toString()}
        <br />
        <templates.Comment {...props} />
      </Fragment>
    );
  },
  Reference({ reflection, router }) {
    const referenced = reflection.resolve();
    if (referenced) {
      return (
        <Fragment>
          Re-export{" "}
          <a href={router.createLink(reflection, referenced)}>
            {reflection.name}
          </a>
        </Fragment>
      );
    }

    return <Fragment>Re-export {reflection.name}</Fragment>;
  },
};
