// @ts-check

const fs = require("fs").promises;
const { copy, remove } = require("../dist/lib/utils/fs");
const { join } = require("path");

const tasks = [
  "test/converter",
  "test/renderer",
  "test/utils/options/readers/data",
];

const copies = tasks.map(async (dir) => {
  const source = join(__dirname, "../src", dir);
  const target = join(__dirname, "../dist", dir);
  await remove(target);
  await fs.mkdir(target, { recursive: true });
  return copy(source, target);
});

Promise.all(copies).catch((reason) => {
  console.error(reason);
  process.exit(1);
});
