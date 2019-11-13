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
Object.defineProperty(exports, "__esModule", { value: true });
var consts_1 = require("./consts");
var nodeResolverObject = {};
var _loop_1 = function (nodeProperty) {
    nodeResolverObject[nodeProperty.fieldName] = function (obj, params, ctx, resolveInfo) {
        var propertyValue = obj[nodeProperty.fieldName];
        if (!propertyValue) {
            return null;
        }
        return propertyValue;
    };
};
for (var _i = 0, _a = consts_1.fieldsMapping.startNode; _i < _a.length; _i++) {
    var nodeProperty = _a[_i];
    _loop_1(nodeProperty);
}
var edgeResolverObject = {};
edgeResolverObject.startNode = function (obj, params, ctx, resolveInfo) { return obj.startNode; };
edgeResolverObject.stopNode = function (obj, params, ctx, resolveInfo) { return obj.stopNode; };
var _loop_2 = function (edgeProperty) {
    edgeResolverObject[edgeProperty.fieldName] = function (obj, params, ctx, resolveInfo) {
        var propertyValue = obj.edgeInfo[edgeProperty.fieldName];
        if (!propertyValue) {
            return null;
        }
        return propertyValue;
    };
};
for (var _b = 0, _c = consts_1.fieldsMapping.edgeInfo; _b < _c.length; _b++) {
    var edgeProperty = _c[_b];
    _loop_2(edgeProperty);
}
// if id is not set by the data, we'll use internal db id
if (!edgeResolverObject.id) {
    edgeResolverObject.id = function (obj, params, ctx, resolveInfo) { return obj.edgeInfo.id; };
}
var queryResolverObject = {};
queryResolverObject.Edge = function (obj, params, ctx, resolveInfo) { return __awaiter(void 0, void 0, void 0, function () {
    var startNode, stopNode;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                startNode = params.startNode;
                stopNode = params.stopNode;
                delete params.startNode;
                delete params.stopNode;
                return [4 /*yield*/, ctx.db.getEdgesByParams(startNode, stopNode, params)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
queryResolverObject.Node = function (obj, params, ctx, resolveInfo) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, ctx.db.getNodesByParams(params)];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); };
var mutationResolverObject = {};
mutationResolverObject.CreateNode = function (obj, params, ctx, resolveInfo) { return __awaiter(void 0, void 0, void 0, function () {
    var db, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                db = ctx.db;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, db.insertNode(params)];
            case 2:
                result = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                return [2 /*return*/, {
                        success: false,
                        message: 'failed to create node: ' + error_1,
                    }];
            case 4: return [2 /*return*/, {
                    success: true,
                    message: 'node created',
                    node: result,
                }];
        }
    });
}); };
mutationResolverObject.UpdateNode = function (obj, params, ctx, resolveInfo) { return __awaiter(void 0, void 0, void 0, function () {
    var db, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                db = ctx.db;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, db.updateNodeByID(params.id, params)];
            case 2:
                result = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                return [2 /*return*/, {
                        success: false,
                        message: 'failed to update node: ' + error_2,
                    }];
            case 4: return [2 /*return*/, {
                    success: true,
                    message: 'node updated',
                    node: result,
                }];
        }
    });
}); };
mutationResolverObject.DeleteNode = function (obj, params, ctx, resolveInfo) { return __awaiter(void 0, void 0, void 0, function () {
    var db, result, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                db = ctx.db;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, db.deleteNodeByID(params.id)];
            case 2:
                result = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                return [2 /*return*/, {
                        success: false,
                        message: 'failed to delete node. ' + error_3,
                    }];
            case 4: return [2 /*return*/, {
                    success: true,
                    message: 'node deleted',
                    node: result,
                }];
        }
    });
}); };
mutationResolverObject.CreateEdge = function (obj, params, ctx, resolveInfo) { return __awaiter(void 0, void 0, void 0, function () {
    var db, startNode, stopNode, edgeInfo, result, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                db = ctx.db;
                return [4 /*yield*/, db.getNodesByParams({ id: params.startNodeID })];
            case 1:
                startNode = (_b.sent())[0];
                return [4 /*yield*/, db.getNodesByParams({ id: params.stopNodeID })];
            case 2:
                stopNode = (_b.sent())[0];
                delete params.startNodeID;
                delete params.stopNodeID;
                edgeInfo = params;
                _a = {
                    startNode: startNode
                };
                return [4 /*yield*/, db.insertEdge(startNode, stopNode, edgeInfo)];
            case 3:
                result = (_a.edgeInfo = _b.sent(),
                    _a.stopNode = stopNode,
                    _a);
                return [2 /*return*/, {
                        success: true,
                        message: 'edge created',
                        edge: result,
                    }];
        }
    });
}); };
mutationResolverObject.UpdateEdge = function (obj, params, ctx, resolveInfo) { return __awaiter(void 0, void 0, void 0, function () {
    var db, startNode, stopNode, oldEdges, results, newEdgeInfo, _i, oldEdges_1, oldEdge, newEdge, _a, _b, edgeInfoPropertyKey;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                db = ctx.db;
                startNode = params.startNode;
                stopNode = params.stopNode;
                delete params.startNode;
                delete params.stopNode;
                return [4 /*yield*/, db.getEdgesByParams(startNode, stopNode, params)];
            case 1:
                oldEdges = _c.sent();
                results = [];
                delete params.startNode;
                delete params.stopNode;
                newEdgeInfo = params;
                for (_i = 0, oldEdges_1 = oldEdges; _i < oldEdges_1.length; _i++) {
                    oldEdge = oldEdges_1[_i];
                    newEdge = oldEdge;
                    for (_a = 0, _b = Object.keys(newEdgeInfo); _a < _b.length; _a++) {
                        edgeInfoPropertyKey = _b[_a];
                        newEdge.edgeInfo[edgeInfoPropertyKey] = newEdgeInfo[edgeInfoPropertyKey];
                    }
                    results.push(newEdge);
                }
                return [2 /*return*/, {
                        success: true,
                        message: 'edge(s) updated',
                        edges: results,
                    }];
        }
    });
}); };
mutationResolverObject.DeleteEdge = function (obj, params, ctx, resolveInfo) { return __awaiter(void 0, void 0, void 0, function () {
    var db, startNode, stopNode, edgeInfo, result, _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                db = ctx.db;
                startNode = params.startNode;
                stopNode = params.stopNode;
                delete params.startNode;
                delete params.stopNode;
                edgeInfo = params;
                _a = {};
                _b = {};
                return [4 /*yield*/, db.insertNode(startNode)];
            case 1:
                _a.start = (_b.properties = _e.sent(),
                    _b);
                _c = {};
                return [4 /*yield*/, db.insertNode(stopNode)];
            case 2:
                _a.end = (_c.properties = _e.sent(),
                    _c);
                _d = {};
                return [4 /*yield*/, db.insertEdge(startNode, stopNode, edgeInfo)];
            case 3:
                result = (_a.relationship = (_d.properties = _e.sent(),
                    _d),
                    _a);
                return [2 /*return*/, result];
        }
    });
}); };
var nodeUpdateResponseResolverObject = {};
nodeUpdateResponseResolverObject.success = function (obj, params, ctx, resolveInfo) { return obj.success; };
nodeUpdateResponseResolverObject.message = function (obj, params, ctx, resolveInfo) { return obj.message; };
nodeUpdateResponseResolverObject.node = function (obj, params, ctx, resolveInfo) { return (obj.node ? obj.node : null); };
var edgeUpdateResponseResolverObject = {};
edgeUpdateResponseResolverObject.success = function (obj, params, ctx, resolveInfo) { return obj.success; };
edgeUpdateResponseResolverObject.message = function (obj, params, ctx, resolveInfo) { return obj.message; };
edgeUpdateResponseResolverObject.edge = function (obj, params, ctx, resolveInfo) { return (obj.edge ? obj.edge : null); };
var resolvers = {
    Query: queryResolverObject,
    Mutation: mutationResolverObject,
    Node: nodeResolverObject,
    Edge: edgeResolverObject,
    NodeUpdateResponse: nodeUpdateResponseResolverObject,
    EdgeUpdateResponse: edgeUpdateResponseResolverObject,
};
exports.resolvers = resolvers;
//# sourceMappingURL=graphql-resolvers.js.map