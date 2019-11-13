import * as consts from './consts';
import { DBManager } from './neo4j';
import { Edge, Node } from './types';

let db = new DBManager();

/**
 * automatically generates GraphQLSchema object from fieldsMapping object
 * @param fieldsMapping
 * @returns {string}: SDL representation of the schema
 */
let createGraphQLSchema = (fieldsMapping: consts.FieldsMapping) => {
  const {
    printSchema,
    GraphQLID,
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLSchema,
    GraphQLNonNull,
    GraphQLString,
    GraphQLBoolean,
    GraphQLList,
  } = require('graphql');

  let nodeTypeConfig: any = {
    name: 'Node',
    fields: {},
  };

  for (const property of fieldsMapping.startNode) {
    nodeTypeConfig.fields[property.fieldName] = { type: property.fieldType };
  }
  const nodeType = new GraphQLObjectType(nodeTypeConfig);

  nodeTypeConfig.name = 'NodeInput';
  const nodeInputType = new GraphQLInputObjectType(nodeTypeConfig);

  const edgeTypeConfig: any = {
    name: 'Edge',
    fields: {
      startNode: { type: nodeType },
      stopNode: { type: nodeType },
    },
  };
  for (const property of fieldsMapping.edgeInfo) {
    edgeTypeConfig.fields[property.fieldName] = { type: property.fieldType };
  }

  // if id is not set by the data, we'll use internal db id
  if (!edgeTypeConfig.fields.id) {
    edgeTypeConfig.fields.id = { type: GraphQLID };
  }
  const edgeType = new GraphQLObjectType(edgeTypeConfig);

  const nodeUpdateResponseType = new GraphQLObjectType({
    name: 'NodeUpdateResponse',
    fields: {
      success: { type: GraphQLBoolean },
      message: { type: GraphQLString },
      node: { type: nodeType },
    },
  });

  const edgeUpdateResponseType = new GraphQLObjectType({
    name: 'EdgeUpdateResponse',
    fields: {
      success: { type: GraphQLBoolean },
      message: { type: GraphQLString },
      edge: { type: edgeType },
    },
  });

  const nodeTypeMutationArgs: { [argName: string]: any } = {};
  for (const property of fieldsMapping.startNode) {
    if (property.fieldName === 'id') {
      property.fieldType = new GraphQLNonNull(property.fieldType);
    }
    nodeTypeMutationArgs[property.fieldName] = { type: property.fieldType };
  }

  const edgeTypeMutationArgs: { [argName: string]: any } = {
    startNodeID: { type: new GraphQLNonNull(GraphQLID) },
    stopNodeID: { type: new GraphQLNonNull(GraphQLID) },
  };
  for (const property of fieldsMapping.edgeInfo) {
    edgeTypeMutationArgs[property.fieldName] = { type: property.fieldType };
  }
  // if id is not set by the data, we'll use internal db id
  if (!edgeTypeMutationArgs.id) {
    edgeTypeMutationArgs.id = { type: GraphQLID };
  }

  const edgeTypeQueryArgs: { [argName: string]: any } = {
    startNode: { type: nodeInputType },
    stopNode: { type: nodeInputType },
  };
  for (const property of fieldsMapping.edgeInfo) {
    edgeTypeQueryArgs[property.fieldName] = { type: property.fieldType };
  }

  // if id is not set by the data, we'll use internal db id
  if (!edgeTypeQueryArgs.id) {
    edgeTypeQueryArgs.id = { type: GraphQLID };
  }

  const queryTypeConfig = {
    name: 'Query',
    fields: {
      Node: { type: new GraphQLList(nodeType), args: nodeTypeConfig.fields },
      Edge: { type: new GraphQLList(edgeType), args: edgeTypeQueryArgs },
    },
  };

  const queryType = new GraphQLObjectType(queryTypeConfig);

  const mutationTypeConfig = {
    name: 'Mutation',
    fields: {
      CreateEdge: { type: edgeUpdateResponseType, args: edgeTypeMutationArgs },
      UpdateEdge: { type: edgeUpdateResponseType, args: edgeTypeMutationArgs },
      DeleteEdge: {
        type: edgeUpdateResponseType,
        args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      },
      CreateNode: { type: nodeUpdateResponseType, args: nodeTypeConfig.fields },
      UpdateNode: { type: nodeUpdateResponseType, args: nodeTypeMutationArgs },
      DeleteNode: {
        type: nodeUpdateResponseType,
        args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      },
    },
  };

  const mutationType = new GraphQLObjectType(mutationTypeConfig);

  let schema = new GraphQLSchema({
    query: queryType,
    mutation: mutationType,
  });

  return printSchema(schema);
};

/**
 * saves each data element from dataset in DB - represented as edge connecting two nodes
 * @param dataset
 * @returns {Promise<void>}
 */
let storeDataOnDB = async (dataset: any, fieldsMapping: consts.FieldsMapping) => {
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

  // 0. create types file dynamically - specific for a given dataset
  let typesFile: string = ``;
  typesFile += `export interface Node {\n`;
  for (const property of consts.fieldsMapping.startNode) {
    typesFile += `\t${[property.fieldName]}: string\n`;
  }
  typesFile += `}\n`;

  typesFile += `\n`;

  typesFile += `export interface Edge {\n`;
  typesFile += `\tstartNode: Node,\n`;
  typesFile += `\tstopNode: Node,\n`;
  for (const property of consts.fieldsMapping.edgeInfo) {
    typesFile += `\t${[property.fieldName]}: string\n`;
  }
  typesFile += `}`;

  fs.writeFileSync('types.ts', typesFile);

  // 1. create schema dynamically - specific for a given dataset
  let schema = createGraphQLSchema(consts.fieldsMapping);

  // 2. save schema on disk
  fs.writeFileSync('schema.graphql', schema);

  // 3. read dataset
  const csv = require('csvtojson');
  const dataset = await csv().fromFile(consts.csvFilePath);

  // 4. clean database: uncomment following lines if you'd like to remove existing data on db
  await db.deleteAllEdges();
  await db.deleteAllNodes();

  // 5. set constraints
  await db.setConstraints();

  // 6. populate database with data
  await storeDataOnDB(dataset, consts.fieldsMapping);
})()
  .catch(error => {
    console.log(error);
  })
  .then(() => {
    db.close();
  });
