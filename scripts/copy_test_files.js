// @ts-check

const fs = require('fs/promises');
const { copy } = require('../dist/lib/utils/fs');
const { join } = require('path');

const tasks = [
    'test/converter',
    'test/renderer',
    'test/utils/options/readers/data',
];

const copies = tasks.map(dir => {
    const source = join(__dirname, '../src', dir);
    const target = join(__dirname, '../dist', dir);
    return fs.rmdir(target, { recursive: true })
        .then(() => fs.mkdir(target, { recursive: true }))
        .then(() => copy(source, target));
})

Promise.all(copies).catch(reason => {
    console.error(reason);
    process.exit(1);
});
