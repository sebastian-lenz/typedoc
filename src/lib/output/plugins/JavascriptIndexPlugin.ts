import * as Path from "path";
import { Builder, trimmer } from "lunr";

import {
  DeclarationReflection,
  ProjectReflection,
} from "../../models/reflections/index";
import { GroupPlugin } from "../../converter/plugins/GroupPlugin";
import { Component, RendererComponent } from "../components";
import { writeFile } from "../../utils/fs";
import { RendererEvent } from "../events";

/**
 * A plugin that exports an index of the project to a javascript file.
 *
 * The resulting javascript file can be used to build a simple search function.
 */
@Component({ name: "javascript-index" })
export class JavascriptIndexPlugin extends RendererComponent {
  /**
   * Create a new JavascriptIndexPlugin instance.
   */
  initialize() {
    this.listenTo(this.owner, RendererEvent.BEGIN, this.onRendererBegin);
  }

  /**
   * Triggered after a document has been rendered, just before it is written to disc.
   *
   * @param event  An event object describing the current render operation.
   */
  private onRendererBegin(event: RendererEvent) {
    const rows: any[] = [];
    const kinds = {};

    for (let key in event.project.reflections) {
      const reflection: DeclarationReflection = <DeclarationReflection>(
        event.project.reflections[key]
      );
      if (!(reflection instanceof DeclarationReflection)) {
        continue;
      }

      if (
        !reflection.url ||
        !reflection.name ||
        reflection.flags.isExternal ||
        reflection.name === ""
      ) {
        continue;
      }

      let parent = reflection.parent;
      if (parent instanceof ProjectReflection) {
        parent = undefined;
      }

      const row: any = {
        id: rows.length,
        kind: reflection.kind,
        name: reflection.name,
        url: reflection.url,
        classes: reflection.cssClasses,
      };

      if (parent) {
        row.parent = parent.getFullName();
      }

      if (!kinds[reflection.kind]) {
        kinds[reflection.kind] = GroupPlugin.getKindSingular(reflection.kind);
      }

      rows.push(row);
    }

    const builder = new Builder();
    builder.pipeline.add(trimmer);

    builder.ref("id");
    builder.field("name", { boost: 10 });
    builder.field("parent");

    rows.forEach((row) => builder.add(row));

    const index = builder.build();

    const jsonFileName = Path.join(
      event.outputDirectory,
      "assets",
      "js",
      "search.json"
    );
    const jsonData = JSON.stringify({
      kinds,
      rows,
      index,
    });

    writeFile(jsonFileName, jsonData, false);
  }
}
