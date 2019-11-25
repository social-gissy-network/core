import {DBManager} from './neo4j';
import {Edge, Node} from './types';

const {fieldsMapping} = require('./fieldsMapping');

const csvFilePath = process.argv[2];
const startIdx = process.argv[3];
const endIdx = process.argv[4];
const deleteFlag = process.argv[4] === "delete";


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
        let percentage = (counter / dataset.length) * 100;

        let afterTheDot = ``;
        try {
            afterTheDot = percentage.toString().split(".")[1].substring(0, 3)
        } catch (e) {

        }
        let percentageStr = percentage.toString().split(".")[0] + "." + afterTheDot;

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

            try {
                await db.insertNode(startNode);
            } catch (e) {

            }
            nodes.push(startNode);
        }
        if (!nodes.find(node => node.id === endNode.id)) {
            try {
                await db.insertNode(endNode);
            } catch (e) {

            }
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
    console.log("reading dataset");
    const csv = require('csvtojson');
    const dataset = await csv().fromFile(csvFilePath);

    // 2. clean database: uncomment following lines if you'd like to remove existing data on db
    if (deleteFlag) {
        console.log("cleaning database");
        await db.deleteAllEdges();
        await db.deleteAllNodes();
    }

    // 3. set constraints
    console.log("setting constraints");
    await db.setConstraints();

    // 4. populate database with data
    console.log(`start seeding dataset[${startIdx}, ${endIdx}]`);
    await storeDataOnDB(dataset.slice(startIdx, endIdx), fieldsMapping);
})()
    .catch(error => {
        console.log(error);
    })
    .then(() => {
        db.close();
    });
