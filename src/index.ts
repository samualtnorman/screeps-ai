import { assert } from "@samual/lib/assert"
import * as v from "valibot"

type MemoryOptions<T extends v.BaseSchema> = { name: string, schema: T }

const makeMemoryOptions = <T extends v.BaseSchema>(options: MemoryOptions<T>) => options

const getMemory = <T extends v.BaseSchema>(options: MemoryOptions<T>) =>
	v.parse(options.schema, Memory[options.name])

const setMemory = <T extends v.BaseSchema>(options: MemoryOptions<T>, value: v.Output<T>) =>
	Memory[options.name] = value

const RoomsMemory = makeMemoryOptions({
	name: `vdi1sf9zaxh3gh60o319sfhe`,
	schema: v.fallback(v.record(
		v.string(),
		v.object({ structures: v.array(v.object({ type: v.string(), x: v.number(), y: v.number() })) })
	), {})
})

console.log(`Started`)

const assertCode = (status: number, statuses: number[], message: string) => assert(statuses.includes(status), `Got: ${status}, ${message}`)
const assertOk = (value: number, message: string) => assert(value == OK, `Got: ${value}, ${message}`)

let ticksAlive = 0

const roomsMemory = getMemory(RoomsMemory)

export const loop = () => {
	ticksAlive++
	console.log(`Tick: ${Game.time} (${ticksAlive})`)

	for (const room of Object.values(Game.rooms)) {
		roomsMemory[room.name] = {
			structures: room.find(FIND_STRUCTURES)
				.map(({ structureType, pos }) => ({ type: structureType, x: pos.x, y: pos.y }))
		}
	}

	setMemory(RoomsMemory, roomsMemory)

	const creeps = Object.values(Game.creeps)

	for (const spawn of Object.values(Game.spawns)) {
		try {
			if (creeps.length < 8) {
				assertCode(
					spawn.spawnCreep([ WORK, CARRY, MOVE ], Math.floor(Math.random() * (2 ** 52)).toString(36)),
					[ OK, ERR_NOT_ENOUGH_ENERGY, ERR_BUSY ],
					HERE
				)
			}

			// for (const site of spawn.room.find(FIND_CONSTRUCTION_SITES)) {
			// 	if (!site.progress)
			// 		assertOk(site.remove(), HERE)
			// }

			// once I implement an OS, I can have a process that does this work once on start up and when new rooms have spawns placed in them
			for (const source of spawn.room.find(FIND_SOURCES)) {
				for (const step of source.pos.findPathTo(spawn, { ignoreCreeps: true, ignoreRoads: true, swampCost: 1, range: 1 })) {
					if (spawn.room.lookAt(step.x, step.y).every(item => item.type != LOOK_CONSTRUCTION_SITES && item.type != LOOK_STRUCTURES))
						assertOk(spawn.room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD), `${HERE} ${step.x} ${step.y}`)
				}

				if (spawn.room.controller) {
					for (const step of source.pos.findPathTo(spawn.room.controller, { ignoreCreeps: true, ignoreRoads: true, swampCost: 1, range: 1 })) {
						if (spawn.room.lookAt(step.x, step.y).every(item => item.type != LOOK_CONSTRUCTION_SITES && item.type != LOOK_STRUCTURES))
							assertOk(spawn.room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD), HERE)
					}
				}
			}
		} catch (error) {
			console.log(`Caught`, (error as any)?.stack)
		}
	}

	for (const creep of creeps) {
		try {
			if (creep.spawning)
				continue

			if (!creep.store.getUsedCapacity()) {
				// storage is empty
				const source = creep.pos.findClosestByPath(FIND_SOURCES, { range: 1 })

				if (source)
					harvest(creep, source)
				else {
					creep.room
				}
			} else if (!creep.store.getFreeCapacity()) {
				// storage is full
				const [ spawn ] = creep.room.find(FIND_MY_SPAWNS)

				if (spawn?.store.getFreeCapacity(RESOURCE_ENERGY))
					transfer(creep, spawn, RESOURCE_ENERGY)
				else {
					const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, { range: 1 })

					if (site)
						build(creep, site)
					else if (creep.room.controller)
						transfer(creep, creep.room.controller, RESOURCE_ENERGY)
				}
			} else {
				const source = creep.pos.findClosestByPath(FIND_SOURCES, { range: 1 })

				if (source) {
					const code = creep.harvest(source)

					if (code != OK) {
						assertCode(code, [ ERR_NOT_IN_RANGE ], HERE)

						const [ spawn ] = creep.room.find(FIND_MY_SPAWNS)

						if (spawn?.store.getFreeCapacity(RESOURCE_ENERGY))
							transfer(creep, spawn, RESOURCE_ENERGY)
						else {
							const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, { range: 1 })

							if (site)
								build(creep, site)
							else if (creep.room.controller)
								transfer(creep, creep.room.controller, RESOURCE_ENERGY)
						}
					}
				} else {
					const [ spawn ] = creep.room.find(FIND_MY_SPAWNS)

					if (spawn?.store.getFreeCapacity(RESOURCE_ENERGY))
						transfer(creep, spawn, RESOURCE_ENERGY)
					else {
						const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, { range: 1 })

						if (site)
							build(creep, site)
						else if (creep.room.controller)
							transfer(creep, creep.room.controller, RESOURCE_ENERGY)
					}
				}
			}
		} catch (error) {
			console.log(`Caught`, (error as any)?.stack)
		}
	}

	if (Game.cpu.bucket == 10000) {
		Game.cpu.generatePixel()
		console.log("generated a pixel")
	}
}

function build(creep: Creep, site: ConstructionSite) {
	const code = creep.build(site)

	if (code != OK) {
		assertCode(code, [ ERR_NOT_IN_RANGE ], HERE)

		if (!creep.fatigue)
			assertOk(creep.moveTo(site, { visualizePathStyle: { stroke: `red` }, range: 1 }), HERE)
	}
}

function transfer(creep: Creep, target: AnyCreep | Structure, resourceType: ResourceConstant, amount?: number) {
	const code = creep.transfer(target, resourceType, amount)

	if (code != OK) {
		assertCode(code, [ ERR_NOT_IN_RANGE ], HERE)

		if (!creep.fatigue)
			assertOk(creep.moveTo(target, { visualizePathStyle: { stroke: `green` }, range: 1 }), HERE)
	}
}

function harvest(creep: Creep, target: Source | Mineral | Deposit) {
	const code = creep.harvest(target)

	if (code != OK) {
		assertCode(code, [ ERR_NOT_IN_RANGE ], HERE)

		if (!creep.fatigue)
			assertOk(creep.moveTo(target, { visualizePathStyle: { stroke: `blue` }, range: 1 }), HERE)
	}
}
