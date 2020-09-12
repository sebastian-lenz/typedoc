import { Application, ProjectReflection } from "..";
import { promises as fs } from "fs";
import { ScriptTarget, ModuleKind } from "typescript";
import { join, relative } from "path";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { tmpdir } from "os";

const ignoredPaths = new Set(["assets", "specs.json"]);

async function getFileIndex(base: string) {
  const queue = [base];
  const results: string[] = [];

  let path: string | undefined;
  while ((path = queue.pop())) {
    if (ignoredPaths.has(relative(base, path))) {
      continue;
    }

    const stats = await fs.stat(path);
    if (stats.isDirectory()) {
      for (const child of await fs.readdir(path)) {
        queue.push(join(path, child));
      }
    } else {
      results.push(relative(base, path));
    }
  }

  return results.sort();
}

async function compareDirectories(actualDir: string, expectedDir: string) {
  const [actualFiles, expectedFiles] = await Promise.all([
    getFileIndex(actualDir),
    getFileIndex(expectedDir),
  ]);
  deepStrictEqual(actualFiles, expectedFiles);

  for (const file of actualFiles) {
    const [actualContent, expectedContent] = await Promise.all([
      fs.readFile(join(actualDir, file), "utf-8"),
      fs.readFile(join(expectedDir, file), "utf-8"),
    ]);
    strictEqual(actualContent, expectedContent);
  }
}

describe("Renderer", function () {
  let app: Application, project: ProjectReflection | undefined;

  it("constructs", function () {
    app = new Application();
    app.bootstrap({
      logger: "console",
      target: ScriptTarget.ES5,
      module: ModuleKind.CommonJS,
      gaSite: "foo.com", // verify theme option without modifying output
      name: "typedoc",
      disableSources: true,
      strict: true,
      strictPropertyInitialization: false,
      noImplicitAny: false,
    });
  });

  it("converts basic example", async function () {
    this.timeout(0);
    app.options.setValue("entryPoint", [
      join(__dirname, "renderer", "project", "index.ts"),
    ]);
    project = await app.convert();

    ok(!app.logger.hasErrors(), "Application.convert returned errors");
    ok(
      project instanceof ProjectReflection,
      "Application.convert did not return a reflection"
    );
  });

  it("renders basic example", async function () {
    this.timeout(0);
    ok(project);

    const tmp = await fs.mkdtemp(join(tmpdir(), "typedoc_rendered_specs"));
    await app.generateDocs(project, tmp);
    try {
      await compareDirectories(tmp, join(__dirname, "renderer", "specs"));
    } finally {
      await fs.rmdir(tmp, { recursive: true });
    }
  });
});
