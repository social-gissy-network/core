// automatically generates GraphQLSchema object from fieldsMapping object and write it as '../build/schema.graphql'

const fs = require('fs');

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
  GraphQLEnumType
} = require('graphql');

const { fieldsMapping } = require('./fieldsMapping');

const nodeTypeConfig = {
  name: 'Node',
  fields: {},
};
for (const property of fieldsMapping.startNode) {
  nodeTypeConfig.fields[property.fieldName] = { type: property.fieldType };
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

const nodeTypeMutationArgs = {};
for (const property of fieldsMapping.startNode) {
  if (property.fieldName === 'id') {
    property.fieldType = new GraphQLNonNull(property.fieldType);
  }
  nodeTypeMutationArgs[property.fieldName] = { type: property.fieldType };
}

const edgeTypeMutationArgs = {
  startNode: { type: nodeInputType },
  stopNode: { type: nodeInputType },
};
for (const property of fieldsMapping.edgeInfo) {
  edgeTypeMutationArgs[property.fieldName] = { type: property.fieldType };
}

const sortOrderType = new GraphQLEnumType({
  name: 'SortOrder',
  values: {ASC: {value: "ASC"}, DESC: {value: "DESC"}},
});


let nodeSortParameterConfig = {
  name: 'NodeSortParameter',
  fields: {},
};
for (const property of fieldsMapping.startNode) {
  nodeSortParameterConfig.fields[property.fieldName] = { type: sortOrderType };
}
const nodeSortParameter = new GraphQLInputObjectType(nodeSortParameterConfig);


let edgeSortParameterConfig = {
  name: 'EdgeSortParameter',
  fields: {
    startNode: { type: nodeSortParameter },
    stopNode: { type: nodeSortParameter },
  },
};
for (const property of fieldsMapping.edgeInfo) {
  edgeSortParameterConfig.fields[property.fieldName] = { type: sortOrderType };
}
const edgeSortParameter = new GraphQLInputObjectType(edgeSortParameterConfig);

const queryTypeConfig = {
  name: 'Query',
  fields: {
    Node: { type: new GraphQLList(nodeType), args: nodeTypeConfig.fields },
    Edge: { type: new GraphQLList(edgeType), args: edgeTypeMutationArgs },

    Nodes: { type: new GraphQLList(nodeType), args: { sort: { type: nodeSortParameter }} },
    Edges: { type: new GraphQLList(edgeType), args: { sort: { type: edgeSortParameter }} },

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

console.log("create schema");

if (!fs.existsSync("../build/")){
  fs.mkdirSync("../build/");
}
fs.writeFileSync('../build/schema.graphql', printSchema(schema));
