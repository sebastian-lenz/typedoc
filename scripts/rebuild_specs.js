// @ts-check

const fs = require("fs").promises;
const { existsSync, readdirSync } = require("fs");
const path = require("path");
const TypeDoc = require("..");
const ts = require("typescript");
const { join } = require("path");

const app = new TypeDoc.Application();
app.bootstrap({
  target: ts.ScriptTarget.ES2016,
  module: ts.ModuleKind.CommonJS,
  experimentalDecorators: true,
  jsx: ts.JsxEmit.React,
  jsxFactory: "createElement",
  lib: [
    "lib.dom.d.ts",
    "lib.es5.d.ts",
    "lib.es2015.iterable.d.ts",
    "lib.es2015.collection.d.ts",
  ],
  name: "typedoc",
  excludeExternals: true,
  disableSources: true,
  strict: true,
  strictPropertyInitialization: false,
  noImplicitAny: false,
});

// Note that this uses the test files in dist, not in src, this is important since
// when running the tests we copy the tests to dist and then convert them.
const base = path.join(__dirname, "../dist/test/converter");

/** @type {[string, () => void, () => void][]} */
const conversions = [
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
    "specs-with-lump-categories",
    () => app.options.setValue("categorizeByGroup", false),
    () => app.options.setValue("categorizeByGroup", true),
  ],
  [
    "specs.nodoc",
    () => app.options.setValue("excludeNotDocumented", true),
    () => app.options.setValue("excludeNotDocumented", false),
  ],
];

/**
 * Rebuilds the converter specs for the provided dirs.
 * @param {string[]} dirs
 */
async function rebuildConverterTests(dirs) {
  for (const fullPath of dirs) {
    console.log(fullPath);
    app.options.setValue(
      "entryPoint",
      readdirSync(fullPath).map((p) => join(fullPath, p))
    );

    for (const [file, before, after] of conversions) {
      const out = path.join(fullPath, `${file}.json`);
      if (existsSync(out)) {
        TypeDoc.resetReflectionID();
        before();
        const result = await app.convert();
        const serialized = app.serializer.toObject(result);

        const data = JSON.stringify(serialized, null, "  ")
          .split(base.replace(/\\/g, "/"))
          .join("%BASE%");
        after();
        await fs.writeFile(out.replace("dist", "src"), data);
      }
    }
  }
}

async function rebuildRendererTest() {
  const src = path.join(__dirname, "../src/test/renderer/project/index.ts");
  const out = path.join(__dirname, "../src/test/renderer/specs");

  await fs.rmdir(out, { recursive: true });
  app.options.setValue("entryPoint", [src]);
  const project = await app.convert();
  await app.generateDocs(project, out);
  // For reference, not tested.
  await app.generateJson(project, path.join(out, "specs.json"));
}

async function main(command = "all", filter = "") {
  if (!["all", "converter", "renderer"].includes(command)) {
    console.error(
      "Invalid command. Usage: node scripts/rebuild_specs.js <all|converter|renderer> [filter]"
    );
    throw new Error();
  }

  if (["all", "converter"].includes(command)) {
    const dirs = await Promise.all(
      (await fs.readdir(base)).map((dir) => {
        const dirPath = path.join(base, dir);
        return Promise.all([dirPath, fs.stat(dirPath)]);
      })
    );

    await rebuildConverterTests(
      dirs
        .filter(([fullPath, stat]) => {
          if (!stat.isDirectory()) return false;
          return fullPath.endsWith(filter);
        })
        .map(([path]) => path)
    );
  } else if (filter !== "") {
    console.warn(
      "Specifying a filter when rebuilding render specs only has no effect."
    );
  }

  if (["all", "renderer"].includes(command)) {
    await rebuildRendererTest();
  }
}

main(process.argv[2], process.argv[3]).catch((reason) => {
  console.error(reason);
  process.exit(1);
});
