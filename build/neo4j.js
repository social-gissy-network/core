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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
var neo4j_driver_1 = __importDefault(require("neo4j-driver"));
// set environment variables from ../.env
dotenv_1.default.config();
var NEO4J_URL = process.env.NEO4J_URI || 'bolt://localhost:7687';
var NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
var NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'neo4j';
var ERROR = {
    NODE_DOESNT_EXIST: "node doesn't exist",
    NODE_ALREADY_EXIST: 'node already exist',
    GENERAL_ERROR: 'general error',
    INVALID_OPERATOR: 'invalid operator',
};
var DBManager = /** @class */ (function () {
    function DBManager() {
        var _this = this;
        this.close = function () { return _this.driver.close(); };
        this.setConstraints = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.session.run('CREATE CONSTRAINT ON (n:Node) ASSERT n.id IS UNIQUE');
                this.session.run('CREATE CONSTRAINT ON (r:Edge) ASSERT r.id IS UNIQUE');
                return [2 /*return*/];
            });
        }); };
        // node operations
        this.insertNode = function (node) { return __awaiter(_this, void 0, void 0, function () {
            var result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.session.run("CREATE (n:Node " + this.stringify(node) + ") RETURN n")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.records[0].get('n').properties];
                    case 2:
                        error_1 = _a.sent();
                        if (typeof error_1.message === 'string' && error_1.message.indexOf('already exists') > -1) {
                            throw ERROR.NODE_ALREADY_EXIST;
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.getNodesByParams = function (params, sort) { return __awaiter(_this, void 0, void 0, function () {
            var query, filteringKeys, sortingKeys, _i, _a, key, result;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "MATCH (n:Node) ";
                        filteringKeys = Object.keys(params).map(function (key) { return _this.mapOperators("n", params, key); });
                        if (filteringKeys.length > 0) {
                            query += "WHERE " + filteringKeys.reverse().join(", ");
                        }
                        query += " RETURN n";
                        sortingKeys = [];
                        for (_i = 0, _a = Object.keys(sort); _i < _a.length; _i++) {
                            key = _a[_i];
                            sortingKeys.push("n." + key + " " + sort[key]);
                        }
                        if (sortingKeys.length > 0) {
                            query += " ORDER BY " + sortingKeys.reverse().join(", ");
                        }
                        return [4 /*yield*/, this.session.run(query)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, result.records.map(function (record) { return record.get('n').properties; })];
                }
            });
        }); };
        this.updateNodeByID = function (nodeID, newNodeProperties) { return __awaiter(_this, void 0, void 0, function () {
            var oldNodesArray, newNode, _i, _a, newPropertyKey, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getNodesByParams({ id: nodeID }, {})];
                    case 1:
                        oldNodesArray = _b.sent();
                        if (oldNodesArray.length < 1) {
                            throw ERROR.NODE_DOESNT_EXIST;
                        }
                        newNode = oldNodesArray[0];
                        for (_i = 0, _a = Object.keys(newNodeProperties); _i < _a.length; _i++) {
                            newPropertyKey = _a[_i];
                            newNode[newPropertyKey] = newNodeProperties[newPropertyKey];
                        }
                        return [4 /*yield*/, this.session.run("MATCH (n:Node) WHERE n.id = \"" + nodeID + "\" SET n = " + this.stringify(newNode) + " RETURN n")];
                    case 2:
                        result = _b.sent();
                        return [2 /*return*/, this.firstRecordProperties(result, 'n')];
                }
            });
        }); };
        this.deleteNodeByID = function (nodeID) { return __awaiter(_this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.session.run("MATCH (n:Node) WHERE n.id = \"" + nodeID + "\" DETACH DELETE (n) RETURN n")];
                    case 1:
                        result = _a.sent();
                        if (result.records.length < 1) {
                            throw ERROR.NODE_DOESNT_EXIST;
                        }
                        return [2 /*return*/, this.firstRecordProperties(result, 'n')];
                }
            });
        }); };
        this.deleteAllNodes = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.session.run("MATCH (n:Node) DELETE n");
                return [2 /*return*/];
            });
        }); };
        // edge operations
        this.insertEdge = function (startNode, stopNode, edgeInfo) { return __awaiter(_this, void 0, void 0, function () {
            var query, result, object, edgeInternalID, resultWithID;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n    MATCH (n1:Node {id: \"" + startNode.id + "\"}),(n2:Node {id: \"" + stopNode.id + "\"})\n    CREATE (n1)-[r:EDGE " + this.stringify(edgeInfo) + "]->(n2)\n    RETURN r, id(r) as edgeID\n  ";
                        return [4 /*yield*/, this.session.run(query)];
                    case 1:
                        result = _a.sent();
                        object = this.firstRecordProperties(result, 'r');
                        if (!!object.id) return [3 /*break*/, 3];
                        edgeInternalID = result.records[0]
                            .get('edgeID')
                            .toNumber()
                            .toString();
                        return [4 /*yield*/, this.session.run("\n       MATCH (n1)-[r:EDGE]->(n2) where id(r) = " + edgeInternalID + "\n       SET r.id = toString(id(r))\n       RETURN r\n      ")];
                    case 2:
                        resultWithID = _a.sent();
                        return [2 /*return*/, this.firstRecordProperties(resultWithID, 'r')];
                    case 3: return [2 /*return*/, object];
                }
            });
        }); };
        this.getEdgesByParams = function (params, sort) { return __awaiter(_this, void 0, void 0, function () {
            var query, filteringKeys, _i, _a, key, _b, _c, subKey, sortingKeys, _d, _e, key, result;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        query = "MATCH p=(s1:Node)-[e:EDGE]->(s2:Node) ";
                        filteringKeys = [];
                        for (_i = 0, _a = Object.keys(params); _i < _a.length; _i++) {
                            key = _a[_i];
                            if (key === "startNode" || key === "stopNode") {
                                for (_b = 0, _c = Object.keys(params[key]); _b < _c.length; _b++) {
                                    subKey = _c[_b];
                                    filteringKeys = filteringKeys.concat(this.mapOperators(key === "startNode" ? "s1" : "s2", params[key], subKey));
                                }
                            }
                            else {
                                filteringKeys = filteringKeys.concat(this.mapOperators("e", params, key));
                            }
                        }
                        if (filteringKeys.length > 0) {
                            query += "WHERE " + filteringKeys.reverse().join(" AND ");
                        }
                        query += "RETURN p, id(e) as edgeID";
                        sortingKeys = [];
                        for (_d = 0, _e = Object.keys(sort); _d < _e.length; _d++) {
                            key = _e[_d];
                            if (key === "startNode") {
                                sortingKeys = sortingKeys.concat(Object.keys(sort.startNode).map(function (key) { return "s1." + key + " " + sort.startNode[key]; }));
                            }
                            else if (key === "stopNode") {
                                sortingKeys = sortingKeys.concat(Object.keys(sort.stopNode).map(function (key) { return "s2." + key + " " + sort.stopNode[key]; }));
                            }
                            else {
                                sortingKeys.push("e." + key + " " + sort[key]);
                            }
                        }
                        if (sortingKeys.length > 0) {
                            query += " ORDER BY " + sortingKeys.reverse().join(", ");
                        }
                        return [4 /*yield*/, this.session.run(query)];
                    case 1:
                        result = _f.sent();
                        if (result.records.length < 1) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, this.convertToNativeEdge(result)];
                    case 2: return [2 /*return*/, _f.sent()];
                }
            });
        }); };
        this.updateEdgeByID = function (edgeID, newEdgeProperties) { return __awaiter(_this, void 0, void 0, function () {
            var query, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      MATCH MATCH p=()-[r:EDGE]->() WHERE r.id=\"30001\" \n      SET r += " + this.stringify(newEdgeProperties) + "\n      RETURN r\n    ";
                        return [4 /*yield*/, this.session.run(query)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, this.firstRecordProperties(result, 'r')];
                }
            });
        }); };
        this.deleteAllEdges = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.session.run("MATCH e=(s1)-[r:EDGE]->(s2) DELETE e")];
            });
        }); };
        this.deleteEdge = function (edgeID) { return __awaiter(_this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.session.run("MATCH p=()-[r:EDGE]->() WHERE r.id=\"" + edgeID + "\" DELETE r")];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, this.firstRecordProperties(result, 'r')];
                }
            });
        }); };
        this.getPathsOfLengthN = function (k, startNodeID, stopNodeID) { return __awaiter(_this, void 0, void 0, function () {
            var query, whereArgs, result, edgeRecords, paths, _i, edgeRecords_1, edgeRecord, path, _a, _b, segments, startNode, stopNode, edgeInfo;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        query = "MATCH p = (s1:Node)-[e:EDGE*" + k + ".." + k + "]->(s2:Node)";
                        whereArgs = [];
                        if (startNodeID) {
                            whereArgs.push("s1.id =\"" + startNodeID + "\"");
                        }
                        if (stopNodeID) {
                            whereArgs.push("s2.id =\"" + stopNodeID + "\"");
                        }
                        if (whereArgs.length > 0) {
                            query += " WHERE " + whereArgs.reverse().join(" AND ");
                        }
                        query += " RETURN p";
                        return [4 /*yield*/, this.session.run(query)];
                    case 1:
                        result = _c.sent();
                        if (result.records.length < 1) {
                            return [2 /*return*/, []];
                        }
                        edgeRecords = result.records;
                        edgeRecords = edgeRecords
                            .map(function (record) { return record.get('p'); });
                        paths = [];
                        for (_i = 0, edgeRecords_1 = edgeRecords; _i < edgeRecords_1.length; _i++) {
                            edgeRecord = edgeRecords_1[_i];
                            path = [];
                            for (_a = 0, _b = edgeRecord.segments; _a < _b.length; _a++) {
                                segments = _b[_a];
                                startNode = segments.start.properties;
                                stopNode = segments.end.properties;
                                edgeInfo = segments.relationship.properties;
                                path.push({ startNode: startNode, stopNode: stopNode, edgeInfo: edgeInfo });
                            }
                            paths.push(path);
                        }
                        return [2 /*return*/, paths];
                }
            });
        }); };
        this.driver = neo4j_driver_1.default.driver(NEO4J_URL, neo4j_driver_1.default.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
        // Create a session to run Cypher statements in.
        // Note: Always make sure to close sessions when you are done using them!
        this.session = this.driver.session();
    }
    // remove quotes on properties
    DBManager.prototype.stringify = function (object) {
        return JSON.stringify(object).replace(/"([^(")"]+)":/g, '$1:');
    };
    DBManager.prototype.firstRecordProperties = function (result, keyName) {
        return result.records[0].get(keyName).properties;
    };
    DBManager.prototype.mapOperators = function (identifier, params, key) {
        var operators = [];
        for (var _i = 0, _a = Object.keys(params[key]); _i < _a.length; _i++) {
            var operatorName = _a[_i];
            var op = void 0;
            switch (operatorName) {
                case "eq":
                    op = "=";
                    break;
                case "contains":
                    op = "CONTAINS";
                    break;
                case "gt":
                    op = ">";
                    break;
                case "gte":
                    op = ">=";
                    break;
                case "lt":
                    op = "<";
                    break;
                case "lte":
                    op = "<=";
                    break;
            }
            operators.push({ op: op, name: operatorName });
        }
        if (operators.length < 1) {
            throw ERROR.INVALID_OPERATOR;
        }
        return operators.map(function (operator) { return identifier + "." + key + " " + operator.op + " \"" + params[key][operator.name] + "\""; });
    };
    ;
    DBManager.prototype.convertToNativeEdge = function (result) {
        var edgeRecords = result.records;
        edgeRecords = edgeRecords
            .map(function (record) { return record.get('p').segments[0]; })
            .filter(function (record) {
            if (record != undefined) {
                return true;
            }
        })
            .map(function (record) {
            if (!record.relationship.properties.id) {
                var identity = record.relationship.identity;
                record.relationship.properties.id = identity.low.toString() + identity.high.toString();
            }
            return {
                startNode: record.start.properties,
                stopNode: record.end.properties,
                edgeInfo: record.relationship.properties,
            };
        });
        return edgeRecords;
    };
    return DBManager;
}());
exports.DBManager = DBManager;
//# sourceMappingURL=neo4j.js.map