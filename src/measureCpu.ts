import { DynamicMap } from "@samual/lib/DynamicMap"

let from: string | undefined
let to: string | undefined
const profiles = new DynamicMap((_: string) => 0)
let cpuUsage = 0

export function prepareMeasureCpu(): void {
	to = undefined
	cpuUsage = Game.cpu.getUsed()
}

export function measureCpu(name: string): void {
	from = to
	to = name

	const profileName = from ? `${from} -> ${to}` : `-> ${to}`
	const newCpuUsage = Game.cpu.getUsed()

	profiles.set(profileName, profiles.get(profileName) + (newCpuUsage - cpuUsage))
	cpuUsage = newCpuUsage
}

export const getProfileString = () => {
	const profilesValues = [ ...profiles ]
	const totalCpu = profilesValues.reduce((total, [ , cpu ]) => total + cpu, 0)

	return profilesValues
		.map(([ name, cpu ]) => ({ name, cpu, percent: Math.round((cpu / totalCpu * 100)) }))
		.filter(({ percent }) => percent > 0)
		.sort((a, b) => b.cpu - a.cpu)
		.map(({ name, cpu, percent }) => `${name}: ${cpu.toLocaleString(undefined, { notation: "compact" })} (${percent}%)`)
		.join(`\n`)
}

Object.defineProperty(global, `profile`, { get: getProfileString })
