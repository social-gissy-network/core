export enum GraphQLType {
  ID = "GraphQLID",
  String = "GraphQLString"
}

export class FieldMapping {
  constructor(
      public fieldName: string,
      public fieldDataName: string,
      public fieldType: GraphQLType
  ) {
    const GRAPHQL = require('graphql');
    this.fieldType = GRAPHQL[fieldType]
  }
}

export interface FieldsMapping {
    startNode: Array<FieldMapping>,
    endNode: Array<FieldMapping>,
    edgeInfo: Array<FieldMapping>
}

let fieldsMapping: FieldsMapping = {
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

let csvFilePath = '../data/201910-bluebikes-tripdata.csv';

export { fieldsMapping, csvFilePath };
