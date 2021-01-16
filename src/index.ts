export { Application } from "./lib/application";

export { EventDispatcher, Event } from "./lib/utils/events";
export { resetReflectionID } from "./lib/models/reflections/abstract";
export { normalizePath } from "./lib/utils/fs";
export * from "./lib/models/reflections";
export { Converter } from "./lib/converter";
export { Renderer } from "./lib/output/renderer";
export {
    DefaultTheme,
    NavigationBuilder,
} from "./lib/output/themes/DefaultTheme";
export { NavigationItem } from "./lib/output/models/NavigationItem";
export { UrlMapping } from "./lib/output/models/UrlMapping";

export {
    BindOption,
    Options,
    OptionsReader,
    ParameterHint,
    ParameterType,
    TypeDocOptions,
    TypeDocOptionMap,
    KeyToDeclaration,
    TSConfigReader,
    TypeDocReader,
    ArgumentsReader,
    DeclarationOption,
    DeclarationOptionBase,
    StringDeclarationOption,
    NumberDeclarationOption,
    BooleanDeclarationOption,
    ArrayDeclarationOption,
    MixedDeclarationOption,
    MapDeclarationOption,
    DeclarationOptionToOptionType,
    LogLevel,
} from "./lib/utils";

export { JSONOutput } from "./lib/json";

import * as TypeScript from "typescript";
export { TypeScript };
