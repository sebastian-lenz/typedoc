import { deepStrictEqual as equal } from "assert";

import { Options, Logger } from "../../../../lib/utils";
import { ArgumentsReader } from "../../../../lib/utils/options/readers";
import {
  ParameterType,
  NumberDeclarationOption,
  MapDeclarationOption,
} from "../../../../lib/utils/options";

describe("Options - ArgumentsReader", () => {
  // Note: We lie about the type of Options here since we want the less strict
  // behavior for tests. If TypeDoc ever gets a numeric option, then we can
  // exclusively use the builtin options for tests and this cast can go away.
  const options = new Options(new Logger()) as Options & {
    addDeclaration(
      declaration: Readonly<NumberDeclarationOption> & {
        name: "numOption";
      }
    ): void;
    addDeclaration(
      declaration: Readonly<MapDeclarationOption<number>> & {
        name: "mapOption";
      }
    ): void;
    getValue(name: "numOption"): number;
    getValue(name: "mapOption"): number;
  };
  options.addDefaultDeclarations();
  options.addDeclaration({
    name: "numOption",
    short: "no",
    help: "",
    type: ParameterType.Number,
  });
  options.addDeclaration({
    name: "mapOption",
    help: "",
    type: ParameterType.Map,
    defaultValue: 1,
    map: {
      a: 1,
      b: 2,
    },
  });

  function test(name: string, args: string[], cb: () => void) {
    it(name, () => {
      const reader = new ArgumentsReader(1, args);
      options.reset();
      options.addReader(reader);
      options.read(new Logger());
      cb();
      options.removeReaderByName(reader.name);
    });
  }

  test("Puts arguments with no flag into inputFiles", ["foo", "bar"], () => {
    equal(options.getValue("inputFiles"), ["foo", "bar"]);
  });

  test("Works with string options", ["--out", "outDir"], () => {
    equal(options.getValue("out"), "outDir");
  });

  test("Works with number options", ["-no", "123"], () => {
    equal(options.getValue("numOption"), 123);
  });

  test("Works with boolean options", ["--includeVersion"], () => {
    equal(options.getValue("includeVersion"), true);
  });

  test(
    "Allows setting boolean options with a value",
    ["--includeVersion", "TrUE"],
    () => {
      equal(options.getValue("includeVersion"), true);
      equal(options.getValue("inputFiles"), []);
    }
  );

  test(
    "Allows setting boolean options to false with a value",
    ["--includeVersion", "FALse"],
    () => {
      equal(options.getValue("includeVersion"), false);
      equal(options.getValue("inputFiles"), []);
    }
  );

  test(
    "Bool options do not improperly consume arguments",
    ["--includeVersion", "foo"],
    () => {
      equal(options.getValue("includeVersion"), true);
      equal(options.getValue("inputFiles"), ["foo"]);
    }
  );

  test("Works with map options", ["--mapOption", "b"], () => {
    equal(options.getValue("mapOption"), 2);
  });

  test("Works with mixed options", ["--logger", "word"], () => {
    equal(options.getValue("logger"), "word");
  });

  test("Works with array options", ["--exclude", "a"], () => {
    equal(options.getValue("exclude"), ["a"]);
  });

  test(
    "Splits array options (backward compatibility)",
    ["--exclude", "a,b"],
    () => {
      equal(options.getValue("exclude"), ["a", "b"]);
    }
  );

  test(
    "Works with array options passed multiple times",
    ["--exclude", "a", "--exclude", "b"],
    () => {
      equal(options.getValue("exclude"), ["a", "b"]);
    }
  );

  it("Errors if given an unknown option", () => {
    let check = false;
    class TestLogger extends Logger {
      error(msg: string) {
        equal(msg, "Unknown option: --badOption");
        check = true;
      }
    }
    const reader = new ArgumentsReader(1, ["--badOption"]);
    options.reset();
    options.addReader(reader);
    options.read(new TestLogger());
    options.removeReaderByName(reader.name);
    equal(check, true, "Reader did not report an error.");
  });
});
