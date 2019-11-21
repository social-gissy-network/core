import { DBManager } from './neo4j';
import { Edge, Node } from './types';
const csvFilePath = "../data/201910-bluebikes-tripdata.csv";

let db = new DBManager();

/**
 * saves each data element from dataset in DB - represented as edge connecting two nodes
 * @param dataset
 * @returns {Promise<void>}
 */
let storeDataOnDB = async (dataset: any, fieldsMapping: any) => {
  const nodes: Array<Node> = [];

  let counter = 0;
  setInterval(() => {
    let percentage = (counter/dataset.length) * 100;

    let percentageStr = percentage.toString().split(".")[0] + "." + percentage.toString().split(".")[1].substring(0, 3);

    console.log(`storeDataOnDB progress: ${counter}/${dataset.length}; percentage: ${percentageStr}%`)
  }, 10000);

  for (const dataElement of dataset) {
    // construct nodes
    let startNode: any = {};
    let endNode: any = {};

    for (const property of fieldsMapping.startNode) {
      startNode[property.fieldName] = dataElement[property.fieldDataName];
    }

    for (const property of fieldsMapping.endNode) {
      endNode[property.fieldName] = dataElement[property.fieldDataName];
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
    let edgeInfo: any = {};
    for (const property of fieldsMapping.edgeInfo) {
      edgeInfo[property.fieldName] = dataElement[property.fieldDataName];
    }

    await db.insertEdge(startNode, endNode, edgeInfo);
    counter++;
  }
};

(async () => {
  const fs = require('fs');

  // 1. read dataset
  const csv = require('csvtojson');
  const dataset = await csv().fromFile(csvFilePath);

  // 2. clean database: uncomment following lines if you'd like to remove existing data on db
  await db.deleteAllEdges();
  await db.deleteAllNodes();

  // 3. set constraints
  await db.setConstraints();

  // 4. populate database with data
  let fieldsMapping = require("./fieldsMapping");
  await storeDataOnDB(dataset, fieldsMapping);
})()
  .catch(error => {
    console.log(error);
  })
  .then(() => {
    db.close();
  });
