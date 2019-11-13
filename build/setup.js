"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var consts = __importStar(require("./consts"));
var neo4j_1 = require("./neo4j");
var db = new neo4j_1.DBManager();
/**
 * automatically generates GraphQLSchema object from fieldsMapping object
 * @param fieldsMapping
 * @returns {string}: SDL representation of the schema
 */
var createGraphQLSchema = function (fieldsMapping) {
    var _a = require('graphql'), printSchema = _a.printSchema, GraphQLID = _a.GraphQLID, GraphQLObjectType = _a.GraphQLObjectType, GraphQLInputObjectType = _a.GraphQLInputObjectType, GraphQLSchema = _a.GraphQLSchema, GraphQLNonNull = _a.GraphQLNonNull, GraphQLString = _a.GraphQLString, GraphQLBoolean = _a.GraphQLBoolean, GraphQLList = _a.GraphQLList;
    var nodeTypeConfig = {
        name: 'Node',
        fields: {},
    };
    for (var _i = 0, _b = fieldsMapping.startNode; _i < _b.length; _i++) {
        var property = _b[_i];
        nodeTypeConfig.fields[property.fieldName] = { type: property.fieldType };
    }
    var nodeType = new GraphQLObjectType(nodeTypeConfig);
    nodeTypeConfig.name = 'NodeInput';
    var nodeInputType = new GraphQLInputObjectType(nodeTypeConfig);
    var edgeTypeConfig = {
        name: 'Edge',
        fields: {
            startNode: { type: nodeType },
            stopNode: { type: nodeType },
        },
    };
    for (var _c = 0, _d = fieldsMapping.edgeInfo; _c < _d.length; _c++) {
        var property = _d[_c];
        edgeTypeConfig.fields[property.fieldName] = { type: property.fieldType };
    }
    // if id is not set by the data, we'll use internal db id
    if (!edgeTypeConfig.fields.id) {
        edgeTypeConfig.fields.id = { type: GraphQLID };
    }
    var edgeType = new GraphQLObjectType(edgeTypeConfig);
    var nodeUpdateResponseType = new GraphQLObjectType({
        name: 'NodeUpdateResponse',
        fields: {
            success: { type: GraphQLBoolean },
            message: { type: GraphQLString },
            node: { type: nodeType },
        },
    });
    var edgeUpdateResponseType = new GraphQLObjectType({
        name: 'EdgeUpdateResponse',
        fields: {
            success: { type: GraphQLBoolean },
            message: { type: GraphQLString },
            edge: { type: edgeType },
        },
    });
    var nodeTypeMutationArgs = {};
    for (var _e = 0, _f = fieldsMapping.startNode; _e < _f.length; _e++) {
        var property = _f[_e];
        if (property.fieldName === 'id') {
            property.fieldType = new GraphQLNonNull(property.fieldType);
        }
        nodeTypeMutationArgs[property.fieldName] = { type: property.fieldType };
    }
    var edgeTypeMutationArgs = {
        startNodeID: { type: new GraphQLNonNull(GraphQLID) },
        stopNodeID: { type: new GraphQLNonNull(GraphQLID) },
    };
    for (var _g = 0, _h = fieldsMapping.edgeInfo; _g < _h.length; _g++) {
        var property = _h[_g];
        edgeTypeMutationArgs[property.fieldName] = { type: property.fieldType };
    }
    // if id is not set by the data, we'll use internal db id
    if (!edgeTypeMutationArgs.id) {
        edgeTypeMutationArgs.id = { type: GraphQLID };
    }
    var edgeTypeQueryArgs = {
        startNode: { type: nodeInputType },
        stopNode: { type: nodeInputType },
    };
    for (var _j = 0, _k = fieldsMapping.edgeInfo; _j < _k.length; _j++) {
        var property = _k[_j];
        edgeTypeQueryArgs[property.fieldName] = { type: property.fieldType };
    }
    // if id is not set by the data, we'll use internal db id
    if (!edgeTypeQueryArgs.id) {
        edgeTypeQueryArgs.id = { type: GraphQLID };
    }
    var queryTypeConfig = {
        name: 'Query',
        fields: {
            Node: { type: new GraphQLList(nodeType), args: nodeTypeConfig.fields },
            Edge: { type: new GraphQLList(edgeType), args: edgeTypeQueryArgs },
        },
    };
    var queryType = new GraphQLObjectType(queryTypeConfig);
    var mutationTypeConfig = {
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
    var mutationType = new GraphQLObjectType(mutationTypeConfig);
    var schema = new GraphQLSchema({
        query: queryType,
        mutation: mutationType,
    });
    return printSchema(schema);
};
/**
 * saves each data element from dataset in DB - represented as edge connecting two nodes
 * @param dataset
 * @returns {Promise<void>}
 */
var storeDataOnDB = function (dataset, fieldsMapping) { return __awaiter(void 0, void 0, void 0, function () {
    var nodes, counter, _loop_1, _i, dataset_1, dataElement;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                nodes = [];
                counter = 0;
                setInterval(function () {
                    var percentage = (counter / dataset.length) * 100;
                    var percentageStr = percentage.toString().split(".")[0] + "." + percentage.toString().split(".")[1].substring(0, 3);
                    console.log("storeDataOnDB progress: " + counter + "/" + dataset.length + "; percentage: " + percentageStr + "%");
                }, 10000);
                _loop_1 = function (dataElement) {
                    var startNode, endNode, _i, _a, property, _b, _c, property, edgeInfo, _d, _e, property;
                    return __generator(this, function (_f) {
                        switch (_f.label) {
                            case 0:
                                startNode = {};
                                endNode = {};
                                for (_i = 0, _a = fieldsMapping.startNode; _i < _a.length; _i++) {
                                    property = _a[_i];
                                    startNode[property.fieldName] = dataElement[property.fieldDataName];
                                }
                                for (_b = 0, _c = fieldsMapping.endNode; _b < _c.length; _b++) {
                                    property = _c[_b];
                                    endNode[property.fieldName] = dataElement[property.fieldDataName];
                                }
                                if (!!nodes.find(function (node) { return node.id === startNode.id; })) return [3 /*break*/, 2];
                                return [4 /*yield*/, db.insertNode(startNode)];
                            case 1:
                                _f.sent();
                                nodes.push(startNode);
                                _f.label = 2;
                            case 2:
                                if (!!nodes.find(function (node) { return node.id === endNode.id; })) return [3 /*break*/, 4];
                                return [4 /*yield*/, db.insertNode(endNode)];
                            case 3:
                                _f.sent();
                                nodes.push(endNode);
                                _f.label = 4;
                            case 4:
                                edgeInfo = {};
                                for (_d = 0, _e = fieldsMapping.edgeInfo; _d < _e.length; _d++) {
                                    property = _e[_d];
                                    edgeInfo[property.fieldName] = dataElement[property.fieldDataName];
                                }
                                return [4 /*yield*/, db.insertEdge(startNode, endNode, edgeInfo)];
                            case 5:
                                _f.sent();
                                counter++;
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, dataset_1 = dataset;
                _a.label = 1;
            case 1:
                if (!(_i < dataset_1.length)) return [3 /*break*/, 4];
                dataElement = dataset_1[_i];
                return [5 /*yield**/, _loop_1(dataElement)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); };
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var fs, typesFile, _i, _a, property, _b, _c, property, schema, csv, dataset;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                fs = require('fs');
                typesFile = "";
                typesFile += "export interface Node {\n";
                for (_i = 0, _a = consts.fieldsMapping.startNode; _i < _a.length; _i++) {
                    property = _a[_i];
                    typesFile += "\t" + [property.fieldName] + ": string\n";
                }
                typesFile += "}\n";
                typesFile += "\n";
                typesFile += "export interface Edge {\n";
                typesFile += "\tstartNode: Node,\n";
                typesFile += "\tstopNode: Node,\n";
                for (_b = 0, _c = consts.fieldsMapping.edgeInfo; _b < _c.length; _b++) {
                    property = _c[_b];
                    typesFile += "\t" + [property.fieldName] + ": string\n";
                }
                typesFile += "}";
                fs.writeFileSync('types.ts', typesFile);
                schema = createGraphQLSchema(consts.fieldsMapping);
                // 2. save schema on disk
                fs.writeFileSync('schema.graphql', schema);
                csv = require('csvtojson');
                return [4 /*yield*/, csv().fromFile(consts.csvFilePath)];
            case 1:
                dataset = _d.sent();
                // 4. clean database: uncomment following lines if you'd like to remove existing data on db
                return [4 /*yield*/, db.deleteAllEdges()];
            case 2:
                // 4. clean database: uncomment following lines if you'd like to remove existing data on db
                _d.sent();
                return [4 /*yield*/, db.deleteAllNodes()];
            case 3:
                _d.sent();
                // 5. set constraints
                return [4 /*yield*/, db.setConstraints()];
            case 4:
                // 5. set constraints
                _d.sent();
                // 6. populate database with data
                return [4 /*yield*/, storeDataOnDB(dataset, consts.fieldsMapping)];
            case 5:
                // 6. populate database with data
                _d.sent();
                return [2 /*return*/];
        }
    });
}); })()
    .catch(function (error) {
    console.log(error);
})
    .then(function () {
    db.close();
});
//# sourceMappingURL=setup.js.map