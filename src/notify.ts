// TODO queue notifications when reached limit of 20 in current tick
// TODO split by line when feasable

export function notify(message: string) {
	while (message.length) {
		Game.notify(message.slice(0, 500))
		message = message.slice(500)
	}
}
