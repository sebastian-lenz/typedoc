import { join } from "path";
import { deepStrictEqual as equal } from "assert";

import { TSConfigReader } from "../../../../lib/utils/options/readers";
import { Logger, Options } from "../../../../lib/utils";
import { ScriptTarget } from "typescript";

describe("Options - TSConfigReader", () => {
  const options = new Options(new Logger());
  options.addDefaultDeclarations();
  options.addReader(new TSConfigReader());

  function testError(name: string, file: string) {
    it(name, () => {
      options.reset();
      options.setValue("tsconfig", file);
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
    join(__dirname, "data/invalid.tsconfig.json")
  );
  testError(
    "Errors if any set option errors",
    join(__dirname, "data/unknown.tsconfig.json")
  );
  testError(
    "Errors if tsconfig tries to set options file",
    join(__dirname, "data/options-file.tsconfig.json")
  );

  it("Does not error if the option file cannot be found but was not set.", () => {
    const options = new (class LyingOptions extends Options {
      isDefault() {
        return true;
      }
    })(new Logger());
    options.addDefaultDeclarations();

    options.setValue("tsconfig", join(__dirname, "data/does_not_exist.json"));
    const logger = new Logger();
    options.addReader(new TSConfigReader());
    options.read(logger);
    equal(logger.hasErrors(), false);
  });

  it("Also reads files according to --project", () => {
    options.reset();
    options.setValue("project", join(__dirname, "data/valid.tsconfig.json"));
    const logger = new Logger();
    options.read(logger);
    equal(options.getValue("help"), true);
    equal(options.getCompilerOptions().target, ScriptTarget.ESNext);
  });
});
