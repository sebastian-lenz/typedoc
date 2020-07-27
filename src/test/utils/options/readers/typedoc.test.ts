import { join } from "path";
import { deepStrictEqual as equal } from "assert";

import { TypeDocReader } from "../../../../lib/utils/options/readers";
import { Logger, Options, ConsoleLogger } from "../../../../lib/utils";

describe("Options - TypeDocReader", () => {
  const options = new Options(new Logger());
  options.addDefaultDeclarations();
  options.addReader(new TypeDocReader());

  function test(name: string, input: string, cb: () => void) {
    it(name, () => {
      options.reset();
      options.setValue("options", input);
      options.read(new ConsoleLogger());
      cb();
    });
  }

  test(
    "Preserves splitting behavior",
    join(__dirname, "data/src2.json"),
    () => {
      equal(options.getValue("inputFiles"), ["a"]);
    }
  );

  test("Supports extends", join(__dirname, "data/extends.json"), () => {
    equal(options.getValue("name"), "extends");
    equal(options.getValue("inputFiles"), ["a"]);
  });

  function testError(name: string, file: string) {
    it(name, () => {
      options.reset();
      options.setValue("options", file);
      const logger = new Logger();
      options.read(logger);
      equal(logger.hasErrors(), true, "No error was logged");
    });
  }

  testError(
    "Errors if the file cannot be found",
    join(__dirname, "data/non-existent-file.json")
  );
  testError(
    "Errors if the data is invalid",
    join(__dirname, "data/invalid.json")
  );
  testError(
    "Errors if any set option errors",
    join(__dirname, "data/unknown.json")
  );
  testError(
    "Errors if extends results in a loop",
    join(__dirname, "data/circular-extends.json")
  );

  it("Does not error if the option file cannot be found but was not set.", () => {
    const options = new (class LyingOptions extends Options {
      isDefault() {
        return true;
      }
    })(new Logger());

    options.addDefaultDeclarations();
    options.addReader(new TypeDocReader());
    const logger = new Logger();
    options.read(logger);
    equal(logger.hasErrors(), false);
  });
});
