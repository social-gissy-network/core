const neo4j = require('neo4j-driver').v1;
// Create a session to run Cypher statements in.
// Note: Always make sure to close sessions when you are done using them!

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'neo4j'),
);

const csvFilePath = 'data/201901-bluebikes-tripdata.xls';
const csv = require('csvtojson');

const session = driver.session();

// remove quotes on properties
const stringify = object => JSON.stringify(object).replace(/"([^(")"]+)":/g, '$1:');

const removeAllNodes = async () => session.run(`MATCH (n:Node) DELETE n`);

const removeAllEdges = async () => session.run(`MATCH e=(s1)-[r:EDGE]->(s2) DELETE e`);

const insertNode = async node => session.run(`CREATE (:Node ${stringify(node)})`);

const insertEdge = async (startNode, endNode, edgeInfo) => {
  // MATCH (n {name: "Alice"})-->(m)
  const query = `MATCH (n1:Node {id: "${startNode.id}"}),(n2:Node {id: "${endNode.id}"})
    CREATE (n1)-[r:EDGE ${stringify(edgeInfo)}]->(n2)`;
  return session.run(query);
};

(async () => {
  const dataset = await csv().fromFile(csvFilePath);

  await removeAllEdges();
  await removeAllNodes();

  await session.run('CREATE CONSTRAINT ON (p:Node) ASSERT p.id IS UNIQUE');

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
      await insertNode(startNode);
      nodes.push(startNode);
    }
    if (!nodes.find(node => node.id === endNode.id)) {
      await insertNode(endNode);
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

    await insertEdge(startNode, endNode, edgeInfo);
  }
})()
  .catch(error => {
    // console.log(error);
  })
  .then(() => {
    session.close();
  });
