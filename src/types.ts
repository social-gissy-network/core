export interface Node {
	id: string
	latitude: string
	longitude: string
	name: string
}

export class Edge {
	startNode: Node;
	// stopNode: Node,
	// startTime: string
	// stopTime: string
	// bikeID: string
	// userType: string
	// birthYear: string
	// gender: string


	constructor(object: any) {
		this.startNode = object.startNode;
	}
}