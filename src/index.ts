import { ApolloServer, ServerRegistration } from 'apollo-server-express';
import express from 'express';
import dotenv from 'dotenv';
import { resolvers } from './graphql-resolvers';
import { DBManager } from './neo4j';
import * as fs from "fs";
import * as consts from "./consts"

export {};
dotenv.config();

// hello again
const app = express();

// a middleware to inspect RAM usage - when we'll be running out of RAM - just return 500
// and clean RAM
app.all('/', function (req, res, next) {
  setInterval(() => {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = process.memoryUsage().heapTotal / 1024 / 1024;
    const usedMB = Math.round(used * 100) / 100;
    const totalMB = Math.round(total * 100) / 100;

    if ((totalMB - usedMB) < consts.HEAP_SIZE_LEFT_THRESHOLD(totalMB)) { // todo decide about a threshold
      res.status(500);
      res.json({
        "message": "Failed to fetch. Max heap size exceeded"
      });
    }
  }, consts.CHECK_HEAP_INTERVAL);

  next();
});

const compression = require('compression');
let shouldCompress = (req: any, res: any) => {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false
  }

  // fallback to standard filter function
  return compression.filter(req, res)
};
app.use(compression({filter: shouldCompress}));

let db = new DBManager();
const typeDefs = fs.readFileSync('build/schema.graphql').toString('utf-8');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: {db},
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

let serverRegistration: ServerRegistration = {app, path};
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

app.listen({port, path}, () => {
  // eslint-disable-next-line
  console.log(`started GraphQL server at http://localhost:${port}${path}`);
});
