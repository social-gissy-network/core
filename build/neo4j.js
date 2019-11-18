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
            var query, counter, _i, _a, paramName, propertyIdx, _b, _c, property, result;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        query = "MATCH (n:Node) ";
                        counter = 0;
                        for (_i = 0, _a = params ? Object.keys(params) : []; _i < _a.length; _i++) {
                            paramName = _a[_i];
                            query += counter === 0 ? "WHERE " : "";
                            query += "n." + paramName + " = \"" + params[paramName] + "\" ";
                            counter++;
                            query += counter < Object.keys(params).length ? "AND " : "";
                        }
                        query += "RETURN n";
                        propertyIdx = 0;
                        for (_b = 0, _c = Object.keys(sort); _b < _c.length; _b++) {
                            property = _c[_b];
                            if (propertyIdx === 0) {
                                query += " ORDER BY";
                            }
                            query += " n." + property + " " + sort[property];
                            if (propertyIdx < Object.keys(sort).length - 1) {
                                query += ",";
                            }
                            propertyIdx++;
                        }
                        return [4 /*yield*/, this.session.run(query)];
                    case 1:
                        result = _d.sent();
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
        this.getEdgesByParams = function (startNode, stopNode, params) { return __awaiter(_this, void 0, void 0, function () {
            var query, counter, totalAndConditions, _i, _a, paramName, _b, _c, paramName, _d, _e, paramName, result, results;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        query = "MATCH p=(s1:Node)-[e:EDGE]->(s2:Node) ";
                        counter = 0;
                        totalAndConditions = params ? Object.keys(params).length : 0;
                        if (startNode) {
                            totalAndConditions += Object.keys(startNode).length;
                        }
                        if (stopNode) {
                            totalAndConditions += Object.keys(stopNode).length;
                        }
                        // add the edgeInfo params
                        for (_i = 0, _a = params ? Object.keys(params) : []; _i < _a.length; _i++) {
                            paramName = _a[_i];
                            query += counter === 0 ? "WHERE " : "";
                            query += "e." + paramName + " = \"" + params[paramName] + "\" ";
                            counter++;
                            query += counter < totalAndConditions ? "AND " : "";
                        }
                        // add the startNode params
                        for (_b = 0, _c = startNode ? Object.keys(startNode) : []; _b < _c.length; _b++) {
                            paramName = _c[_b];
                            query += counter === 0 ? "WHERE " : "";
                            query += "s1." + paramName + " = \"" + startNode[paramName] + "\" ";
                            counter++;
                            query += counter < totalAndConditions ? "AND " : "";
                        }
                        // add the stopNode params
                        for (_d = 0, _e = stopNode ? Object.keys(stopNode) : []; _d < _e.length; _d++) {
                            paramName = _e[_d];
                            query += counter === 0 ? "WHERE " : "";
                            query += "s2." + paramName + " = \"" + stopNode[paramName] + "\" ";
                            counter++;
                            query += counter < totalAndConditions ? "AND " : "";
                        }
                        query += "RETURN p, id(e) as edgeID";
                        return [4 /*yield*/, this.session.run(query)];
                    case 1:
                        result = _f.sent();
                        if (result.records.length < 1) {
                            return [2 /*return*/, []];
                        }
                        results = result.records
                            .map(function (record) { return record.get('p').segments[0]; })
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
                        return [2 /*return*/, results];
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
    return DBManager;
}());
exports.DBManager = DBManager;
//# sourceMappingURL=neo4j.js.map