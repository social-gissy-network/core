export {};

import { ApolloServer, ServerRegistration } from 'apollo-server-express';
import express from 'express';
import dotenv from 'dotenv';
import { resolvers } from './graphql-resolvers';
import { DBManager } from './neo4j';
import * as fs from "fs";

// set environment variables from ../.env
dotenv.config();

const app = express();

const compression = require('compression');
app.use(compression({ filter: shouldCompress }));

function shouldCompress (req:any, res:any) {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false
  }

  // fallback to standard filter function
  return compression.filter(req, res)
}

let db = new DBManager();
const typeDefs = fs.readFileSync(__dirname + '/schema.graphql').toString('utf-8');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: { db },
  introspection: true,
  playground: true,
});

// Specify port and path for GraphQL endpoint
const port = process.env.PORT || 4001;
let path = '/';

/*
 * Optionally, apply Express middleware for authentication, etc
 * This also also allows us to specify a path for the GraphQL endpoint
 */

let serverRegistration: ServerRegistration = { app, path };
serverRegistration.onHealthCheck = () => {
  return new Promise((resolve, reject) => {
    // Replace the `true` in this conditional with more specific checks!
    if (true) {
      resolve();
    } else {
      reject();
    }
  });
};

server.applyMiddleware(serverRegistration);

app.listen({ port, path }, () => {
  // eslint-disable-next-line
  console.log(`GraphQL server ready at http://localhost:${port}${path}`);
});
