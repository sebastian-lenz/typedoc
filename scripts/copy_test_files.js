// @ts-check

const fs = require("fs");
const { remove, copy } = require("../dist/lib/utils/fs");
const { join } = require("path");

const toCopy = [
    "test/converter",
    "test/renderer",
    "test/module",
    "test/utils/options/readers/data",
];

for (const dir of toCopy) {
    const source = join(__dirname, "../src", dir);
    const target = join(__dirname, "../dist", dir);
    remove(target);
    fs.mkdirSync(target, { recursive: true });
    copy(source, target);
}
