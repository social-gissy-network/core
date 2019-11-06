const fs = require('fs');
const path = require('path');
const { fieldsMapping } = require('./consts.js');

let resolvers = {
  Query: {
    Edge: async (obj, params, ctx, resolveInfo) => await ctx.db.getEdgesByParams(params),
    Node: async (obj, params, ctx, resolveInfo) => await ctx.db.getNodesByParams(params),
  },

  Mutation: {
    CreateNode: async (obj, params, ctx, resolveInfo) => {
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
    },
    UpdateNode: async (obj, params, ctx, resolveInfo) => {
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
    },
    DeleteNode: async (obj, params, ctx, resolveInfo) => {
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
    },

    CreateEdge: async (obj, params, ctx, resolveInfo) => {
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
    },

    UpdateEdge: async (obj, params, ctx, resolveInfo) => {
      let db = ctx.db;

      let oldEdges = await db.getEdgesByParams(params);

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
    },

    // todo
    DeleteEdge: async (obj, params, ctx, resolveInfo) => {
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
    },
  },

  NodeUpdateResponse: {
    success: (obj, params, ctx, resolveInfo) => obj.success,
    message: (obj, params, ctx, resolveInfo) => obj.message,
    node: (obj, params, ctx, resolveInfo) => (obj.node ? obj.node : null),
  },

  EdgeUpdateResponse: {
    success: (obj, params, ctx, resolveInfo) => obj.success,
    message: (obj, params, ctx, resolveInfo) => obj.message,
    edge: (obj, params, ctx, resolveInfo) => (obj.edge ? obj.edge : null),
  },

  Node: {}, // fields resolvers - dynamic binding by fieldsMapping

  Edge: {
    startNode: (obj, params, ctx, resolveInfo) => obj.startNode,
    stopNode: (obj, params, ctx, resolveInfo) => obj.stopNode,
    // more fields resolvers - dynamic binding by fieldsMapping
  },
};

for (const nodeProperty of fieldsMapping.startNode) {
  resolvers.Node[nodeProperty.name] = (obj, params, ctx, resolveInfo) => {
    let propertyValue = obj[nodeProperty.name];
    if (!propertyValue) {
      return null;
    }
    return propertyValue;
  };
}

for (const edgeProperty of fieldsMapping.edgeInfo) {
  resolvers.Edge[edgeProperty.name] = (obj, params, ctx, resolveInfo) => {
    let propertyValue = obj.edgeInfo[edgeProperty.name];
    if (!propertyValue) {
      return null;
    }
    return propertyValue;
  };
}

// if id is not set by the data, we'll use internal db id
if (!resolvers.Edge.id) {
  resolvers.Edge.id = (obj, params, ctx, resolveInfo) => obj.edgeInfo.id;
}

exports.resolvers = resolvers;
exports.typeDefs = fs
  .readFileSync(process.env.GRAPHQL_SCHEMA || path.join(__dirname, 'schema.graphql'))
  .toString('utf-8');
