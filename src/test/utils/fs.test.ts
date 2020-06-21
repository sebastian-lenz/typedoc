import { deepStrictEqual as equal, ok as assert } from 'assert';
import { join } from 'path';
import { expandDirectories } from '../../lib/utils';
import { getCommonDirectory } from '../../lib/utils/fs'

describe('FS Utils', () => {
    describe('expandDirectories', () => {
        const classDir = join(__dirname, '..', 'converter', 'class');
        const classFile = join(classDir, 'class.ts');
        const accessFile = join(classDir, 'access.ts');

        it ('expands directories', async () => {
            const expanded = await expandDirectories([classDir], [], false, false);

            assert(expanded.includes(join(classDir, 'class.ts')));
            assert(!expanded.includes(classDir));
        });

        it('expands files', async () => {
            const expanded = await expandDirectories([classFile], [], false, false);
            assert(expanded.includes(classFile));
        });

        it('honors the exclude argument even on a fixed file list', async () => {
            const expanded = await expandDirectories([classFile], ['**/class.ts'], false, false);
            assert(!expanded.includes(classFile));
        });

        it('supports multiple excludes', async () => {
            const expanded = await expandDirectories([classDir], ['**/+(class|access).ts'], false, false);
            assert(!expanded.includes(classFile));
            assert(!expanded.includes(accessFile));
        });

        it('supports array of excludes', async () => {
            const expanded = await expandDirectories([classDir], ['**/class.ts', '**/access.ts'], false, false);
            assert(!expanded.includes(classFile));
            assert(!expanded.includes(accessFile));
        });

        it('supports directory excludes', async () => {
            const inputFiles = join(__dirname, 'converter');
            const expanded = await expandDirectories([inputFiles], ['**/alias'], false, false);
            assert(expanded.includes(join(inputFiles, 'class', 'class.ts')));
            assert(!expanded.includes(join(inputFiles, 'alias', 'alias.ts')));
        });

        it('supports negations in directory excludes', async () => {
            const inputFiles = join(__dirname, 'converter');
            const expanded = await expandDirectories([inputFiles], ['**/!(alias)/'], false, false);
            assert(!expanded.includes(join(inputFiles, 'class', 'class.ts')));
            assert(expanded.includes(join(inputFiles, 'alias', 'alias.ts')));
        });

        it('supports including js files');
        it('supports including declaration files');
        it('supports including json files');
    });

    describe('getCommonDirectory', () => {
        it('Works with a basic example', () => {
            equal(getCommonDirectory([
                '/a/b/c/d.ts',
                '/a/b/d.ts'
            ]), '/a/b')
        });

        it('Works with Windows paths', () => {
            equal(getCommonDirectory([
                'C:\\Users\\gerrit\\Documents\\GitHub\\typedoc\\dist\\test\\converter\\class\\generic-class.ts',
                'C:\\Users\\gerrit\\Documents\\GitHub\\typedoc\\dist\\test\\converter\\class\\events.ts',
                'C:\\Users\\gerrit\\Documents\\GitHub\\typedoc\\dist\\test\\converter\\class\\getter-setter.ts',
                'C:\\Users\\gerrit\\Documents\\GitHub\\typedoc\\dist\\test\\converter\\class\\this.ts',
                'C:\\Users\\gerrit\\Documents\\GitHub\\typedoc\\dist\\test\\converter\\class\\type-operator.ts'
            ]), 'C:/Users/gerrit/Documents/GitHub/typedoc/dist/test/converter/class')
        });

        it('Works with no paths', () => equal(getCommonDirectory([]), ''));
    })
});
