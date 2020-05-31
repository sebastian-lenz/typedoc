#!/usr/bin/env node
//@ts-check

const { Application, ArgumentsReader, TypeDocReader, TSConfigReader } = require('..');

async function main() {
    const app = new Application();
    app.options.addReader(new ArgumentsReader(0));
    app.options.addReader(new TypeDocReader());
    app.options.addReader(new TSConfigReader());
    app.options.addReader(new ArgumentsReader(300));

    app.bootstrap();

    if (app.options.getValue('version')) {
        app.logger.writeln(app.toString());
    }

    if (app.options.getValue('help')) {
        app.logger.writeln(app.options.getHelp());
    }

    if (app.options.getValue('inputFiles').length === 0) {
        app.logger.error('No input files discovered.');
        process.exit(1);
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

    // Output errors?
    return app.logger.hasErrors() ? 1 : 0;
}

main().catch(err => {
    console.error('TypeDoc exiting with an unexpected error. File a bug report.');
    console.error(err);
    return 2;
}).then(process.exit)
