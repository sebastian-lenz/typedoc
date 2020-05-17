import * as _ts from '../../../ts-internal';

import { DeclarationOption, ParameterScope, ParameterType, MapDeclarationOption } from '../declaration';
import { Options } from '../options';

const IGNORED_OPTIONS = [
    'out',
    'version',
    'help',
    'emitDeclarationOnly',
    'watch',
    'declaration',
    'declarationDir',
    'declarationMap',
    'mapRoot',
    'sourceMap',
    'inlineSources',
    'removeComments',
    'incremental',
    'tsBuildInfoFile'
] as const;

/**
 * The ignored option keys as a type.
 */
export type IgnoredTsOptionKeys = typeof IGNORED_OPTIONS[number];

/**
 * A list of all TypeScript parameters that should be ignored.
 */
export const IGNORED: ReadonlySet<string> = new Set(IGNORED_OPTIONS);

/**
 * Discovers and contributes options declared by TypeScript.
 *
 * TypeDoc accepts many of the same options as TypeScript itself, so they must be parsed
 * from TypeScript's metadata and declared on TypeDoc's Option parser.
 */
export function addTSOptions(container: Options) {
    container.addDeclarations(_ts.optionDeclarations
        .filter(decl => !IGNORED.has(decl.name))
        .map(createTSDeclaration));

    // This isn't really an option, and should never be set by users, but it shows up in the
    // return value from ts.parseJsonConfigFileContent and is used to find @types packages.
    // It is only needed if the project is outside of the cwd. See GH#1300.
    container.addDeclarations([{
        name: 'configFilePath',
        type: ParameterType.String,
        scope: ParameterScope.TypeScript,
        help: ''
    }]);
}

function createTSDeclaration(option: _ts.CommandLineOption): DeclarationOption {
    const param: Partial<DeclarationOption> = {
        name: option.name,
        short: option.shortName,
        help: option.description ? option.description.key : '',
        scope: ParameterScope.TypeScript
    };

    switch (option.type) {
        case 'number':
            param.type = ParameterType.Number;
            break;
        case 'boolean':
            param.type = ParameterType.Boolean;
            break;
        case 'string':
            param.type = ParameterType.String;
            break;
        case 'list':
            param.type = ParameterType.Array;
            break;
        case 'object':
            param.type = ParameterType.Mixed;
            break;
        default:
            param.type = ParameterType.Map;
            (param as MapDeclarationOption<any>).map = option.type;
    }

    return param as DeclarationOption;
}
