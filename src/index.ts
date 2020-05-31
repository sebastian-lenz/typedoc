export { Application } from './lib/application';

export { EventDispatcher, Event } from './lib/utils/events';
export { resetReflectionID } from './lib/models/reflections/abstract';
export { normalizePath } from './lib/utils/fs';
export * from './lib/models/reflections';

export {
    BindOption,
    Options,
    OptionsReader,
    ParameterHint,
    ParameterScope,
    ParameterType,

    TypeDocOptions,
    TypeDocAndTSOptions,
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
    DeclarationOptionToOptionType
} from './lib/utils/options';

import * as TypeScript from 'typescript';
export { TypeScript };
