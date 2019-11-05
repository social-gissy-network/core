const consts = require('./consts.js');

const db = require('./neo4j.js');
db.init();

/**
 * automatically generates GraphQLSchema object from fieldsMapping object
 * @param fieldsMapping
 * @returns {string}: SDL representation of the schema
 */
let createGraphQLSchema = fieldsMapping => {
  const {
    printSchema,
    GraphQLID,
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLSchema,
    GraphQLNonNull,
    GraphQLString,
    GraphQLBoolean,
  } = require('graphql');

  const nodeTypeConfig = {
    name: 'Node',
    fields: {},
  };
  for (const property of fieldsMapping.startNode) {
    nodeTypeConfig.fields[property.name] = { type: property.type };
  }
  const nodeType = new GraphQLObjectType(nodeTypeConfig);

  nodeTypeConfig.name = 'NodeInput';
  const nodeInputType = new GraphQLInputObjectType(nodeTypeConfig);

  const edgeTypeConfig = {
    name: 'Edge',
    fields: {
      startNode: { type: nodeType },
      stopNode: { type: nodeType },
    },
  };
  for (const property of fieldsMapping.edgeInfo) {
    edgeTypeConfig.fields[property.name] = { type: property.type };
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

  const edgeTypeMutationArgs = {
    startNode: { type: nodeInputType },
    stopNode: { type: nodeInputType },
  };
  for (const property of fieldsMapping.edgeInfo) {
    edgeTypeMutationArgs[property.name] = { type: property.type };
  }

  const queryTypeConfig = {
    name: 'Query',
    fields: {
      Node: { type: nodeType, args: nodeTypeConfig.fields },
      Edge: { type: edgeType, args: edgeTypeMutationArgs },
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
      UpdateNode: { type: nodeUpdateResponseType, args: nodeTypeConfig.fields },
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
let storeDataOnDB = async (dataset, fieldsMapping) => {
  const nodes = [];

  for (const dataElement of dataset) {
    // construct nodes
    let startNode = {},
      endNode = {};

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
};

(async () => {
  // 1. create schema dynamically - specific for a given dataset
  let schema = createGraphQLSchema(consts.fieldsMapping);

  // 2. save schema on disk
  const fs = require('fs');
  fs.writeFileSync('schema.graphql', schema);

  // 3. read dataset
  const csv = require('csvtojson');
  const dataset = await csv().fromFile(consts.csvFilePath);

  // 4. clean database: uncomment following lines if you'd like to remove existing data on db
  await db.removeAllEdges();
  await db.removeAllNodes();

  // 5. set constraints
  await db.setNodeConstraints();

  // 6. populate database with data
  await storeDataOnDB(dataset, consts.fieldsMapping);
})()
  .catch(error => {
    console.log(error);
  })
  .then(() => {
    db.close();
  });
