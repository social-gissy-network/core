const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const dotenv = require('dotenv');

// set environment variables from ../.env
dotenv.config();

const app = express();

const { typeDefs, resolvers } = require('./graphql.js');

const { db } = require('./neo4j.js'); // for the Edge's manual generated Query fields
db.init();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: { db },
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
