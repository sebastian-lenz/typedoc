import { Application, resetReflectionID, ProjectReflection } from "..";
import * as FS from "fs";
import * as Path from "path";
import { deepStrictEqual as equal, ok } from "assert";
import { ScriptTarget, ModuleKind, JsxEmit } from "typescript";

describe("Converter", function () {
  const base = Path.join(__dirname, "converter");
  const app = new Application();
  app.bootstrap({
    logger: "none",
    target: ScriptTarget.ES2016,
    module: ModuleKind.CommonJS,
    experimentalDecorators: true,
    jsx: JsxEmit.React,
    jsxFactory: "createElement",
    name: "typedoc",
    excludeExternals: true,
    disableSources: true,
  });

  const checks: [string, () => void, () => void][] = [
    [
      "specs",
      () => {
        // empty
      },
      () => {
        // empty
      },
    ],
    [
      "specs.d",
      () => app.options.setValue("includeDeclarations", true),
      () => app.options.setValue("includeDeclarations", false),
    ],
    [
      "specs-without-exported",
      () => app.options.setValue("excludeNotExported", true),
      () => app.options.setValue("excludeNotExported", false),
    ],
    [
      "specs-with-lump-categories",
      () => app.options.setValue("categorizeByGroup", false),
      () => app.options.setValue("categorizeByGroup", true),
    ],
    [
      "specs-without-undocumented",
      () => app.options.setValue("excludeNotDocumented", true),
      () => app.options.setValue("excludeNotDocumented", false),
    ],
  ];

  FS.readdirSync(base).forEach(function (directory) {
    const path = Path.join(base, directory);
    if (!FS.lstatSync(path).isDirectory()) {
      return;
    }

    describe(directory, function () {
      for (const [file, before, after] of checks) {
        const specsFile = Path.join(path, `${file}.json`);
        if (!FS.existsSync(specsFile)) {
          continue;
        }

        let result: ProjectReflection | undefined;

        it(`[${file}] converts fixtures`, async function () {
          before();
          resetReflectionID();
          app.options.setValue("inputFiles", [path]);
          result = await app.convert();
          after();
          ok(result instanceof ProjectReflection, "No reflection returned");
        });

        it(`[${file}] matches specs`, function () {
          ok(result);
          const specs = JSON.parse(FS.readFileSync(specsFile, "utf-8"));
          let data = JSON.stringify(
            app.serializer.toObject(result),
            null,
            "  "
          );
          data = data.split(base.replace(/\\/g, "/")).join("%BASE%");

          equal(JSON.parse(data), specs);
        });
      }
    });
  });
});

// TODO: Review, can this be brought back? The main issue right now is that json doesn't
// infer as strictly as `as const` does, so we end up with visibility: string instead of visibility: "public" | "private" | "protected"
// import * as json from "./converter/class/specs.json";
// describe("Serializer", () => {
//   it("Type checks", () => {
//     const typed: SerializedProjectReflection = json;
//     equal(json, typed);
//   });
// });
