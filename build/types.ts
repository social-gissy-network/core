export interface Node {
	id: string
	latitude: string
	longitude: string
	name: string
}

export interface Edge {
	startNode: Node,
	stopNode: Node,
	startTime: string
	stopTime: string
	bikeID: string
	userType: string
	birthYear: string
	gender: string
}