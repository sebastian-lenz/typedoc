// @ts-check
// Sets the Strict type that TypeDoc uses to enable overloads for consumers only.
// See the rationale in src/lib/utils/index.ts

const fs = require('fs-extra');
const { join } = require('path');

const file = join(__dirname, '../src/lib/utils/index.ts');

const isStrict = process.argv[2] === 'true'

fs.readFile(file, { encoding: 'utf-8'})
    .then(text => fs.writeFile(file, text.replace(/type Strict =.*/, `type Strict = ${isStrict};`)))
    .catch(reason => {
        console.error(reason);
        process.exit(1);
    });

