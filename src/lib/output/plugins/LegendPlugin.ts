import {
  Reflection,
  DeclarationReflection,
  ProjectReflection,
} from "../../models/reflections/index";
import { Component, RendererComponent } from "../components";
import { PageEvent, RendererEvent } from "../events";

export interface LegendItem {
  /**
   * Legend item name
   */
  name: string;

  /**
   * List of css classes that represent the legend item
   */
  classes: string[];
}

const ignoredClasses = new Set([
  "tsd-parent-kind-module",
  "tsd-is-not-exported",
  "tsd-is-overwrite",
]);

const completeLegend: LegendItem[][] = [
  [
    { name: "Namespace", classes: ["tsd-kind-namespace"] },
    { name: "Object literal", classes: ["tsd-kind-object-literal"] },
    { name: "Variable", classes: ["tsd-kind-variable"] },
    { name: "Function", classes: ["tsd-kind-function"] },
    {
      name: "Function with type parameter",
      classes: ["tsd-kind-function", "tsd-has-type-parameter"],
    },
    { name: "Index signature", classes: ["tsd-kind-index-signature"] },
    { name: "Type alias", classes: ["tsd-kind-type-alias"] },
    {
      name: "Type alias with type parameter",
      classes: ["tsd-kind-type-alias", "tsd-has-type-parameter"],
    },
  ],
  [
    { name: "Enumeration", classes: ["tsd-kind-enum"] },
    { name: "Enumeration member", classes: ["tsd-kind-enum-member"] },
    {
      name: "Property",
      classes: ["tsd-kind-property", "tsd-parent-kind-enum"],
    },
    {
      name: "Method",
      classes: ["tsd-kind-method", "tsd-parent-kind-enum"],
    },
  ],
  [
    { name: "Interface", classes: ["tsd-kind-interface"] },
    {
      name: "Interface with type parameter",
      classes: ["tsd-kind-interface", "tsd-has-type-parameter"],
    },
    {
      name: "Constructor",
      classes: ["tsd-kind-constructor", "tsd-parent-kind-interface"],
    },
    {
      name: "Property",
      classes: ["tsd-kind-property", "tsd-parent-kind-interface"],
    },
    {
      name: "Method",
      classes: ["tsd-kind-method", "tsd-parent-kind-interface"],
    },
    {
      name: "Index signature",
      classes: ["tsd-kind-index-signature", "tsd-parent-kind-interface"],
    },
  ],
  [
    { name: "Class", classes: ["tsd-kind-class"] },
    {
      name: "Class with type parameter",
      classes: ["tsd-kind-class", "tsd-has-type-parameter"],
    },
    {
      name: "Constructor",
      classes: ["tsd-kind-constructor", "tsd-parent-kind-class"],
    },
    {
      name: "Property",
      classes: ["tsd-kind-property", "tsd-parent-kind-class"],
    },
    {
      name: "Method",
      classes: ["tsd-kind-method", "tsd-parent-kind-class"],
    },
    {
      name: "Accessor",
      classes: ["tsd-kind-accessor", "tsd-parent-kind-class"],
    },
    {
      name: "Index signature",
      classes: ["tsd-kind-index-signature", "tsd-parent-kind-class"],
    },
  ],
  [
    {
      name: "Inherited constructor",
      classes: [
        "tsd-kind-constructor",
        "tsd-parent-kind-class",
        "tsd-is-inherited",
      ],
    },
    {
      name: "Inherited property",
      classes: [
        "tsd-kind-property",
        "tsd-parent-kind-class",
        "tsd-is-inherited",
      ],
    },
    {
      name: "Inherited method",
      classes: ["tsd-kind-method", "tsd-parent-kind-class", "tsd-is-inherited"],
    },
    {
      name: "Inherited accessor",
      classes: [
        "tsd-kind-accessor",
        "tsd-parent-kind-class",
        "tsd-is-inherited",
      ],
    },
  ],
  [
    {
      name: "Protected property",
      classes: [
        "tsd-kind-property",
        "tsd-parent-kind-class",
        "tsd-is-protected",
      ],
    },
    {
      name: "Protected method",
      classes: ["tsd-kind-method", "tsd-parent-kind-class", "tsd-is-protected"],
    },
    {
      name: "Protected accessor",
      classes: [
        "tsd-kind-accessor",
        "tsd-parent-kind-class",
        "tsd-is-protected",
      ],
    },
  ],
  [
    {
      name: "Private property",
      classes: ["tsd-kind-property", "tsd-parent-kind-class", "tsd-is-private"],
    },
    {
      name: "Private method",
      classes: ["tsd-kind-method", "tsd-parent-kind-class", "tsd-is-private"],
    },
    {
      name: "Private accessor",
      classes: ["tsd-kind-accessor", "tsd-parent-kind-class", "tsd-is-private"],
    },
  ],
  [
    {
      name: "Static property",
      classes: ["tsd-kind-property", "tsd-parent-kind-class", "tsd-is-static"],
    },
    {
      name: "Static method",
      classes: ["tsd-kind-method", "tsd-parent-kind-class", "tsd-is-static"],
    },
  ],
];

export class LegendBuilder {
  private _classesList: Set<string>[];

  constructor() {
    this._classesList = [];
  }

  build(): LegendItem[][] {
    const filteredLegend = completeLegend
      .map((list) => {
        return list.filter((item) => {
          for (const classes of this._classesList) {
            if (this.isArrayEqualToSet(item.classes, classes)) {
              return true;
            }
          }
          return false;
        });
      })
      .filter((list) => list.length);

    return filteredLegend;
  }

  registerCssClasses(classArray: string[]) {
    let exists = false;
    const items = classArray.filter((cls) => !ignoredClasses.has(cls));

    for (const classes of this._classesList) {
      if (this.isArrayEqualToSet(items, classes)) {
        exists = true;
        break;
      }
    }

    if (!exists) {
      this._classesList.push(new Set(items));
    }
  }

  private isArrayEqualToSet<T>(a: T[], b: Set<T>) {
    if (a.length !== b.size) {
      return false;
    }

    for (const value of a) {
      if (!b.has(value)) {
        return false;
      }
    }
    return true;
  }
}

/**
 * A plugin that generates the legend for the current page.
 *
 * This plugin sets the [[PageEvent.legend]] property.
 */
@Component({ name: "legend" })
export class LegendPlugin extends RendererComponent {
  private _project!: ProjectReflection;

  /**
   * Create a new LegendPlugin instance.
   */
  initialize() {
    this.listenTo(this.owner, {
      [RendererEvent.BEGIN]: this.onRenderBegin,
      [PageEvent.BEGIN]: this.onRendererBeginPage,
    });
  }

  private onRenderBegin(event: RendererEvent) {
    this._project = event.project;
  }

  /**
   * Triggered before a document will be rendered.
   *
   * @param page  An event object describing the current render operation.
   */
  private onRendererBeginPage(page: PageEvent) {
    const model = page.model;
    const builder = new LegendBuilder();

    // immediate children
    this.buildLegend(model, builder);

    // top level items (as appears in navigation)
    this._project.children?.forEach((reflection) => {
      if (reflection !== model) {
        this.buildLegend(reflection, builder);
      }
    });

    page.legend = builder.build().sort((a, b) => b.length - a.length);
  }

  private buildLegend(model: Reflection, builder: LegendBuilder) {
    if (model instanceof DeclarationReflection) {
      const children = (model.children || ([] as Array<Reflection | undefined>))
        .concat(...(model.groups?.map((group) => group.children) || []))
        .concat(...model.getAllSignatures())
        .concat(model.indexSignature as Reflection)
        .filter((item) => item);

      for (const child of children) {
        const cssClasses = child?.cssClasses?.split(" ");
        if (cssClasses) {
          builder.registerCssClasses(cssClasses);
        }
      }
    }
  }
}
