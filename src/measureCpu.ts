import { DynamicMap } from "@samual/lib/DynamicMap"
import { ticksAlive } from "."

let from: string | undefined
let to: string | undefined
const profiles = new DynamicMap((_: string) => 0)
let cpuUsage = 0

export function prepareMeasureCpu(): void {
	to = undefined
	cpuUsage = 0
}

export function measureCpu(name: string): void {
	from = to
	to = name

	const profileName = from ? `${from} -> ${to}` : `-> ${to}`
	const newCpuUsage = Game.cpu.getUsed()

	profiles.set(profileName, profiles.get(profileName) + (newCpuUsage - cpuUsage))
	cpuUsage = newCpuUsage
}

const numberToCompact = (number: number) => number.toLocaleString(undefined, { notation: `compact` })

export const getProfileString = () => {
	const profilesValues = [ ...profiles ]
	const totalCpu = profilesValues.reduce((total, [ , cpu ]) => total + cpu, 0)

	return `total: ${numberToCompact(totalCpu)} (${numberToCompact(totalCpu / ticksAlive)}/tick)\n${profilesValues
		.map(([ name, cpu ]) => ({ name, cpu, percent: Math.round((cpu / totalCpu * 100)) }))
		.filter(({ percent }) => percent > 0)
		.sort((a, b) => b.cpu - a.cpu)
		.map(({ name, cpu, percent }) => `${name}: ${numberToCompact(cpu)} (${percent}%) ${numberToCompact(cpu / ticksAlive)}/tick`)
		.join(`\n`)
	}`
}

Object.defineProperty(globalThis, `profile`, { get: getProfileString })
