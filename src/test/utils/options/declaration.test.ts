import {
  convert,
  DeclarationOption,
  ParameterType,
  MapDeclarationOption,
  NumberDeclarationOption,
} from "../../../lib/utils/options/declaration";
import { deepStrictEqual as equal, throws } from "assert";

describe("Options - Default convert function", () => {
  const optionWithType = (type: ParameterType) =>
    ({
      type,
      defaultValue: null,
      name: "test",
      help: "",
    } as DeclarationOption);

  it("Converts to numbers", () => {
    equal(convert("123", optionWithType(ParameterType.Number)), 123);
    equal(convert("a", optionWithType(ParameterType.Number)), 0);
    equal(convert(NaN, optionWithType(ParameterType.Number)), 0);
  });

  it("Converts to number if value is the lowest allowed value for a number option", () => {
    const declaration: NumberDeclarationOption = {
      name: "test",
      help: "",
      type: ParameterType.Number,
      minValue: 1,
      maxValue: 10,
      defaultValue: 1,
    };
    equal(convert(1, declaration), 1);
  });

  it("Generates an error if value is too low for a number option", () => {
    const declaration: NumberDeclarationOption = {
      name: "test",
      help: "",
      type: ParameterType.Number,
      minValue: 1,
      maxValue: 10,
      defaultValue: 1,
    };
    throws(
      () => convert(0, declaration),
      new Error("test must be between 1 and 10")
    );
  });

  it("Converts to number if value is the highest allowed value for a number option", () => {
    const declaration: NumberDeclarationOption = {
      name: "test",
      help: "",
      type: ParameterType.Number,
      minValue: 1,
      maxValue: 10,
      defaultValue: 1,
    };
    equal(convert(10, declaration), 10);
  });

  it("Generates an error if value is too high for a number option", () => {
    const declaration: NumberDeclarationOption = {
      name: "test",
      help: "",
      type: ParameterType.Number,
      minValue: 1,
      maxValue: 10,
      defaultValue: 1,
    };
    throws(
      () => convert(11, declaration),
      new Error("test must be between 1 and 10")
    );
  });

  it("Converts to strings", () => {
    equal(convert("123", optionWithType(ParameterType.String)), "123");
    equal(convert(123, optionWithType(ParameterType.String)), "123");
    equal(convert(["1", "2"], optionWithType(ParameterType.String)), "1,2");
    equal(convert(null, optionWithType(ParameterType.String)), "");
    equal(convert(void 0, optionWithType(ParameterType.String)), "");
  });

  it("Converts to booleans", () => {
    equal(convert("a", optionWithType(ParameterType.Boolean)), true);
    equal(convert([1], optionWithType(ParameterType.Boolean)), true);
    equal(convert(false, optionWithType(ParameterType.Boolean)), false);
  });

  it("Converts to arrays", () => {
    equal(convert("12,3", optionWithType(ParameterType.Array)), ["12", "3"]);
    equal(convert(["12,3"], optionWithType(ParameterType.Array)), ["12,3"]);
    equal(convert(true, optionWithType(ParameterType.Array)), []);
  });

  it("Converts to mapped types", () => {
    const declaration: MapDeclarationOption<number> = {
      name: "",
      help: "",
      type: ParameterType.Map,
      map: {
        a: 1,
        b: 2,
      },
      defaultValue: 1,
    };
    equal(convert("a", declaration), 1);
    equal(convert("b", declaration), 2);
    equal(convert(2, declaration), 2);
  });

  it("Converts to mapped types with a map", () => {
    const declaration: MapDeclarationOption<number> = {
      name: "",
      help: "",
      type: ParameterType.Map,
      map: new Map([
        ["a", 1],
        ["b", 2],
      ]),
      defaultValue: 1,
    };
    equal(convert("a", declaration), 1);
    equal(convert("b", declaration), 2);
    equal(convert(2, declaration), 2);
  });

  it("Uses the mapError if provided for errors", () => {
    const declaration: MapDeclarationOption<number> = {
      name: "",
      help: "",
      type: ParameterType.Map,
      map: {},
      defaultValue: 1,
      mapError: "Test error",
    };
    throws(() => convert("a", declaration), new Error(declaration.mapError));
  });

  it("Generates a nice error if no mapError is provided", () => {
    const declaration: MapDeclarationOption<number> = {
      name: "test",
      help: "",
      type: ParameterType.Map,
      map: new Map([
        ["a", 1],
        ["b", 2],
      ]),
      defaultValue: 1,
    };
    throws(
      () => convert("c", declaration),
      new Error("test must be one of a, b")
    );
  });

  it("Correctly handles enum types in the map error", () => {
    enum Enum {
      a,
      b,
    }
    const declaration = {
      name: "test",
      help: "",
      type: ParameterType.Map,
      map: Enum,
      defaultValue: Enum.a,
    } as const;
    throws(
      () => convert("c", declaration),
      new Error("test must be one of a, b")
    );
  });

  it("Passes through mixed", () => {
    const data = Symbol();
    equal(convert(data, optionWithType(ParameterType.Mixed)), data);
  });
});
