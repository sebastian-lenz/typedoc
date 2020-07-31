import { ok, deepStrictEqual } from "assert";
import * as FS from "fs";
import * as Path from "path";
import { JsxEmit, ModuleKind, ScriptTarget } from "typescript";
import { Application, ProjectReflection, resetReflectionID } from "..";
import {
  ReflectionKind,
  SomeSerializedContainerReflection,
  SomeSerializedReflection,
} from "../lib/models";
import { zip } from "../lib/utils/array";
import type { SerializedSignatureReflection } from "../lib/models/reflections/signature";

function omit<T, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
  const data = { ...obj };
  for (const key of keys) {
    delete data[key];
  }
  return data;
}

function omitDeep(obj: object, ...keys: string[]): object {
  if (Array.isArray(obj)) {
    return obj.map((o) => (typeof o === "object" ? omitDeep(o, ...keys) : o));
  } else {
    const result = {} as any;
    for (const [key, val] of Object.entries(obj)) {
      if (!keys.includes(key)) {
        result[key] = typeof val === "object" ? omitDeep(val, ...keys) : val;
      }
    }
    return result;
  }
}

// We need this instead of using deepStrictEqual because converters are async and thus
// might happen out of order, resulting in reflections which are otherwise identical having
// different `id` fields or different ordering within `children` arrays.
function assertSpecsEqual(
  a: SomeSerializedReflection,
  b: SomeSerializedReflection
) {
  ok(a.kind === b.kind, "Different reflections!");

  switch (a.kind) {
    case ReflectionKind.Project:
    case ReflectionKind.Module:
    case ReflectionKind.Namespace:
    case ReflectionKind.Enum:
    case ReflectionKind.Class:
    case ReflectionKind.Interface:
    case ReflectionKind.Object:
    case ReflectionKind.Function:
    case ReflectionKind.Method:
      assertContainerSpecsEqual(a, b as SomeSerializedContainerReflection);
      return;
    case ReflectionKind.Signature:
      assertSignatureSpecsEqual(a, b as SerializedSignatureReflection);
      return;
  }

  deepStrictEqual(omitDeep(a, "id"), omitDeep(b, "id"));
}

const assertContainerSpecsEqual = makeAssertSpecsEqualWithChildren<
  SomeSerializedContainerReflection
>("children");

const assertSignatureSpecsEqual = makeAssertSpecsEqualWithChildren<
  SerializedSignatureReflection
>("parameters");

type KeysOfType<T, U> = {
  [K in keyof T]-?: T[K] extends U ? K : never;
}[keyof T];

function makeAssertSpecsEqualWithChildren<T extends SomeSerializedReflection>(
  childKey: KeysOfType<T, SomeSerializedReflection[]>
) {
  return (a: T, b: T) => {
    const aChildren = [
      ...((a[childKey] as any) as SomeSerializedReflection[]),
    ].sort((a, b) => a.name.localeCompare(b.name));

    const bChildren = [
      ...((b[childKey] as any) as SomeSerializedReflection[]),
    ].sort((a, b) => a.name.localeCompare(b.name));

    ok(aChildren.length === bChildren.length, "Different number of children!");
    deepStrictEqual(
      omit(omitDeep(a, "id"), childKey as never),
      omit(omitDeep(b, "id"), childKey as never)
    );

    for (const [a, b] of zip(aChildren, bChildren)) {
      assertSpecsEqual(a, b);
    }
  };
}

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

          assertSpecsEqual(JSON.parse(data), specs);
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
