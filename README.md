# TypeDoc

> Documentation generator for TypeScript projects.

[![Build Status](https://github.com/TypeStrong/typedoc/workflows/CI/badge.svg)](https://github.com/TypeStrong/typedoc/actions)
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

Like the TypeScript compiler, TypeDoc comes with a binary that can be run with `npx`.

```bash
$ npx typedoc path/to/entry.ts
```

## Usage

To run TypeDoc, pass it your library's entry point. TypeDoc will use the TypeScript compiler to
determine what has been exported and document those items. If you specify a directory as an
entry point, TypeDoc will treat all files and folders within that directory as entry points.

TypeDoc will try to discover your tsconfig.json file, but if it fails, you can specify the path
to it with `--tsconfig`.

```bash
$ typedoc --tsconfig path/to/tsconfig.json path/to/entry.ts
```

### Common Arguments

For a complete list of the command line arguments run `typedoc --help` or visit [our website](https://typedoc.org/guides/options/).

- `--html <path/to/documentation/>`<br>
  Specifies the location the documentation should be written to. Defaults to `./docs`
- `--theme <default|minimal|path/to/theme>`<br>
  Specify the path to the theme that should be used.
- `--json <path/to/output.json>`<br>
  Specifies the location and file name a json file describing the project is written to.

## Contributing

This project is maintained by a community of developers. Contributions are welcome and appreciated.
You can find TypeDoc on GitHub; feel free to start an issue or create a pull requests:<br>
[https://github.com/TypeStrong/typedoc](https://github.com/TypeStrong/typedoc)

For more information, read the [contribution guide](https://github.com/TypeStrong/typedoc/blob/master/CONTRIBUTING.md).

## License

Copyright (c) 2015 [Sebastian Lenz](https://typedoc.org).<br>
Copyright (c) 2016-2020 [TypeDoc Contributors](https://github.com/TypeStrong/typedoc/graphs/contributors).<br>
Licensed under the Apache License 2.0.
