#!/usr/bin/env node
//@ts-check

const start = Date.now();
const { Application, ArgumentsReader, TypeDocReader, TSConfigReader } = require('..');

async function main() {
    const mainStart = Date.now();

    // Make debugging a bit easier.
    Error.stackTraceLimit = 20;

    const app = new Application();
    app.options.addReader(new ArgumentsReader(0));
    app.options.addReader(new TypeDocReader());
    app.options.addReader(new TSConfigReader());
    app.options.addReader(new ArgumentsReader(300));

    app.bootstrap();

    app.logger.verbose(`[Perf] Loading libraries took ${mainStart - start}ms`);

    if (app.options.getValue('version')) {
        app.logger.writeln(`TypeDoc v${require('../package.json').version}`);
        return 0;
    }

    if (app.options.getValue('help')) {
        app.logger.writeln(app.options.getHelp());
        return 0;
    }

    if (app.options.getCompilerOptions().showConfig) {
        app.logger.writeln(JSON.stringify(app.options.getRawValues(), null, 2))
        return 0;
    }

    if (app.options.getValue('inputFiles').length === 0) {
        app.logger.error('No input files discovered.');
        return 1;
    }

    const project = await app.convert();
    if (!project) { // Compiler errors
        return 1;
    }

    const out = app.options.getValue('out');
    const json = app.options.getValue('json');

    if (json) {
        await app.generateJson(project, json);
    }
    if (out) {
        await app.generateDocs(project, out);
    }
    if (!json && !out) {
        await app.generateDocs(project, './docs');
    }

    app.logger.verbose(`[Perf] Run took ${Date.now() - start}ms`);

    return 0;
}

main().catch(err => {
    console.error('TypeDoc exiting with an unexpected error. File a bug report.');
    console.error(err);
    return 2;
}).then(process.exit)
