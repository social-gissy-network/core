/**
 * Consider following data element from csv:
 * "tripduration","starttime","stoptime","start station id","start station name","start station latitude","start station longitude","end station id","end station name","end station latitude","end station longitude","bikeid","usertype","birth year","gender"
 371,"2019-01-01 00:09:13.7980","2019-01-01 00:15:25.3360",80,"MIT Stata Center at Vassar St / Main St",42.3621312344991,-71.09115600585936,179,"MIT Vassar St",42.355601213279265,-71.10394477844238,3689,"Subscriber",1987,1
 *
 * One should define following constants before running setup.js, according to specific data (e.g. csv headers)
 **/

const GRAPHQL = require('graphql');

exports.fieldsMapping = {
  startNode: [
    // required:
    { name: 'id', dataName: 'start station id', type: GRAPHQL.GraphQLID },
    { name: 'latitude', dataName: 'start station latitude', type: GRAPHQL.GraphQLString },
    { name: 'longitude', dataName: 'start station longitude', type: GRAPHQL.GraphQLString },

    // optional:
    { name: 'name', dataName: 'start station name', type: GRAPHQL.GraphQLString },
  ],

  endNode: [
    // required:
    { name: 'id', dataName: 'end station id', type: GRAPHQL.GraphQLID },
    { name: 'latitude', dataName: 'end station latitude', type: GRAPHQL.GraphQLString },
    { name: 'longitude', dataName: 'end station longitude', type: GRAPHQL.GraphQLString },

    // optional:
    { name: 'name', dataName: 'end station name', type: GRAPHQL.GraphQLString },
  ],

  // Note: if the edgeInfo don't have an ID, the internal db ID will be used in order supply CRUD functionality by ID
  edgeInfo: [
    // required:
    { name: 'startTime', dataName: 'starttime', type: GRAPHQL.GraphQLString },
    { name: 'stopTime', dataName: 'stoptime', type: GRAPHQL.GraphQLString },

    // optional:
    { name: 'bikeID', dataName: 'bikeid', type: GRAPHQL.GraphQLString },
    { name: 'userType', dataName: 'usertype', type: GRAPHQL.GraphQLString },
    { name: 'birthYear', dataName: 'birth year', type: GRAPHQL.GraphQLString },
    { name: 'gender', dataName: 'gender', type: GRAPHQL.GraphQLString },
  ],
};

exports.csvFilePath = 'data/201901-bluebikes-tripdata.csv';
