import dotenv from 'dotenv';
import { Driver, Session, Result, StatementResult } from 'neo4j-driver/types/v1';
import { Edge, Node } from './types';
import v1 from 'neo4j-driver';

// set environment variables from ../.env
dotenv.config();

const NEO4J_URL = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'neo4j';

const ERROR = {
  NODE_DOESNT_EXIST: "node doesn't exist",
  NODE_ALREADY_EXIST: 'node already exist',
  GENERAL_ERROR: 'general error',
};

export class DBManager {
  driver: Driver;
  session: Session;

  constructor() {
    this.driver = v1.driver(NEO4J_URL, v1.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

    // Create a session to run Cypher statements in.
    // Note: Always make sure to close sessions when you are done using them!
    this.session = this.driver.session();
  }

  // remove quotes on properties
  private stringify(object: object) {
    return JSON.stringify(object).replace(/"([^(")"]+)":/g, '$1:');
  }

  private firstRecordProperties(result: StatementResult, keyName: string) {
    return result.records[0].get(keyName).properties;
  }

  public close = () => this.driver.close();

  public setConstraints = async () => {
    this.session.run('CREATE CONSTRAINT ON (n:Node) ASSERT n.id IS UNIQUE');
    this.session.run('CREATE CONSTRAINT ON (r:Edge) ASSERT r.id IS UNIQUE');
  };

  // node operations

  public insertNode = async (node: Node) => {
    try {
      let result: StatementResult = await this.session.run(
        `CREATE (n:Node ${this.stringify(node)}) RETURN n`,
      );
      return result.records[0].get('n').properties;
    } catch (error) {
      if (typeof error.message === 'string' && error.message.indexOf('already exists') > -1) {
        throw ERROR.NODE_ALREADY_EXIST;
      }
    }
  };

  public getNodesByParams = async (params: { [paramName: string]: string }) => {
    let query = `MATCH (n:Node) `;
    let counter = 0;

    for (const paramName of params ? Object.keys(params) : []) {
      query += counter === 0 ? `WHERE ` : ``;

      query += `n.${paramName} = "${params[paramName]}" `;
      counter++;

      query += counter < Object.keys(params).length ? `AND ` : ``;
    }
    query += `RETURN n`;

    let result: StatementResult = await this.session.run(query);
    return result.records.map(record => record.get('n').properties);
  };

  public updateNodeByID = async (
    nodeID: string,
    newNodeProperties: { [paramName: string]: { paramValue: string } },
  ) => {
    let oldNodesArray = await this.getNodesByParams({ id: nodeID });
    if (oldNodesArray.length < 1) {
      throw ERROR.NODE_DOESNT_EXIST;
    }

    let newNode = oldNodesArray[0];
    for (const newPropertyKey of Object.keys(newNodeProperties)) {
      newNode[newPropertyKey] = newNodeProperties[newPropertyKey];
    }

    let result = await this.session.run(
      `MATCH (n:Node) WHERE n.id = "${nodeID}" SET n = ${this.stringify(newNode)} RETURN n`,
    );

    return this.firstRecordProperties(result, 'n');
  };

  public deleteNodeByID = async (nodeID: string) => {
    let result = await this.session.run(
      `MATCH (n:Node) WHERE n.id = "${nodeID}" DETACH DELETE (n) RETURN n`,
    );
    if (result.records.length < 1) {
      throw ERROR.NODE_DOESNT_EXIST;
    }

    return this.firstRecordProperties(result, 'n');
  };

  public deleteAllNodes = async () => {
    this.session.run(`MATCH (n:Node) DELETE n`);
  };

  // edge operations

  public insertEdge = async (
    startNode: Node,
    stopNode: Node,
    edgeInfo: { [paramName: string]: string },
  ) => {
    const query = `
    MATCH (n1:Node {id: "${startNode.id}"}),(n2:Node {id: "${stopNode.id}"})
    CREATE (n1)-[r:EDGE ${this.stringify(edgeInfo)}]->(n2)
    RETURN r, id(r) as edgeID
  `;
    let result = await this.session.run(query);
    let object = this.firstRecordProperties(result, 'r');

    // if object's id is null, set id as internal neo4j's id
    if (!object.id) {
      let edgeInternalID = result.records[0]
        .get('edgeID')
        .toNumber()
        .toString();

      let resultWithID = await this.session.run(`
       MATCH (n1)-[r:EDGE]->(n2) where id(r) = ${edgeInternalID}
       SET r.id = toString(id(r))
       RETURN r
      `);
      return this.firstRecordProperties(resultWithID, 'r');
    }

    return object;
  };

  public getEdgesByParams = async (
    startNode: Node,
    stopNode: Node,
    params: { [paramName: string]: string },
  ) => {
    let query = `MATCH p=(s1:Node)-[e:EDGE]->(s2:Node) `;
    let counter = 0;
    let totalAndConditions = params ? Object.keys(params).length : 0;

    if (startNode) {
      totalAndConditions += Object.keys(startNode).length;
    }
    if (stopNode) {
      totalAndConditions += Object.keys(stopNode).length;
    }

    // add the edgeInfo params
    for (const paramName of params ? Object.keys(params) : []) {
      query += counter === 0 ? `WHERE ` : ``;

      query += `e.${paramName} = "${params[paramName]}" `;
      counter++;

      query += counter < totalAndConditions ? `AND ` : ``;
    }

    // add the startNode params
    for (const paramName of startNode ? Object.keys(startNode) : []) {
      query += counter === 0 ? `WHERE ` : ``;

      query += `s1.${paramName} = "${startNode[paramName as keyof Node]}" `;
      counter++;

      query += counter < totalAndConditions ? `AND ` : ``;
    }

    // add the stopNode params
    for (const paramName of stopNode ? Object.keys(stopNode) : []) {
      query += counter === 0 ? `WHERE ` : ``;

      query += `s2.${paramName} = "${stopNode[paramName as keyof Node]}" `;
      counter++;

      query += counter < totalAndConditions ? `AND ` : ``;
    }

    query += `RETURN p, id(e) as edgeID`;

    let result = await this.session.run(query);
    if (result.records.length < 1) {
      return [];
    }

    let results = result.records
      .map(record => record.get('p').segments[0])
      .map(record => {
        if (!record.relationship.properties.id) {
          let identity = record.relationship.identity;
          record.relationship.properties.id = identity.low.toString() + identity.high.toString();
        }
        return {
          startNode: record.start.properties,
          stopNode: record.end.properties,
          edgeInfo: record.relationship.properties,
        };
      });

    return results;
  };

  public updateEdgeByID = async (
    edgeID: string,
    newEdgeProperties: { [paramName: string]: string },
  ) => {
    const query = `
      MATCH MATCH p=()-[r:EDGE]->() WHERE r.id="30001" 
      SET r += ${this.stringify(newEdgeProperties)}
      RETURN r
    `;

    let result = await this.session.run(query);
    return this.firstRecordProperties(result, 'r');
  };

  public deleteAllEdges = async () => {
    return this.session.run(`MATCH e=(s1)-[r:EDGE]->(s2) DELETE e`);
  };

  public deleteEdge = async (edgeID: string) => {
    let result = await this.session.run(`MATCH p=()-[r:EDGE]->() WHERE r.id="${edgeID}" DELETE r`);
    return this.firstRecordProperties(result, 'r');
  };
}
