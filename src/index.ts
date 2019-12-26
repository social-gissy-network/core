import { Worker } from "cluster";
import { ApolloServer, ServerRegistration } from 'apollo-server-express';
import express from 'express';
import dotenv from 'dotenv';
import * as v8 from "v8";
import { resolvers } from './graphql-resolvers';
import { DBManager } from './neo4j';
import * as fs from "fs";
import * as consts from "./consts"
import { HeapInfo } from "v8";
export {};
const cluster = require('cluster');
import { makeExecutableSchema } from 'graphql-tools';
const cors = require('cors');


const log = consts.LOG;

// @ts-ignore
process.on('uncaughtException', (err, origin) => {
  log("error", "uncaughtException", "uncaughtException", {error: err});
});
// @ts-ignore
process.on('unhandledRejection', (reason, promise) => {
  log("error", "unhandledRejection", "unhandledRejection", {reason: reason, promise: promise});
});




// master dispatching workersand respawn in case of worker dies
if (cluster.isMaster) {
  let numCPUs = require('os').cpus().length;
  // for debugging purposes
  if (consts.PROJECT_STAGE === "development") {
    numCPUs = 1;
  }

  log("info", `Master ${process.pid} is running`, "init");

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
    log("info", 'worker ' + oldPID + ' died.', "init");
    log("info", 'worker ' + newPID + ' died.', "init");
  });
}

// Workers can share any TCP connection
// In this case it is an HTTP server
// set environment variables from ../.env
else {
  dotenv.config();

  const app = express();

  // app.use(function (req, res, next) {
  //   log('info', 'express middleware', 'app.use', {
  //       url: req.url, method: req.method
  //   });
  //   next();
  // });

  app.all('/', function (req, res, next) {
    const initialStats: HeapInfo = v8.getHeapStatistics();
    const totalHeapSizeThreshold = initialStats.heap_size_limit * consts.MAX_HEAP_CAPACITY;

    setInterval(async () => {
      let stats = v8.getHeapStatistics();
      if ((stats.total_heap_size) > totalHeapSizeThreshold) {
        if (!res.finished) { // avoid "headers already sent" error
          res.status(500);
          res.json({
            "message": "Failed to fetch. Max heap size exceeded"
          });
        }

        await db.close();
        process.exit();
      }
    }, consts.CHECK_HEAP_INTERVAL);

    if (!res.finished) { // avoid "headers already sent" error
      next();
    }
  });

  const compression = require('compression');


  /**
   * app.use
   */
  app.use(cors());

  app.use(compression({ filter: (req:any, res:any) => {
      // don't compress responses with this request header
      if (req.headers['x-no-compression']) {
        return false;
      }

      if (!consts.USE_GZIP_COMPRESSION) {
        return false;
      }

      // fallback to standard filter function
      return compression.filter(req, res);
    }
  }));


  /**
   * server config
   */

  let db = new DBManager();
  const typeDefs = fs.readFileSync('build/schema.graphql').toString('utf-8');
  const schema = makeExecutableSchema({
    typeDefs
  });

  // return types to client for easy filtering (rather than introspect the graphQL from the client)
  app.get("/types", function(req, res) {
    let typesForClient = {
      Node: {},
      NodeSortParameter: {},
      NodeFilterParameter: {},
      NodeUpdateResponse: {},

      Edge: {},
      EdgeSortParameter: {},
      EdgeFilterParameter: {},
      EdgeUpdateResponse: {},

      SortOrder: {},
      StringOperators: {},

    };

    for (const typeName of Object.keys(typesForClient)) {
      let typeMap = schema.getTypeMap();
      if (!typeMap) {
        res.json({success: false, errorMessage: "can't find schema.typeMap"});
        return;
      }

      let astNode = typeMap[typeName].astNode;
      if (!astNode) {
        res.json({success: false, errorMessage: "can't find schema.typeMap.astNode"});
        return;
      }

      if (typeof astNode.kind !== "string") {
        res.json({success: false, errorMessage: "invalid type of schema.typeMap.astNode.kind"});
        return;
      }

      if (astNode.kind.toLowerCase().indexOf("enum") > -1) {
        // @ts-ignore
        typesForClient[typeName].values = astNode.values.map(valueObj => valueObj.name.value);

      }
      else {
        // @ts-ignore
        let fields = typeMap[typeName].getFields();
        let typeFields = Object.keys(fields).map(key => {
          return {name: key, type: fields[key].type.name}
        });
        // @ts-ignore
        typesForClient[typeName].fields = typeFields
      }

      // @ts-ignore
      typesForClient[typeName].typeName = astNode.kind;
    }

    res.json({success: true, types: typesForClient});
  });

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
    log('info',`Worker ${process.pid} started GraphQL server at http://localhost:${port}${path}`, 'app.listen');
  });
}