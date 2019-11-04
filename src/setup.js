const csvFilePath = 'data/201901-bluebikes-tripdata.csv';
const csv = require('csvtojson');

const {fieldsMapping} =  require("./consts");

const db = require("./neo4j.js");
db.init();

(async () => {
  // create schema
  let typeDefs = `# schema dynamically created by setup.js on ${(new Date()).toISOString()}\n\n`;

  typeDefs += `type Node {\n`;
  for (const property of fieldsMapping.startNode) {
    typeDefs += (`\t${property.name}: ${property.type}\n`)
  }
  typeDefs += `}\n\n`;


  typeDefs += `input NodeInput {\n`;
  for (const property of fieldsMapping.startNode) {
    typeDefs += (`\t${property.name}: ${property.type}\n`)
  }
  typeDefs += `}\n\n`;


  typeDefs += `type Edge {\n`;
  for (const property of fieldsMapping.edgeInfo) {
    typeDefs += (`\t${property.name}: ${property.type}\n`)
  }
  typeDefs += (`\tstartNode: Node\n`);
  typeDefs += (`\tstopNode: Node\n`);

  typeDefs += `}\n\n`;

  typeDefs +=`type Mutation {\n`;
  typeDefs += `\tCreateEdge(startNode: NodeInput, stopNode: NodeInput, startTime: String, stopTime: String): Edge\n`;
  typeDefs += `}`;

  const fs = require("fs");
  fs.writeFileSync("schema.graphql", typeDefs);

  const dataset = await csv().fromFile(csvFilePath);

  // await db.setNodeConstraints();
  await db.removeAllEdges();
  await db.removeAllNodes();


  const nodes = [];

  for (const dataElement of dataset) {
    // construct nodes
    let startNode = {}, endNode = {};

    for (const property of fieldsMapping.startNode) {
      startNode[property.name] = dataElement[property.dataName];
    }

    for (const property of fieldsMapping.endNode) {
      endNode[property.name] = dataElement[property.dataName];
    }


    // insert nodes if needed
    if (!nodes.find(node => node.id === startNode.id)) {
      await db.insertNode(startNode);
      nodes.push(startNode);
    }
    if (!nodes.find(node => node.id === endNode.id)) {
      await db.insertNode(endNode);
      nodes.push(endNode);
    }


    // construct edgeInfo
    let edgeInfo = {};
    for (const property of fieldsMapping.edgeInfo) {
      edgeInfo[property.name] = dataElement[property.dataName];
    }

    await db.insertEdge(startNode, endNode, edgeInfo);
  }
})()
  .catch(error => {
    console.log(error);
  })
  .then(() => {
    db.close();
  });
