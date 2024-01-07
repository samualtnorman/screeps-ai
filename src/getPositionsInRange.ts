export function* getPositionsInRange(roomPosition: RoomPosition, range: number) {
	const maxX = Math.min(roomPosition.x + range, 49)
	const maxY = Math.min(roomPosition.y + range, 49)

	for (let x = Math.max(roomPosition.x - range, 0); x <= maxX; x++) {
		for (let y = Math.max(roomPosition.y - range, 0); y <= maxY; y++)
			yield new RoomPosition(x, y, roomPosition.roomName)
	}
}
