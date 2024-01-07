import { getProfileString } from "./measureCpu"
import { notify } from "./notify"

export function catchAndReport<T>(callback: () => T): T | undefined {
	try {
		return callback()
	} catch (error) {
		console.log(`Caught`, (error as any)?.stack)
		notify(`Caught ${(error as any)?.stack}\n${getProfileString()}`)
	}
}
