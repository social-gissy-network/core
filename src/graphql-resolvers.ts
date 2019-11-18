import { IResolverObject, IResolvers } from 'graphql-tools';
const { fieldsMapping } = require('./fieldsMapping');

let nodeResolverObject: IResolverObject = {};
for (const nodeProperty of fieldsMapping.startNode) {
  nodeResolverObject[nodeProperty.fieldName] = (obj, params, ctx, resolveInfo) => {
    let propertyValue = obj[nodeProperty.fieldName];
    if (!propertyValue) {
      return null;
    }
    return propertyValue;
  };
}

let edgeResolverObject: IResolverObject = {};
edgeResolverObject.startNode = (obj, params, ctx, resolveInfo) => obj.startNode;
edgeResolverObject.stopNode = (obj, params, ctx, resolveInfo) => obj.stopNode;
for (const edgeProperty of fieldsMapping.edgeInfo) {
  edgeResolverObject[edgeProperty.fieldName] = (obj, params, ctx, resolveInfo) => {
    let propertyValue = obj.edgeInfo[edgeProperty.fieldName];
    if (!propertyValue) {
      return null;
    }
    return propertyValue;
  };
}
// if id is not set by the data, we'll use internal db id
if (!edgeResolverObject.id) {
  edgeResolverObject.id = (obj, params, ctx, resolveInfo) => obj.edgeInfo.id;
}

let queryResolverObject: IResolverObject = {};
queryResolverObject.Edge = async (obj, params, ctx, resolveInfo) => {
  let startNode: Node = params.startNode;
  let stopNode: Node = params.stopNode;
  delete params.startNode;
  delete params.stopNode;

  return await ctx.db.getEdgesByParams(startNode, stopNode, params);
};

queryResolverObject.Edges = async (obj, params, ctx, resolveInfo) => {
  if (!params.sort) {
    params.sort = {};
  }
  if (!params.filter) {
    params.filter = {};
  }

  return await ctx.db.getEdgesByParams(params.filter, params.sort);
};


queryResolverObject.Node = async (obj, params, ctx, resolveInfo) => await ctx.db.getNodesByParams(params, {});
queryResolverObject.Nodes = async (obj, params, ctx, resolveInfo) => {
  if (!params.sort) {
    params.sort = {};
  }
  if (!params.filter) {
    params.filter = {};
  }

  return await ctx.db.getNodesByParams(params.filter, params.sort)
};

let mutationResolverObject: IResolverObject = {};
mutationResolverObject.CreateNode = async (obj, params, ctx, resolveInfo) => {
  let db = ctx.db;
  let result;
  try {
    result = await db.insertNode(params);
  } catch (error) {
    return {
      success: false,
      message: 'failed to create node: ' + error,
    };
  }
  return {
    success: true,
    message: 'node created',
    node: result,
  };
};
mutationResolverObject.UpdateNode = async (obj, params, ctx, resolveInfo) => {
  let db = ctx.db;
  let result;
  try {
    result = await db.updateNodeByID(params.id, params);
  } catch (error) {
    return {
      success: false,
      message: 'failed to update node: ' + error,
    };
  }
  return {
    success: true,
    message: 'node updated',
    node: result,
  };
};
mutationResolverObject.DeleteNode = async (obj, params, ctx, resolveInfo) => {
  let db = ctx.db;
  let result;
  try {
    result = await db.deleteNodeByID(params.id);
  } catch (error) {
    return {
      success: false,
      message: 'failed to delete node. ' + error,
    };
  }
  return {
    success: true,
    message: 'node deleted',
    node: result,
  };
};
mutationResolverObject.CreateEdge = async (obj, params, ctx, resolveInfo) => {
  let db = ctx.db;

  // params.startNode.id, params.stopNode.id should be defined here
  // todo validate

  let startNode = (await db.getNodesByParams({ id: params.startNodeID }))[0];
  let stopNode = (await db.getNodesByParams({ id: params.stopNodeID }))[0];

  delete params.startNodeID;
  delete params.stopNodeID;

  // everything else is edgeInfo
  let edgeInfo = params;

  let result = {
    startNode: startNode,
    edgeInfo: await db.insertEdge(startNode, stopNode, edgeInfo), // todo try catch
    stopNode: stopNode,
  };

  return {
    success: true,
    message: 'edge created',
    edge: result,
  };
};
mutationResolverObject.UpdateEdge = async (obj, params, ctx, resolveInfo) => {
  let db = ctx.db;

  let startNode: Node = params.startNode;
  let stopNode: Node = params.stopNode;
  delete params.startNode;
  delete params.stopNode;

  let oldEdges = await db.getEdgesByParams(startNode, stopNode, params);

  let results = [];

  delete params.startNode;
  delete params.stopNode;

  // everything else is edgeInfo
  let newEdgeInfo = params;

  for (const oldEdge of oldEdges) {
    let newEdge = oldEdge;
    for (const edgeInfoPropertyKey of Object.keys(newEdgeInfo)) {
      newEdge.edgeInfo[edgeInfoPropertyKey] = newEdgeInfo[edgeInfoPropertyKey];
    }

    results.push(newEdge);
  }

  return {
    success: true,
    message: 'edge(s) updated',
    edges: results,
  };
};
mutationResolverObject.DeleteEdge = async (obj, params, ctx, resolveInfo) => {// todo
  let db = ctx.db;
  let startNode = params.startNode;
  let stopNode = params.stopNode;
  delete params.startNode;
  delete params.stopNode;

  // everything else is edgeInfo
  let edgeInfo = params;

  let result = {
    start: {
      properties: await db.insertNode(startNode),
    },
    end: {
      properties: await db.insertNode(stopNode),
    },
    relationship: {
      properties: await db.insertEdge(startNode, stopNode, edgeInfo),
    },
  };

  return result;
};

let nodeUpdateResponseResolverObject: IResolverObject = {};
nodeUpdateResponseResolverObject.success = (obj, params, ctx, resolveInfo) => obj.success;
nodeUpdateResponseResolverObject.message = (obj, params, ctx, resolveInfo) => obj.message;
nodeUpdateResponseResolverObject.node = (obj, params, ctx, resolveInfo) => (obj.node ? obj.node : null);

let edgeUpdateResponseResolverObject: IResolverObject = {};
edgeUpdateResponseResolverObject.success = (obj, params, ctx, resolveInfo) => obj.success;
edgeUpdateResponseResolverObject.message = (obj, params, ctx, resolveInfo) => obj.message;
edgeUpdateResponseResolverObject.edge = (obj, params, ctx, resolveInfo) => (obj.edge ? obj.edge : null);


let resolvers: IResolvers = {
  Query: queryResolverObject,
  Mutation: mutationResolverObject,
  Node: nodeResolverObject,
  Edge: edgeResolverObject,
  NodeUpdateResponse: nodeUpdateResponseResolverObject,
  EdgeUpdateResponse: edgeUpdateResponseResolverObject,
  // allNodes: allNodesResolverObject,
};

export { resolvers };
