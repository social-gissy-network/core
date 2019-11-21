import { Worker } from "cluster";
import { ApolloServer, ServerRegistration } from 'apollo-server-express';
import express from 'express';
import dotenv from 'dotenv';
import { resolvers } from './graphql-resolvers';
import { DBManager } from './neo4j';
import * as fs from "fs";
import * as consts from "./consts"

export {};

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (deadWorker: Worker, code: number, signal: string) => {
    // Restart the worker
    let worker = cluster.fork();

    // Note the process IDs
    let newPID = worker.process.pid;
    let oldPID = deadWorker.process.pid;

    // Log the event
    console.log('worker '+oldPID+' died.');
    console.log('worker '+newPID+' born.');
  });
}
else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  // set environment variables from ../.env
  dotenv.config();

  const app = express();

  app.all('/', function (req, res, next) {
    setInterval(() => {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      const usedMB = Math.round(used * 100) / 100;

      if (usedMB > consts.MAX_HEAP_SIZE) {
        res.status(401);
        res.json({
          "message": "Failed to fetch. Max heap size exceeded"
        });

        process.exit();
      }
    }, consts.CHECK_HEAP_INTERVAL);

    next();
  });

  const compression = require('compression');
  let shouldCompress = (req:any, res:any) => {
    if (req.headers['x-no-compression']) {
      // don't compress responses with this request header
      return false
    }

    // fallback to standard filter function
    return compression.filter(req, res)
  };
  app.use(compression({ filter: shouldCompress }));

  let db = new DBManager();
  const typeDefs = fs.readFileSync('build/schema.graphql').toString('utf-8');

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
    console.log(`Worker ${process.pid} started GraphQL server at http://localhost:${port}${path}`);
  });
}