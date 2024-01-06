import { DynamicMap } from "@samual/lib/DynamicMap"

let from: string
let to: string
const profiles = new DynamicMap((_: string) => 0)
let cpuUsage = 0

export function prepareMeasureCpu(): void {
	to = "start"
	cpuUsage = Game.cpu.getUsed()
}

export function measureCpu(name: string): void {
	from = to
	to = name

	const profileName = `${from} -> ${to}`
	const newCpuUsage = Game.cpu.getUsed()

	profiles.set(profileName, profiles.get(profileName) + (newCpuUsage - cpuUsage))
	cpuUsage = newCpuUsage
}

Object.defineProperty(global, `profile`, {
	get() {
		return [ ...profiles ].sort(([ , a ], [ , b ]) => b - a).map(([ name, cpu ]) => `${name}: ${cpu}`).join(`\n`)
	}
})
