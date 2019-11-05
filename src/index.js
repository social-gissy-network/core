const ApolloServer = require('apollo-server-express').ApolloServer;
const express = require('express');
const neo4j = require('neo4j-driver').v1;
const dotenv = require('dotenv');

// set environment variables from ../.env
dotenv.config();

const app = express();
const { fieldsMapping } = require('./consts');

let resolvers = {
  Query: {
    async Edge(obj, params, ctx, resolveInfo) {
      let db = ctx.db;
      if (Object.keys(params).length > 0) {
        return await db.getEdgeByParams(params);
      }
      return await db.getAllEdges();
    },
    async Node(obj, params, ctx, resolveInfo) {
      let db = ctx.db;
      if (Object.keys(params).length > 0) {
        return await db.getNodeByParams(params);
      }
      return await db.getAllNodes();
    },
  },
  Mutation: {
    async CreateNode(obj, params, ctx, resolveInfo) {
      let db = ctx.db;
      let result;
      try {
        result = await db.insertNode(params);
      } catch (error) {
        return {
          success: false,
          message: 'failed to create node. ' + error,
        };
      }
      return {
        success: true,
        message: 'node created',
        node: result,
      };
    },
    async UpdateNode(obj, params, ctx, resolveInfo) {
      let db = ctx.db;
      let result;
      try {
        result = await db.updateNodeByID(params.id, params);
      } catch (error) {
        return {
          success: false,
          message: 'failed to update node. ' + error,
        };
      }
      return {
        success: true,
        message: 'node updated',
        node: result,
      };
    },
    async DeleteNode(obj, params, ctx, resolveInfo) {
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

    async CreateEdge(obj, params, ctx, resolveInfo) {
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
    async DeleteEdge(obj, params, ctx, resolveInfo) {
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
};

resolvers.NodeUpdateResponse = {};
resolvers.NodeUpdateResponse = {
  success: (obj, params, ctx, resolveInfo) => obj.success,
  message: (obj, params, ctx, resolveInfo) => obj.message,
  node: (obj, params, ctx, resolveInfo) => (obj.node ? obj.node : null),
};

resolvers.Node = {};
for (const nodeProperty of fieldsMapping.startNode) {
  resolvers.Node[nodeProperty.name] = (obj, params, ctx, resolveInfo) => {
    if (!obj[nodeProperty.name]) {
      return null;
    }
    return obj[nodeProperty.name];
  };
}

resolvers.Edge = {
  startNode(obj, params, ctx, resolveInfo) {
    return obj.start.properties;
  },
  stopNode(obj, params, ctx, resolveInfo) {
    return obj.end.properties;
  },
};
for (const edgeProperty of fieldsMapping.edgeInfo) {
  resolvers.Edge[edgeProperty.name] = (obj, params, ctx, resolveInfo) => {
    return obj.relationship.properties[edgeProperty.name];
  };
}

const typeDefs = require('./graphql-schema').typeDefs;

const db = require('./neo4j.js'); // for the Edge's manual generated Query fields
db.init();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: { db },
  // schema: schema,
  introspection: true,
  playground: true,
});

// Specify port and path for GraphQL endpoint
const port = process.env.GRAPHQL_LISTEN_PORT || 4001;
const path = '/graphql';

/*
 * Optionally, apply Express middleware for authentication, etc
 * This also also allows us to specify a path for the GraphQL endpoint
 */
server.applyMiddleware({ app, path });

app.listen({ port, path }, () => {
  // eslint-disable-next-line
  console.log(`GraphQL server ready at http://localhost:${port}${path}`);
});
