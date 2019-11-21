// 0. create types file dynamically - specific for a given dataset

const fs = require('fs');
const { fieldsMapping } = require('./fieldsMapping');

let typesFile = ``;
typesFile += `export interface Node {\n`;
for (const property of fieldsMapping.startNode) {
  typesFile += `\t${[property.fieldName]}: string\n`;
}
typesFile += `}\n`;

typesFile += `\n`;

typesFile += `export interface Edge {\n`;
typesFile += `\tstartNode: Node,\n`;
typesFile += `\tstopNode: Node,\n`;
for (const property of fieldsMapping.edgeInfo) {
  typesFile += `\t${[property.fieldName]}: string\n`;
}
typesFile += `}`;

fs.writeFileSync('src/types.ts', typesFile);
console.log("src/types.ts created");

let fielsMapping = fs.readFileSync('setup/fieldsMapping.js');

fs.writeFileSync('src/fieldsMapping.ts', fielsMapping);
console.log("src/fieldsMapping.ts created");
