const csvFilePath = 'data/201901-bluebikes-tripdata.xls';
const csv = require('csvtojson');

const db = require("./neo4j.js");
db.init();

(async () => {

  const dataset = await csv().fromFile(csvFilePath);

  // await db.setNodeConstraints();
  // await db.removeAllEdges();
  // await db.removeAllNodes();


  const nodes = [];

  for (const dataElement of dataset) {
    // insert nodes if needed
    const startNode = {
      longitude: dataElement['start station longitude'],
      latitude: dataElement['start station latitude'],

      id: dataElement['start station id'],
      name: dataElement['start station name'],
    };

    const endNode = {
      longitude: dataElement['end station longitude'],
      latitude: dataElement['end station latitude'],

      id: dataElement['end station id'],
      name: dataElement['end station name'],
    };

    if (!nodes.find(node => node.id === startNode.id)) {
      await db.insertNode(startNode);
      nodes.push(startNode);
    }
    if (!nodes.find(node => node.id === endNode.id)) {
      await db.insertNode(endNode);
      nodes.push(endNode);
    }

    // insert edge
    const edgeInfo = {
      startTime: dataElement['starttime'],
      stopTime: dataElement['stoptime'],

      bikeID: dataElement['bikeid'],
      userType: dataElement['usertype'],
      birthYear: dataElement['birth year'],
      gender: dataElement['gender'],
    };

    await db.insertEdge(startNode, endNode, edgeInfo);
  }
})()
  .catch(error => {
    console.log(error);
  })
  .then(() => {
    db.close();
  });
