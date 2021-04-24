import { Options } from "..";
import { LogLevel } from "../../loggers";
import { ParameterType, ParameterHint } from "../declaration";
import { BUNDLED_THEMES } from "shiki";

export function addTypeDocOptions(options: Pick<Options, "addDeclaration">) {
    options.addDeclaration({
        name: "options",
        help:
            "Specify a json option file that should be loaded. If not specified TypeDoc will look for 'typedoc.json' in the current directory",
        hint: ParameterHint.File,
        defaultValue: process.cwd(),
    });
    options.addDeclaration({
        name: "tsconfig",
        help:
            "Specify a TypeScript config file that should be loaded. If not specified TypeDoc will look for 'tsconfig.json' in the current directory.",
        hint: ParameterHint.File,
        defaultValue: process.cwd(),
    });

    options.addDeclaration({
        name: "entryPoints",
        help:
            "The entry points of your library, which files should be documented as available to consumers.",
        type: ParameterType.Array,
    });

    options.addDeclaration({
        name: "exclude",
        help:
            "Define paths to be excluded when expanding a directory that was specified as an entry point.",
        type: ParameterType.Array,
    });
    options.addDeclaration({
        name: "externalPattern",
        help:
            "Define patterns for files that should be considered being external.",
        type: ParameterType.Array,
        defaultValue: ["**/node_modules/**"],
    });
    options.addDeclaration({
        name: "excludeExternals",
        help: "Prevent externally resolved symbols from being documented.",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "excludeNotDocumented",
        help:
            "Prevent symbols that are not explicitly documented from appearing in the results.",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "excludeInternal",
        help:
            "Prevent symbols that are marked with @internal from being documented.",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "excludePrivate",
        help: "Ignores private variables and methods",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "excludeProtected",
        help: "Ignores protected variables and methods",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "disableSources",
        help:
            "Disables setting the source of a reflection when documenting it.",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "disableAliases",
        help: "Disables creating aliases for shared reflections.",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "includes",
        help:
            "Specifies the location to look for included documents (use [[include:FILENAME]] in comments).",
        hint: ParameterHint.Directory,
    });
    options.addDeclaration({
        name: "media",
        help:
            "Specifies the location with media files that should be copied to the output directory.",
        hint: ParameterHint.Directory,
    });

    options.addDeclaration({
        name: "watch",
        help: "Watch files for changes and rebuild docs on change.",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "preserveWatchOutput",
        help:
            "If set, TypeDoc will not clear the screen between compilation runs.",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "emit",
        help: "If set, TypeDoc will emit the TypeScript compilation result",
        type: ParameterType.Boolean,
    });

    options.addDeclaration({
        name: "out",
        help: "Specifies the location the documentation should be written to.",
        hint: ParameterHint.Directory,
    });
    options.addDeclaration({
        name: "json",
        help:
            "Specifies the location and filename a JSON file describing the project is written to.",
        hint: ParameterHint.File,
    });
    options.addDeclaration({
        name: "pretty",
        help:
            "Specifies whether the output JSON should be formatted with tabs.",
        type: ParameterType.Boolean,
        defaultValue: true,
    });

    options.addDeclaration({
        name: "theme",
        help:
            "Specify the path to the theme that should be used, or 'default' or 'minimal' to use built-in themes.",
        type: ParameterType.String,
        defaultValue: "default",
    });
    options.addDeclaration({
        name: "highlightTheme",
        help: "Specifies the code highlighting theme.",
        type: ParameterType.String,
        defaultValue: "light-plus",
        validate: (value: string): void => {
            if (!BUNDLED_THEMES.includes(value)) {
                throw new Error(
                    `highlightTheme must be one of the following: ${BUNDLED_THEMES.join(
                        ", "
                    )}`
                );
            }
        },
    });

    options.addDeclaration({
        name: "name",
        help:
            "Set the name of the project that will be used in the header of the template.",
    });
    options.addDeclaration({
        name: "includeVersion",
        help: "Add the package version to the project name.",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "excludeTags",
        help: "Remove the listed tags from doc comments.",
        type: ParameterType.Array,
    });
    options.addDeclaration({
        name: "readme",
        help:
            "Path to the readme file that should be displayed on the index page. Pass `none` to disable the index page and start the documentation on the globals page.",
    });
    options.addDeclaration({
        name: "defaultCategory",
        help:
            "Specifies the default category for reflections without a category.",
        defaultValue: "Other",
    });
    options.addDeclaration({
        name: "categoryOrder",
        help:
            "Specifies the order in which categories appear. * indicates the relative order for categories not in the list.",
        type: ParameterType.Array,
    });
    options.addDeclaration({
        name: "categorizeByGroup",
        help:
            "Specifies whether categorization will be done at the group level.",
        type: ParameterType.Boolean,
        defaultValue: true,
    });
    options.addDeclaration({
        name: "hiddenCategories",
        help:
            "Specifies categories that will be hidden.",
        type: ParameterType.Array
    });
    options.addDeclaration({
        name: "gitRevision",
        help:
            "Use specified revision instead of the last revision for linking to GitHub source files.",
    });
    options.addDeclaration({
        name: "gitRemote",
        help: "Use the specified remote for linking to GitHub source files.",
        defaultValue: "origin",
    });
    options.addDeclaration({
        name: "gaID",
        help:
            "Set the Google Analytics tracking ID and activate tracking code.",
    });
    options.addDeclaration({
        name: "gaSite",
        help: "Set the site name for Google Analytics. Defaults to `auto`.",
        defaultValue: "auto",
    });
    options.addDeclaration({
        name: "hideGenerator",
        help: "Do not print the TypeDoc link at the end of the page.",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "toc",
        help:
            "Define the contents of the top level table of contents as a comma-separated list of global symbols.",
        type: ParameterType.Array,
    });
    options.addDeclaration({
        name: "disableOutputCheck",
        help:
            "Should TypeDoc disable the testing and cleaning of the output directory?",
        type: ParameterType.Boolean,
    });

    options.addDeclaration({
        name: "help",
        help: "Print this message.",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "version",
        help: "Print TypeDoc's version.",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "showConfig",
        help: "Print the resolved configuration and exit",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "plugin",
        help:
            "Specify the npm plugins that should be loaded. Omit to load all installed plugins, set to 'none' to load no plugins.",
        type: ParameterType.Array,
    });
    options.addDeclaration({
        name: "logger",
        help: "Specify the logger that should be used, 'none' or 'console'",
        defaultValue: "console",
        type: ParameterType.Mixed,
    });
    options.addDeclaration({
        name: "logLevel",
        help: "Specify what level of logging should be used.",
        type: ParameterType.Map,
        map: LogLevel,
        defaultValue: LogLevel.Info,
    });
    options.addDeclaration({
        name: "listInvalidSymbolLinks",
        help:
            "Emits a list of broken symbol [[navigation]] links after documentation generation",
        type: ParameterType.Boolean,
    });
    options.addDeclaration({
        name: "markedOptions",
        help:
            "Specify the options passed to Marked, the Markdown parser used by TypeDoc",
        type: ParameterType.Mixed,
    });
}
