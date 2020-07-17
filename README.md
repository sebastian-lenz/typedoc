# TypeDoc

> Documentation generator for TypeScript projects.

[![Build Status](https://travis-ci.org/TypeStrong/typedoc.svg?branch=master)](https://travis-ci.org/TypeStrong/typedoc)
[![NPM Version](https://badge.fury.io/js/typedoc.svg)](https://badge.fury.io/js/typedoc)
[![Chat on Gitter](https://badges.gitter.im/TypeStrong/typedoc.svg)](https://gitter.im/TypeStrong/typedoc?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Documentation

Visit our website for more complete documentation and example API documentation:<br>
[https://typedoc.org](https://typedoc.org).

There you can find an [installation guide](https://typedoc.org/guides/installation/) explaining
how to use typedoc from the cli, webpack, grunt, or gulp. There are additional guides explaining
how to extend typedoc using [plugins](https://typedoc.org/guides/plugins/) and
[themes](https://typedoc.org/guides/themes/).

## Installation

TypeDoc runs on Node.js and is available as an NPM package. You can install TypeDoc
in your project's directory as usual:

```bash
$ npm install typedoc --save-dev
```

Like the TypeScript compiler, TypeDoc comes with a binary that can be called from anywhere
if you install TypeDoc as a global module. The name of the executable is `typedoc`.

```bash
$ npm install typedoc --global
$ typedoc
```

## Usage

### Shell

TypeDoc accepts most of the command line arguments that the TypeScript compiler accepts. One major
difference is the fact that one may pass an entire directory instead of individual files to the documentation
generator. So in order to create a documentation for an entire project you simply type:

```bash
$ typedoc --out path/to/documentation/ path/to/typescript/project/
```

### Arguments

For a complete list of the command line arguments run `typedoc --help` or visit [our website](https://typedoc.org/guides/options/).

- `--out <path/to/documentation/>`<br>
  Specifies the location the documentation should be written to. Defaults to `./docs`
- `--mode <file|modules>`<br>
  Specifies the output mode the project is used to be compiled with.
- `--options`<br>
  Specify a json option file that should be loaded. If not specified TypeDoc will look for 'typedoc.json' in the current directory.
- `--json <path/to/output.json>`<br>
  Specifies the location and file name a json file describing the project is written to. When specified no documentation will be generated.
- `--ignoreCompilerErrors`<br>
  Allows TypeDoc to still generate documentation pages even after the compiler has returned errors.

#### Source file handling

- `--exclude <pattern>`<br>
  Exclude files by the given pattern when a path is provided as source. Supports standard minimatch patterns (see [#170](https://github.com/TypeStrong/typedoc/issues/170))
- `--includeDeclarations`<br>
  Turn on parsing of .d.ts declaration files.
- `--excludeExternals`<br>
  Do not document external files, highly recommended if turning on `--includeDeclarations`.
- `--excludeNotDocumented`<br>
  Do not include the code symbols, that don't have doc comments. This option is useful,
  if you want to document only small part of your symbols and do not show the remaining ones in the documentation.

#### TypeScript compiler

- `--tsconfig <path/to/tsconfig.json>`<br>
  Specify a typescript config file that should be loaded. If not specified TypeDoc will look for 'tsconfig.json' in the current directory.

#### Theming

- `--theme <default|minimal|path/to/theme>`<br>
  Specify the path to the theme that should be used.
- `--name <Documentation title>`<br>
  Set the name of the project that will be used in the header of the template.
- `--readme <path/to/readme|none>`<br>
  Path to the readme file that should be displayed on the index page. Pass `none` to disable the index page
  and start the documentation on the globals page.

#### Miscellaneous

- `--listInvalidSymbolLinks`<br>
  Display the list of links that don't point to actual code symbols.
- `--version`<br>
  Display the version number of TypeDoc.
- `--help`<br>
  Display all TypeDoc options.

## Contributing

This project is maintained by a community of developers. Contributions are welcome and appreciated.
You can find TypeDoc on GitHub; feel free to start an issue or create a pull requests:<br>
[https://github.com/TypeStrong/typedoc](https://github.com/TypeStrong/typedoc)

For more information, read the [contribution guide](https://github.com/TypeStrong/typedoc/blob/master/CONTRIBUTING.md).

## License

Copyright (c) 2015 [Sebastian Lenz](https://typedoc.org).<br>
Copyright (c) 2016-2020 [TypeDoc Contributors](https://github.com/TypeStrong/typedoc/graphs/contributors).<br>
Licensed under the Apache License 2.0.
