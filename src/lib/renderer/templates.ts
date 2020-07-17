import { VNode } from "preact";
import {
  ClassReflection,
  EnumMemberReflection,
  EnumReflection,
  FunctionReflection,
  InterfaceReflection,
  MethodReflection,
  ModuleReflection,
  NamespaceReflection,
  ParameterReflection,
  ProjectReflection,
  PropertyReflection,
  ReferenceReflection,
  SignatureReflection,
  SomeReflection,
  TypeAliasReflection,
  VariableReflection,
} from "../models";
import { ObjectReflection } from "../models/reflections/object";
import { AccessorReflection } from "../models/reflections/property";
import { EventHooks } from "../utils/hooks";
import { ThemeRouter } from "./router";

export type TemplateProps<R extends SomeReflection> = {
  reflection: R;
  templates: Templates;
  hooks: EventHooks<TemplateHooks, VNode | null>;
  router: ThemeRouter;
  parseMarkdown: (markdown: string, reflection: SomeReflection) => string;
};

/**
 * Describes the available hooks on the default templates.
 */
export interface TemplateHooks {
  "head.begin": [SomeReflection];
  "head.end": [SomeReflection];
  "body.begin": [SomeReflection];
  "body.end": [SomeReflection];

  "reflection.before": [SomeReflection];
  "reflection.begin": [SomeReflection];
  "reflection.end": [SomeReflection];
  "reflection.after": [SomeReflection];
}

/**
 * Describes the Template contract. Extended users may provide a `Partial<Templates>` to override
 * only some templates.
 *
 * Downstream users can use {@link https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation | declaration merging}
 * to augment this interface with additional templates if they intend to allow the template to be extended
 * by other themes.
 */
export interface Templates {
  /**
   * Create the page layout and then delegate to a more specific reflection.
   * This template will be rendered for each reflection for which the {@link ThemeRouter.hasOwnDocument}
   * method returns true.
   */
  Page(props: TemplateProps<SomeReflection>): VNode;

  /**
   * Create the page header, used within the {@link Page} template.
   */
  Header(props: TemplateProps<SomeReflection>): VNode;

  /**
   * Create the sidebar navigation.
   */
  Navigation(props: TemplateProps<SomeReflection>): VNode;

  /**
   * Create the breadcrumbs leading to this reflection.
   * > Module / Namespace / Class
   */
  Breadcrumbs(props: TemplateProps<SomeReflection>): VNode;

  /**
   * Create the page footer, used within the {@link Page} template.
   */
  Footer(props: TemplateProps<SomeReflection>): VNode;

  /**
   * Helper template which renders all children of the given reflection that live in this page with
   * the {@link Reflection} template. Children are not wrapped in any elements.
   */
  PageChildren(props: TemplateProps<SomeReflection>): VNode;

  /**
   * You should not need to override this template. It simply delegates to the more specific template
   * based on the `kind` property of the reflection.
   */
  Reflection(props: TemplateProps<SomeReflection>): VNode;

  /**
   * Renders the comment attached to the reflection, if any.
   */
  Comment(props: TemplateProps<SomeReflection>): VNode;

  // These will be delegated to by the Reflection template.
  Project(props: TemplateProps<ProjectReflection>): VNode;
  Module(props: TemplateProps<ModuleReflection>): VNode;
  Namespace(props: TemplateProps<NamespaceReflection>): VNode;
  Enum(props: TemplateProps<EnumReflection>): VNode;
  EnumMember(props: TemplateProps<EnumMemberReflection>): VNode;
  Variable(props: TemplateProps<VariableReflection>): VNode;
  Function(props: TemplateProps<FunctionReflection>): VNode;
  Class(props: TemplateProps<ClassReflection>): VNode;
  Interface(props: TemplateProps<InterfaceReflection>): VNode;
  Object(props: TemplateProps<ObjectReflection>): VNode;
  Property(props: TemplateProps<PropertyReflection>): VNode;
  Accessor(props: TemplateProps<AccessorReflection>): VNode;
  Method(props: TemplateProps<MethodReflection>): VNode;
  Signature(props: TemplateProps<SignatureReflection>): VNode;
  Parameter(props: TemplateProps<ParameterReflection>): VNode;
  TypeAlias(props: TemplateProps<TypeAliasReflection>): VNode;
  Reference(props: TemplateProps<ReferenceReflection>): VNode;
}
