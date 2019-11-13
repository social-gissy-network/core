"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GraphQLType;
(function (GraphQLType) {
    GraphQLType["ID"] = "GraphQLID";
    GraphQLType["String"] = "GraphQLString";
})(GraphQLType = exports.GraphQLType || (exports.GraphQLType = {}));
var FieldMapping = /** @class */ (function () {
    function FieldMapping(fieldName, fieldDataName, fieldType) {
        this.fieldName = fieldName;
        this.fieldDataName = fieldDataName;
        this.fieldType = fieldType;
        var GRAPHQL = require('graphql');
        this.fieldType = GRAPHQL[fieldType];
    }
    return FieldMapping;
}());
exports.FieldMapping = FieldMapping;
var fieldsMapping = {
    startNode: [
        // required:
        new FieldMapping("id", "start station id", GraphQLType.ID),
        new FieldMapping("latitude", "start station latitude", GraphQLType.String),
        new FieldMapping("longitude", "start station longitude", GraphQLType.String),
        // optional:
        new FieldMapping("name", "start station name", GraphQLType.String),
    ],
    endNode: [
        // required:
        new FieldMapping("id", "end station id", GraphQLType.ID),
        new FieldMapping("latitude", "end station latitude", GraphQLType.String),
        new FieldMapping("longitude", "end station longitude", GraphQLType.String),
        // optional:
        new FieldMapping("name", "end station name", GraphQLType.String),
    ],
    edgeInfo: [
        // required:
        new FieldMapping("startTime", "starttime", GraphQLType.String),
        new FieldMapping("stopTime", "stoptime", GraphQLType.String),
        // optional:
        new FieldMapping("bikeID", "bikeid", GraphQLType.String),
        new FieldMapping("userType", "usertype", GraphQLType.String),
        new FieldMapping("birthYear", "birth year", GraphQLType.String),
        new FieldMapping("gender", "gender", GraphQLType.String),
    ],
};
exports.fieldsMapping = fieldsMapping;
var csvFilePath = '../data/201910-bluebikes-tripdata.csv';
exports.csvFilePath = csvFilePath;
//# sourceMappingURL=consts.js.map