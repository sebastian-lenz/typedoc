"use strict";
// @ts-check

const ts = require("typescript");
const fs = require("fs-extra");
const path = require("path");
const TypeDoc = require("..");

const app = new TypeDoc.Application();
app.options.addReader(new TypeDoc.TSConfigReader());
app.bootstrap({
    name: "typedoc",
    excludeExternals: true,
    disableSources: true,
    tsconfig: path.join(
        __dirname,
        "..",
        "dist",
        "test",
        "converter",
        "tsconfig.json"
    ),
    externalPattern: ["**/node_modules/**"],
    logLevel: "Warn",
});

// Note that this uses the test files in dist, not in src, this is important since
// when running the tests we copy the tests to dist and then convert them.
const base = path.join(__dirname, "../dist/test/converter");

/** @type {[string, () => void, () => void][]} */
const conversions = [
    [
        "specs",
        () => {
            // nop
        },
        () => {
            // nop
        },
    ],
    [
        "specs-with-lump-categories",
        () => app.options.setValue("categorizeByGroup", false),
        () => app.options.setValue("categorizeByGroup", true),
    ],
    [
        "specs.nodoc",
        () => app.options.setValue("excludeNotDocumented", true),
        () => app.options.setValue("excludeNotDocumented", false),
    ],
];

/**
 * Rebuilds the converter specs for the provided dirs.
 * @param {string[]} dirs
 */
function rebuildConverterTests(dirs) {
    const program = ts.createProgram(
        app.options.getFileNames(),
        app.options.getCompilerOptions()
    );

    const errors = ts.getPreEmitDiagnostics(program);
    if (errors.length) {
        app.logger.diagnostics(errors);
        return;
    }

    for (const fullPath of dirs) {
        const src = app.expandInputFiles([fullPath]);

        for (const [file, before, after] of conversions) {
            const out = path.join(fullPath, `${file}.json`);
            if (fs.existsSync(out)) {
                TypeDoc.resetReflectionID();
                before();
                const result = app.converter.convert(src, program);
                const serialized = app.renderers
                    .getRenderer("json")
                    .toObject(result);

                const data = JSON.stringify(serialized, null, "  ")
                    .split(TypeDoc.normalizePath(base))
                    .join("%BASE%");
                after();
                fs.writeFileSync(out.replace("dist", "src"), data);
            }
        }
    }
}

async function rebuildRendererTest() {
    await fs.remove(path.join(__dirname, "../src/test/renderer/specs"));
    const src = path.join(__dirname, "../examples/basic/src");
    const out = path.join(__dirname, "../src/test/renderer/specs");
    await fs.remove(out);

    const app = new TypeDoc.Application();
    app.options.addReader(new TypeDoc.TSConfigReader());
    app.bootstrap({
        name: "typedoc",
        disableSources: true,
        gaSite: "foo.com",
        tsconfig: path.join(src, "..", "tsconfig.json"),
        externalPattern: ["**/node_modules/**"],
        disableOutputCheck: true,
        entryPoints: app.expandInputFiles([src]),
        out: out,
        json: path.join(out, "specs.json"),
        logLevel: "Warn",
    });

    const project = app.convert();
    await app.render(project);

    /**
     * Avoiding sync methods here is... difficult.
     * @param {string} base
     * @param {string} dir
     * @param {string[]} results
     * @returns {string[]}
     */
    function getFiles(base, dir = "", results = []) {
        const files = fs.readdirSync(path.join(base, dir));
        for (const file of files) {
            const relativeToBase = path.join(dir, file);
            if (fs.statSync(path.join(base, relativeToBase)).isDirectory()) {
                getFiles(base, relativeToBase, results);
            } else {
                results.push(relativeToBase);
            }
        }
        return results;
    }

    const gitHubRegExp = /https:\/\/github.com\/[A-Za-z0-9-]+\/typedoc\/blob\/[^/]*\/examples/g;
    return getFiles(out).map((file) => {
        const full = path.join(out, file);
        return fs
            .readFile(full, { encoding: "utf-8" })
            .then((text) =>
                fs.writeFile(
                    full,
                    text.replace(
                        gitHubRegExp,
                        "https://github.com/TypeStrong/typedoc/blob/master/examples"
                    )
                )
            );
    });
}

async function main(command = "all", filter = "") {
    if (!["all", "converter", "renderer"].includes(command)) {
        console.error(
            "Invalid command. Usage: node scripts/rebuild_specs.js <all|converter|renderer> [filter]"
        );
        throw new Error();
    }

    if (["all", "converter"].includes(command)) {
        const dirs = await Promise.all(
            (await fs.readdir(base)).map((dir) => {
                const dirPath = path.join(base, dir);
                return Promise.all([dirPath, fs.stat(dirPath)]);
            })
        );

        await rebuildConverterTests(
            dirs
                .filter(([fullPath, stat]) => {
                    if (!stat.isDirectory()) return false;
                    return fullPath.endsWith(filter);
                })
                .map(([path]) => path)
        );
    } else if (filter !== "") {
        console.warn(
            "Specifying a filter when rebuilding render specs only has no effect."
        );
    }

    if (["all", "renderer"].includes(command)) {
        await rebuildRendererTest();
    }
}

main(process.argv[2], process.argv[3]).catch((reason) => {
    console.error(reason);
    process.exit(1);
});
