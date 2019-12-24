import dotenv from 'dotenv';
import {Driver, Session, Result, StatementResult, PathSegment} from 'neo4j-driver/types/v1';
import { Edge, Node } from './types';
import v1 from 'neo4j-driver';
import assert from 'assert'
import * as consts from './consts';

// set environment variables from ../.env
dotenv.config();

const NEO4J_URL = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'neo4j';

const ERROR = {
  NODE_DOESNT_EXIST: "node doesn't exist",
  NODE_ALREADY_EXIST: 'node already exist',
  GENERAL_ERROR: 'general error',
  INVALID_OPERATOR: 'invalid operator',
};

export class DBManager {
  driver: Driver;
  session: Session;

  constructor() {
    if (consts.PROJECT_STAGE === "production") {
      this.driver = v1.driver(NEO4J_URL, v1.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    }
    else {
      this.driver = v1.driver(NEO4J_URL, v1.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    }

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

  private mapOperators(identifier: string, params: any, key:string) {
    let operators = [];
    for (const operatorName of Object.keys(params[key])) {
      let op;
      switch (operatorName) {
        case "eq":        op = "="; break;
        case "contains":  op = "CONTAINS"; break;
        case "gt":        op = ">"; break;
        case "gte":       op = ">="; break;
        case "lt":        op = "<"; break;
        case "lte":       op = "<="; break;
      }
      operators.push({op: op, name: operatorName});
    }

    if (operators.length < 1) {
      throw ERROR.INVALID_OPERATOR;
    }


    return operators.map(operator => `${identifier}.${key} ${operator.op} "${params[key][operator.name]}"`);

  };

  private convertToNativeEdge(result: { [paramName: string]: any }) {
    let edgeRecords : Array<any> = result.records;
    edgeRecords = edgeRecords
        .map(record => record.get('p').segments[0])
        .filter(record => {
          if (record != undefined) {
            return true
          }
        })
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

    return edgeRecords;
  }

  private queryNodes(filter?: object, sort?: { [paramName: string]: string }, limit?: number,
                     options?: {newNode?: object, updateNode?: object, deleteNode?: boolean}) {
    // CREATE
    if (options && options.newNode) {
      return `CREATE (n:Node ${this.stringify(options.newNode)}) RETURN n`;
    }

    //MATCH
    let query = `MATCH (n:Node) `;

    //WHERE
    if(filter) {
      let filteringKeys = Object.keys(filter).map(key => this.mapOperators("n", filter, key));
      if (filteringKeys.length > 0) {
        query += `WHERE ${filteringKeys.reverse().join(", ")} `;
      }
    }

    //SET
    if(options && options.updateNode) {
      query += `SET n += ${this.stringify(options.updateNode)} `
    }
    //DELETE
    else if(options && options.deleteNode) {
      query += `DETACH DELETE (n) `
    }

    //RETURN
    query += `RETURN properties(n) as n `;

    // ORDER BY
    if (sort) {
      let sortingKeys: string[] = [];
      for (const key of Object.keys(sort)) {
        sortingKeys.push(`n.${key} ${sort[key]}`)
      }
      if (sortingKeys.length > 0) {
        query += `ORDER BY ${sortingKeys.reverse().join(", ")} `;
      }
    }

    //LIMIT
    if (limit) {
      query += `LIMIT ${limit} `;
    }

    return query;
  }

  public close = () => this.driver.close();

  public setConstraints = async () => {
    this.session.run('CREATE CONSTRAINT ON (n:Node) ASSERT n.id IS UNIQUE');
    this.session.run('CREATE CONSTRAINT ON (r:EDGE) ASSERT r.id IS UNIQUE');
  };

  // node operations

  public insertNode = async (node: Node) => {
    try {
      let query = this.queryNodes(undefined, undefined, undefined, {newNode: node});
      let result: StatementResult = await this.session.run(query);
      assert(Array.isArray(result.records) && result.records.length === 1);

      return result.records.map(record => record.get('n'))[0];
    } catch (error) {
      if (typeof error.message === 'string' && error.message.indexOf('already exists') > -1) {
        throw ERROR.NODE_ALREADY_EXIST;
      }
    }
  };

  public getNodesByParams = async (filter: { [paramName: string]: any }, sort: { [paramName: string]: string }, limit?: number) => {
    let query = this.queryNodes(filter, sort, limit);
    let result: StatementResult = await this.session.run(query);
    assert(Array.isArray(result.records));

    return result.records.map(record => record.get('n'));
  };

  public getNodeByID = async (id: string) => {
    let query = this.queryNodes({ 'id': { 'eq': id, } });
    let result: StatementResult = await this.session.run(query);
    assert(Array.isArray(result.records) && result.records.length <= 1);

    if (result.records.length !== 1) {
      throw ERROR.NODE_DOESNT_EXIST;
    }
    return result.records.map(record => record.get('n'))[0];
  };

  public updateNodeByID = async (id: string, newNodeProperties: { [paramName: string]: { paramValue: string } }) => {
    let query = this.queryNodes({ 'id': { 'eq': id, } }, undefined, undefined, {updateNode: newNodeProperties});
    let result = await this.session.run(query);
    assert(Array.isArray(result.records) && result.records.length <= 1);

    if (result.records.length !== 1) {
      throw ERROR.NODE_DOESNT_EXIST;
    }
    return result.records.map(record => record.get('n'))[0];
  };

  public deleteNodeByID = async (id: string) => {
    let query = this.queryNodes({ 'id': { 'eq': id, } }, undefined, undefined, {deleteNode: true});
    let result = await this.session.run(query);
    assert(Array.isArray(result.records) && result.records.length <= 1);

    if (result.records.length < 1) {
      throw ERROR.NODE_DOESNT_EXIST;
    }

    return result.records.map(record => record.get('n'))[0];
  };

  public deleteAllNodes = async () => {
    let query = this.queryNodes(undefined, undefined, undefined, {deleteNode: true});
    await this.session.run(query);
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

  public getEdgesByParams = async ( params: { [paramName: string]: any }, sort: { [paramName: string]: any }, limit: number) => {
    let query = `MATCH p=(s1:Node)-[e:EDGE]->(s2:Node) `;

    let filteringKeys: string[] = [];
    for (const key of Object.keys(params)) {
      if (key === "startNode" || key === "stopNode") {
        for (const subKey of Object.keys(params[key])) {
          filteringKeys = filteringKeys.concat(this.mapOperators(key === "startNode" ? "s1" : "s2", params[key], subKey));
        }
      }
      else {
        filteringKeys = filteringKeys.concat(this.mapOperators("e", params, key));
      }
    }

    if (filteringKeys.length > 0) {
      query += `WHERE ` + filteringKeys.reverse().join(" AND ");
    }

    query += `RETURN p, id(e) as edgeID`;

    let sortingKeys: string[] = [];

    for (const key of Object.keys(sort)) {
      if (key === "startNode") {
        sortingKeys = sortingKeys.concat(Object.keys(sort.startNode).map(key => `s1.${key} ${sort.startNode[key]}`));
      }
      else if (key === "stopNode") {
        sortingKeys = sortingKeys.concat(Object.keys(sort.stopNode).map(key => `s2.${key} ${sort.stopNode[key]}`));
      }
      else {
        sortingKeys.push(`e.${key} ${sort[key]}`)
      }
    }
    if (sortingKeys.length > 0) {
      query += ` ORDER BY ` + sortingKeys.reverse().join(", ");
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    let result = await this.session.run(query);
    if (result.records.length < 1) {
      return [];
    }

    return await this.convertToNativeEdge(result);
  };

  public getEdgeByID = async (id: string) => {
    let query = `MATCH p=(s1:Node)-[e:EDGE]->(s2:Node) WHERE e.id = "${id}" RETURN p`;
    let result: StatementResult = await this.session.run(query);
    let record = result.records.map(record => record.get('p'))[0];

    let startNode = record.start.properties;
    let stopNode = record.end.properties;
    let edgeInfo = record.segments[0].relationship.properties;

    return {startNode: startNode, stopNode: stopNode, edgeInfo: edgeInfo};
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

  // paths operations

  // public getPathsOfLengthN = async (k: bigint, startNodeID: string, stopNodeID: string, limit: number) => {
  //   console.log(`getPathsOfLengthN handled by worker.pid = ${process.pid}`);
  //   let query = `MATCH p = (s1:Node)-[e:EDGE*${k}..${k}]->(s2:Node)`;
  //
  //   let whereArgs = [];
  //   if (startNodeID) {
  //     whereArgs.push(`s1.id ="${startNodeID}"`);
  //   }
  //   if (stopNodeID) {
  //     whereArgs.push(`s2.id ="${stopNodeID}"`);
  //   }
  //   if (whereArgs.length > 0) {
  //     query += ` WHERE ` + whereArgs.reverse().join(" AND ");
  //   }
  //
  //   query += ` RETURN extract(e in relationships(p) | properties(e)) as e,properties(s1) as s1,properties(s2) as s2`;
  //   if (limit) {
  //     query += " LIMIT " + limit;
  //   }
  //
  //   let result = await this.session.run(query);
  //
  //   if (result.records.length < 1) {
  //     return [];
  //   }
  //
  //   let paths = [];
  //
  //   for (const record of result.records) {
  //     // edges in a specific path
  //     let edges = record.get("e");
  //
  //     let path = [];
  //     for (const edge of edges) {
  //       path.push({startNode: record.get("s1"), stopNode: record.get("s2"), edgeInfo: edge});
  //     }
  //
  //     paths.push(path);
  //   }
  //
  //   return paths;
  // };

  public getPaths = async (startNodeIDs: string[], stopNodeIDs: string[], length: number, limit: number) => {
    console.log(`getPaths handled by worker.pid = ${process.pid}`);

    let pathsLength = length ? `${length}..${length}` : ``;

    let query = `MATCH p = (s1:Node)-[e:EDGE*${pathsLength}]->(s2:Node)`;

    let whereArgsStartQuery = "";
    let whereArgsStopQuery = "";

    if (startNodeIDs) {
      whereArgsStartQuery = startNodeIDs.map(id => `s1.id ="${id}"`).reverse().join(" OR ");

    }
    if (stopNodeIDs) {
      whereArgsStopQuery = stopNodeIDs.map(id => `s2.id ="${id}"`).reverse().join(" OR ");
    }

    if (whereArgsStartQuery.length > 0 && whereArgsStopQuery.length > 0) {
      query += ` WHERE (${whereArgsStartQuery}) AND (${whereArgsStopQuery})`;
    }
    else if(whereArgsStopQuery.length > 0) {
      query += ` WHERE ${whereArgsStopQuery}`
    }
    else if(whereArgsStartQuery.length > 0) {
      query += ` WHERE ${whereArgsStopQuery}`
    }
    else {
      // do nothing
    }

    query += ` RETURN extract(r in relationships(p) | properties(startNode(r))) as startNodes, extract(r in relationships(p) | properties(endNode(r))) as stopNodes, extract(e in relationships(p) | properties(e)) as e,properties(s1) as s1,properties(s2) as s2`;
    if (limit) {
      query += " LIMIT " + limit;
    }

    let result = await this.session.run(query);

    if (result.records.length < 1) {
      return [];
    }

    let paths = [];

    for (const record of result.records) {
      // edges in a specific path
      let edges = record.get("e");
      let startNodes = record.get("startNodes");
      let stopNodes = record.get("stopNodes");

      let path = [];
      for (let i = 0; i < edges.length; i++) {
        let edge = edges[i];
        path.push({startNode: startNodes[i], stopNode: stopNodes[i], edgeInfo: edge});
      }

      paths.push(path);
    }

    return paths;
  };
}
