// @ts-check

const fs = require('fs-extra');
const { join } = require('path');

const copy = [
    'test/converter',
    'test/renderer',
    'test/utils/options/readers/data',
];

const copies = copy.map(dir => {
    const source = join(__dirname, '../src', dir);
    const target = join(__dirname, '../dist', dir);
    return fs.remove(target)
        .then(() => fs.mkdirp(target))
        .then(() => fs.copy(source, target));
})

Promise.all(copies).catch(reason => {
    console.error(reason);
    process.exit(1);
});
