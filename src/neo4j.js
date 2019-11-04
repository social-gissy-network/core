const neo4j = require('neo4j-driver').v1;

let driver;
let session;

// remove quotes on properties
function _stringify(object) {
  return JSON.stringify(object).replace(/"([^(")"]+)":/g, '$1:');
}

exports.init = () => {
  // Create a driver instance, for the user neo4j with password neo4j.
  // It should be enough to have a single driver per database per application.
  driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'neo4j'),
  );

  // Create a session to run Cypher statements in.
  // Note: Always make sure to close sessions when you are done using them!
  session = driver.session();
};

exports.close = () => driver.close();

exports.removeAllNodes = async () => session.run(`MATCH (n:Node) DELETE n`);

exports.getAllEdges = async () => session.run(`MATCH p=(p1:Node)-[e:EDGE]->(p2:Node) RETURN p`);

exports.removeAllEdges = async () => session.run(`MATCH e=(s1)-[r:EDGE]->(s2) DELETE e`);

exports.setNodeConstraints = async () => session.run('CREATE CONSTRAINT ON (p:Node) ASSERT p.id IS UNIQUE');

exports.insertNode = async (node) => {
  return session.run(`CREATE (n:Node ${_stringify(node)}) RETURN n`)
};

exports.insertEdge = async (startNode, endNode, edgeInfo) => {
  // MATCH (n {name: "Alice"})-->(m)
  const query = `
    MATCH (n1:Node {id: "${startNode.id}"}),(n2:Node {id: "${endNode.id}"})
    CREATE (n1)-[r:EDGE ${_stringify(edgeInfo)}]->(n2)
    RETURN r
  `;
  return session.run(query);
};