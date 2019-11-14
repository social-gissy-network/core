"use strict";
/**
 * Consider following data element from csv:
 * "tripduration","starttime","stoptime","start station id","start station name","start station latitude","start station longitude","end station id","end station name","end station latitude","end station longitude","bikeid","usertype","birth year","gender"
 371,"2019-01-01 00:09:13.7980","2019-01-01 00:15:25.3360",80,"MIT Stata Center at Vassar St / Main St",42.3621312344991,-71.09115600585936,179,"MIT Vassar St",42.355601213279265,-71.10394477844238,3689,"Subscriber",1987,1
 *
 * One should define following constants before running setup.js, according to specific data (e.g. csv headers)
 **/
var GRAPHQL = require('graphql');
exports.fieldsMapping = {
    startNode: [
        // required:
        { fieldName: 'id', fieldDataName: 'start station id', fieldType: GRAPHQL.GraphQLID },
        { fieldName: 'latitude', fieldDataName: 'start station latitude', fieldType: GRAPHQL.GraphQLString },
        { fieldName: 'longitude', fieldDataName: 'start station longitude', fieldType: GRAPHQL.GraphQLString },
        // optional:
        { fieldName: 'name', fieldDataName: 'start station name', fieldType: GRAPHQL.GraphQLString },
    ],
    endNode: [
        // required:
        { fieldName: 'id', fieldDataName: 'end station id', fieldType: GRAPHQL.GraphQLID },
        { fieldName: 'latitude', fieldDataName: 'end station latitude', fieldType: GRAPHQL.GraphQLString },
        { fieldName: 'longitude', fieldDataName: 'end station longitude', fieldType: GRAPHQL.GraphQLString },
        // optional:
        { fieldName: 'name', fieldDataName: 'end station name', fieldType: GRAPHQL.GraphQLString },
    ],
    // Note: if the edgeInfo don't have an ID, the internal db ID will be used in order supply CRUD functionality by ID
    edgeInfo: [
        // required:
        { fieldName: 'startTime', fieldDataName: 'starttime', fieldType: GRAPHQL.GraphQLString },
        { fieldName: 'stopTime', fieldDataName: 'stoptime', fieldType: GRAPHQL.GraphQLString },
        // optional:
        { fieldName: 'bikeID', fieldDataName: 'bikeid', fieldType: GRAPHQL.GraphQLString },
        { fieldName: 'userType', fieldDataName: 'usertype', fieldType: GRAPHQL.GraphQLString },
        { fieldName: 'birthYear', fieldDataName: 'birth year', fieldType: GRAPHQL.GraphQLString },
        { fieldName: 'gender', fieldDataName: 'gender', fieldType: GRAPHQL.GraphQLString },
    ],
};
//# sourceMappingURL=fieldsMapping.js.map