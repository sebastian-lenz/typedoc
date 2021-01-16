import { Logger, Options, ParameterType } from "../../../lib/utils";
import {
    MapDeclarationOption,
    NumberDeclarationOption,
} from "../../../lib/utils/options";
import { deepStrictEqual as equal, throws } from "assert";
import { DeclarationOption } from "../../../lib/utils/options";

describe("Options", () => {
    const logger = new Logger();
    const options = new Options(logger) as Options & {
        addDeclaration(declaration: Readonly<DeclarationOption>): void;
        getValue(name: string): unknown;
    };
    options.addDefaultDeclarations();
    options.addDeclaration({
        name: "mapped",
        type: ParameterType.Map,
        map: { a: 1 },
        defaultValue: 2,
        help: "",
    });

    it("Errors on duplicate declarations", () => {
        logger.resetErrors();
        options.addDeclaration({
            name: "help",
            help: "",
            type: ParameterType.Boolean,
        });
        equal(logger.hasErrors(), true);
    });

    it("Does not throw if number declaration has no min and max values", () => {
        const declaration: NumberDeclarationOption = {
            name: "test-number-declaration",
            help: "",
            type: ParameterType.Number,
            defaultValue: 1,
        };
        options.addDeclaration(declaration);
        options.removeDeclarationByName(declaration.name);
    });

    it("Does not throw if default value is out of range for number declaration", () => {
        const declaration: NumberDeclarationOption = {
            name: "test-number-declaration",
            help: "",
            type: ParameterType.Number,
            minValue: 1,
            maxValue: 10,
            defaultValue: 0,
        };
        options.addDeclaration(declaration);
        options.removeDeclarationByName(declaration.name);
    });

    it("Does not throw if a map declaration has a default value that is not part of the map of possible values", () => {
        const declaration: MapDeclarationOption<number> = {
            name: "testMapDeclarationWithForeignDefaultValue",
            help: "",
            type: ParameterType.Map,
            map: new Map([
                ["a", 1],
                ["b", 2],
            ]),
            defaultValue: 0,
        };
        options.addDeclaration(declaration);
        options.removeDeclarationByName(declaration.name);
    });

    it("Supports removing a declaration by name", () => {
        options.addDeclaration({ name: "not-an-option", help: "" });
        options.removeDeclarationByName("not-an-option");
        equal(options.getDeclaration("not-an-option"), undefined);
    });

    it("Ignores removal of non-existent declarations", () => {
        options.removeDeclarationByName("not-an-option");
        equal(options.getDeclaration("not-an-option"), undefined);
    });

    it("Throws on attempt to get an undeclared option", () => {
        throws(() => options.getValue("does-not-exist"));
    });

    it("Does not allow fetching compiler options through getValue", () => {
        throws(() => options.getValue("target"));
    });

    it("Errors if converting a set value errors", () => {
        throws(() => options.setValue("mapped" as any, "nonsense" as any));
    });

    it("Supports directly getting values", () => {
        equal(options.getRawValues().toc, []);
    });

    it("[Deprecated] Supports checking if a value is default", () => {
        options.setValue("excludePrivate", true);
        equal(options.isDefault("excludePrivate"), false);
        equal(options.isDefault("excludeProtected"), true);
    });

    it("Supports checking if an option is set", () => {
        const options = new Options(new Logger());
        options.addDefaultDeclarations();
        equal(options.isSet("excludePrivate"), false);
        options.setValue("excludePrivate", false);
        equal(options.isSet("excludePrivate"), true);
        options.reset();
        equal(options.isSet("excludePrivate"), false);

        throws(() => options.isSet("does not exist" as never));
    });
});
