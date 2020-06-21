import { Application, ProjectReflection } from '..';
import * as FS from 'fs-extra';
import * as Path from 'path';
import Assert = require('assert');
import { ScriptTarget, ModuleKind } from 'typescript';

function getFileIndex(base: string, dir: string = '', results: string[] = []) {
    const files = FS.readdirSync(Path.join(base, dir));
    files.forEach(function(file) {
        file = Path.join(dir, file);
        if (FS.statSync(Path.join(base, file)).isDirectory()) {
            getFileIndex(base, file, results);
        } else {
            results.push(file);
        }
    });

    return results.sort();
}

function compareDirectories(a: string, b: string) {
    const aFiles = getFileIndex(a);
    const bFiles = getFileIndex(b);
    Assert.deepEqual(aFiles, bFiles, `Generated files differ. between "${ a }" and "${ b }"`);

    const gitHubRegExp = /https:\/\/github.com\/[A-Za-z0-9\-]+\/typedoc\/blob\/[^\/]*\/examples/g;
    aFiles.forEach(function (file) {
        const aSrc = FS.readFileSync(Path.join(a, file), {encoding: 'utf-8'})
            .replace('\r', '')
            .replace(gitHubRegExp, '%GITHUB%');
        const bSrc = FS.readFileSync(Path.join(b, file), {encoding: 'utf-8'})
            .replace('\r', '')
            .replace(gitHubRegExp, '%GITHUB%');

        Assert.strictEqual(bSrc, aSrc, `File contents of "${file}" differ.`);
    });
}

describe('Renderer', function() {
    const src = Path.join(__dirname, '..', '..', 'examples', 'basic', 'src');
    const out = Path.join(__dirname, '..', 'tmp', 'test');
    let app: Application, project: ProjectReflection | undefined;

    before(function() {
        FS.removeSync(out);
    });

    after(function() {
        FS.removeSync(out);
    });

    it('constructs', function() {
        app = new Application();
        app.bootstrap({
            logger: 'console',
            target: ScriptTarget.ES5,
            readme: Path.join(src, '..', 'README.md'),
            module: ModuleKind.CommonJS,
            gaSite: 'foo.com', // verify theme option without modifying output
            name: 'typedoc',
            disableSources: true
        });
    });

    it('converts basic example', async function() {
        this.timeout(0);
        app.options.setValue('inputFiles', [src]);
        project = await app.convert();

        Assert(!app.logger.hasErrors(), 'Application.convert returned errors');
        Assert(project instanceof ProjectReflection, 'Application.convert did not return a reflection');
    });

    it('renders basic example', async function() {
        this.timeout(0);
        await app.generateDocs(project!, out);

        compareDirectories(Path.join(__dirname, 'renderer', 'specs'), out);
    });
});
