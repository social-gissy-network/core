"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var apollo_server_express_1 = require("apollo-server-express");
var express_1 = __importDefault(require("express"));
var dotenv_1 = __importDefault(require("dotenv"));
var graphql_resolvers_1 = require("./graphql-resolvers");
var neo4j_1 = require("./neo4j");
var fs = __importStar(require("fs"));
// set environment variables from ../.env
dotenv_1.default.config();
var app = express_1.default();
var db = new neo4j_1.DBManager();
var typeDefs = fs.readFileSync(__dirname + '/schema.graphql').toString('utf-8');
var server = new apollo_server_express_1.ApolloServer({
    typeDefs: typeDefs,
    resolvers: graphql_resolvers_1.resolvers,
    context: { db: db },
    introspection: true,
    playground: true,
});
// Specify port and path for GraphQL endpoint
var port = process.env.GRAPHQL_LISTEN_PORT || 4001;
var path = '/graphql';
/*
 * Optionally, apply Express middleware for authentication, etc
 * This also also allows us to specify a path for the GraphQL endpoint
 */
server.applyMiddleware({ app: app, path: path });
app.listen({ port: port, path: path }, function () {
    // eslint-disable-next-line
    console.log("GraphQL server ready at http://localhost:" + port + path);
});
//# sourceMappingURL=index.js.map