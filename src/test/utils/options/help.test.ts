import { ok } from "assert";

import {
  Options,
  Logger,
  ParameterScope,
  ParameterType,
  ParameterHint,
} from "../../../lib/utils";
import { getOptionsHelp } from "../../../lib/utils/options/help";

describe("Options - help", () => {
  const options = new Options(new Logger());
  options.addDeclarations([
    { name: "td-option", help: "help", type: ParameterType.String },
    { name: "td-option2", help: "help", short: "tdo" },
    { name: "not displayed", help: "" },
    {
      name: "td",
      short: "not so short",
      help: "help",
      hint: ParameterHint.File,
    },
    { name: "ts-option", help: "help", scope: ParameterScope.TypeScript },
  ]);

  it("Describes TypeDoc options", () => {
    const help = getOptionsHelp(options);
    ok(help.includes("td-option"));
  });

  it("Does not list options without help", () => {
    const help = getOptionsHelp(options);
    ok(!help.includes("not displayed"));
  });

  it("Includes the short version", () => {
    const help = getOptionsHelp(options);
    ok(help.includes("not so short"));
  });

  it("Does not describe TypeScript options", () => {
    const help = getOptionsHelp(options);
    ok(!help.includes("ts-option"));
  });
});
