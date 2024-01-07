import { assert } from "@samual/lib/assert"

const Returns: Record<number, string> = {
	0: "ok",
	"-1": "not owner",
	"-2": "no path",
	"-3": "name exists",
	"-4": "busy",
	"-5": "not found",
	"-6": "not enough",
	"-7": "invalid target",
	"-8": "full",
	"-9": "not in range",
	"-10": "invalid args",
	"-11": "tired",
	"-12": "no bodypart",
	"-14": "RCL not enough",
	"-15": "GCL not enough",
}

export const assertCode = (code: number, statuses: number[], message: string) =>
	assert(statuses.includes(code), `Got: ${code} ${Returns[code]}, ${message}`)

export const assertOk = (code: number, message: string) =>
	assert(code == OK, `Got: ${code} ${Returns[code]}, ${message}`)
