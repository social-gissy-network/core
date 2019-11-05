const neo4j = require('neo4j-driver').v1;

const NEO4J_URL = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'neo4j';

const ERROR = {
  NODE_DOESNT_EXIST: "node doesn't exist",
};

let driver;
let session;

// remove quotes on properties
function _stringify(object) {
  return JSON.stringify(object).replace(/"([^(")"]+)":/g, '$1:');
}

function _matchQueryByParams(typeName, params) {
  let query = `MATCH (n:${typeName}) `;
  let counter = 0;
  for (const paramName of Object.keys(params)) {
    query += counter === 0 ? `WHERE ` : ``;

    query += `n.${paramName} = "${params[paramName]}" `;
    counter++;

    query += counter < Object.keys(params).length ? `AND ` : ``;
  }
  query += `RETURN n`;
  return query;
}

exports.init = () => {
  // Create a driver instance, for the user neo4j with password neo4j.
  // It should be enough to have a single driver per database per application.
  driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

  // Create a session to run Cypher statements in.
  // Note: Always make sure to close sessions when you are done using them!
  session = driver.session();
};

exports.close = () => driver.close();

exports.removeAllNodes = async () => session.run(`MATCH (n:Node) DELETE n`);

exports.getAllEdges = async () => {
  let result = await session.run(`MATCH p=(p1:Node)-[e:EDGE]->(p2:Node) RETURN p`);
  return result.records.map(record => result.records[0].toObject().p.segments[0]);
};

exports.getAllNodes = async () => {
  let result = await session.run(`MATCH (n:Node) RETURN n`);
  return result.records.map(record => record.toObject().n.properties);
};

exports.getNodeByParams = async params => {
  let result = await session.run(_matchQueryByParams('Node', params));
  return result.records.map(record => record.toObject().n.properties);
};

exports.getEdgeByParams = async params => {
  let startNodeInput = params.startNode;
  let stopNodeInput = params.stopNode;
  delete params.startNode;
  delete params.stopNode;

  let query = `MATCH p=(s1:Node)-[e:EDGE]->(s2:Node) `;
  let counter = 0;
  let totalAndConditions = Object.keys(params).length;

  if (startNodeInput) {
    totalAndConditions += Object.keys(startNodeInput).length;
  }
  if (stopNodeInput) {
    totalAndConditions += Object.keys(stopNodeInput).length;
  }

  // add the edgeInfo params
  for (const paramName of Object.keys(params)) {
    query += counter === 0 ? `WHERE ` : ``;

    query += `e.${paramName} = "${params[paramName]}" `;
    counter++;

    query += counter < totalAndConditions ? `AND ` : ``;
  }

  // add the startNode params
  for (const paramName of startNodeInput ? Object.keys(startNodeInput) : []) {
    query += counter === 0 ? `WHERE ` : ``;

    query += `s1.${paramName} = "${startNodeInput[paramName]}" `;
    counter++;

    query += counter < totalAndConditions ? `AND ` : ``;
  }

  // add the stopNode params
  for (const paramName of stopNodeInput ? Object.keys(stopNodeInput) : []) {
    query += counter === 0 ? `WHERE ` : ``;

    query += `s2.${paramName} = "${stopNodeInput[paramName]}" `;
    counter++;

    query += counter < totalAndConditions ? `AND ` : ``;
  }

  query += `RETURN p`;

  let result = await session.run(query);
  return result.records.map(record => result.records[0].toObject().p.segments[0]);
};

exports.removeAllEdges = async () => session.run(`MATCH e=(s1)-[r:EDGE]->(s2) DELETE e`);

exports.setNodeConstraints = async () =>
  session.run('CREATE CONSTRAINT ON (p:Node) ASSERT p.id IS UNIQUE');

exports.insertNode = async node => {
  let result = await session.run(`CREATE (n:Node ${_stringify(node)}) RETURN n`);
  return result.records[0].toObject().n.properties;
};

exports.updateNodeByID = async (nodeID, newNode) => {
  let result = await session.run(
    `MATCH (n:Node) WHERE n.id = "${nodeID}" SET n = ${_stringify(newNode)} RETURN n`,
  );
  if (result.records.length < 1) {
    throw ERROR.NODE_DOESNT_EXIST;
  }
  return result.records[0].toObject().n.properties;
};

exports.deleteNodeByID = async nodeID => {
  let result = await session.run(
    `MATCH (n:Node) WHERE n.id = "${nodeID}" DETACH DELETE (n) RETURN n`,
  );
  if (result.records.length < 1) {
    throw ERROR.NODE_DOESNT_EXIST;
  }
  return result.records[0].toObject().n.properties;
};

exports.insertEdge = async (startNode, endNode, edgeInfo) => {
  const query = `
    MATCH (n1:Node {id: "${startNode.id}"}),(n2:Node {id: "${endNode.id}"})
    CREATE (n1)-[r:EDGE ${_stringify(edgeInfo)}]->(n2)
    RETURN r
  `;
  let result = await session.run(query);
  return result.records[0].toObject().r.properties;
};

exports.deleteEdge = async (startNode, endNode, edgeInfo) => {
  const query = `
    MATCH (n1:Node {id: "${startNode.id}"}),(n2:Node {id: "${endNode.id}"})
    CREATE (n1)-[r:EDGE ${_stringify(edgeInfo)}]->(n2)
    RETURN r
  `;
  let result = await session.run(query);
  return result.records[0].toObject().r.properties;
};
