// @ts-check

const fs = require('fs-extra');
const path = require('path');
const TypeDoc = require('..');
const ts = require('typescript');

const app = new TypeDoc.Application();
app.bootstrap({
    target: ts.ScriptTarget.ES2016,
    module: ts.ModuleKind.CommonJS,
    experimentalDecorators: true,
    jsx: ts.JsxEmit.React,
    lib: [
        "lib.dom.d.ts",
        "lib.es5.d.ts",
        "lib.es2015.iterable.d.ts",
        "lib.es2015.collection.d.ts"
    ],
    name: 'typedoc',
    excludeExternals: true,
    disableSources: true
});

// TODO GERRIT This should be removable once plugins are working.
app.converter.on('end', (project) => {
    /** @type {import('..').SomeReflection[]} */
    const toVisit = [project];

    while (toVisit.length) {
        const item = toVisit.pop();
        if (item instanceof TypeDoc.ContainerReflection) {
            toVisit.push(...item.children);
            item.children.sort((a, b) => a.name.localeCompare(b.name));
        }
    }
})

// Note that this uses the test files in dist, not in src, this is important since
// when running the tests we copy the tests to dist and then convert them.
const base = path.join(__dirname, '../dist/test/converter');

/** @type {[string, () => void, () => void][]} */
const conversions = [
    ['specs', () => { }, () => { }],
    ['specs.d',
        () => app.options.setValue('includeDeclarations', true),
        () => app.options.setValue('includeDeclarations', false)
    ],
    ['specs-without-exported',
        () => app.options.setValue('excludeNotExported', true),
        () => app.options.setValue('excludeNotExported', false)
    ],
    ['specs-with-lump-categories',
        () => app.options.setValue('categorizeByGroup', false),
        () => app.options.setValue('categorizeByGroup', true)
    ],
    ['specs.nodoc',
        () => app.options.setValue('excludeNotDocumented', true),
        () => app.options.setValue('excludeNotDocumented', false)
    ]
];

/**
 * Rebuilds the converter specs for the provided dirs.
 * @param {string[]} dirs
 */
function rebuildConverterTests(dirs) {
    return Promise.all(dirs.map(fullPath => {
        console.log(fullPath);
        app.options.setValue('inputFiles', [fullPath]);

        return Promise.all(conversions.map(async ([file, before, after]) => {
            const out = path.join(fullPath, `${file}.json`);
            if (fs.existsSync(out)) {
                TypeDoc.resetReflectionID();
                before();
                const result = await app.convert();
                const serialized = app.serializer.toObject(result);

                const data = JSON.stringify(serialized, null, '  ')
                    .split(TypeDoc.normalizePath(base))
                    .join('%BASE%');
                after();
                return fs.writeFile(out.replace('dist', 'src'), data);
            }
        }));
    }));
}

async function rebuildRendererTest() {
    await fs.remove(path.join(__dirname, '../src/test/renderer/specs'));
    const src = path.join(__dirname, '../examples/basic/src');
    const out = path.join(__dirname, '../src/test/renderer/specs');

    await fs.remove(out)
    app.options.setValue('excludeExternals', false);
    app.options.setValue('inputFiles', [src]);
    const project = await app.convert();
    await app.generateDocs(project, out);
    app.options.setValue('excludeExternals', true);

    /**
     * Avoiding sync methods here is... difficult.
     * @param {string} base
     * @param {string} dir
     * @param {string[]} results
     * @returns {string[]}
     */
    function getFiles(base, dir = '', results = []) {
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

    const gitHubRegExp = /https:\/\/github.com\/[A-Za-z0-9\-]+\/typedoc\/blob\/[^\/]*\/examples/g;
    return getFiles(out).map(file => {
        const full = path.join(out, file);
        return fs.readFile(full, { encoding: 'utf-8' })
            .then(text => fs.writeFile(
                full,
                text.replace(gitHubRegExp, 'https://github.com/sebastian-lenz/typedoc/blob/master/examples')
            ));
    });
}

async function main(command = 'all', filter = '') {
    if (!['all', 'converter', 'renderer'].includes(command)) {
        console.error('Invalid command. Usage: node scripts/rebuild_specs.js <all|converter|renderer> [filter]');
        throw new Error();
    }

    if (['all', 'converter'].includes(command)) {
        const dirs = await Promise.all((await fs.readdir(base)).map(dir => {
            const dirPath = path.join(base, dir);
            return Promise.all([dirPath, fs.stat(dirPath)]);
        }));

        await rebuildConverterTests(dirs.filter(([fullPath, stat]) => {
            if (!stat.isDirectory()) return false;
            return fullPath.endsWith(filter);
        }).map(([path]) => path));
    } else if (filter !== '') {
        console.warn('Specifying a filter when rebuilding render specs only has no effect.');
    }

    if (['all', 'renderer'].includes(command)) {
        await rebuildRendererTest();
    }
}

main(process.argv[2], process.argv[3]).catch(reason => {
    console.error(reason);
    process.exit(1);
});
