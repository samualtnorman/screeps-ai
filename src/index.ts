import { assert } from "@samual/lib/assert"
import "@total-typescript/ts-reset"
import { moveTo, preTick, reconcileTraffic } from "screeps-cartographer"
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
		v.object({ sources: v.array(v.object({ x: v.number(), y: v.number() })) })
	), {})
})

console.log(`Started`)

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

const assertCode = (code: number, statuses: number[], message: string) =>
	assert(statuses.includes(code), `Got: ${code} ${Returns[code]}, ${message}`)

const assertOk = (code: number, message: string) => assert(code == OK, `Got: ${code} ${Returns[code]}, ${message}`)

const countConstructionSites = () => Object.keys(Game.constructionSites).length

let ticksAlive = 0

const roomsMemory = getMemory(RoomsMemory)

export const loop = () => {
	ticksAlive++
	console.log(`Tick: ${Game.time} (${ticksAlive})`)
	preTick()

	for (const name in Memory.creeps) {
		if (!(name in Game.creeps))
			delete Memory.creeps[name]
	}

	if (!countConstructionSites()) {
		for (const spawn of Object.values(Game.spawns)) {
			catchAndReport(() => {
				for (const site of spawn.room.find(FIND_CONSTRUCTION_SITES)) {
					if (!site.progress)
						assertOk(site.remove(), HERE)
				}

				const upLeft = spawn.room.getPositionAt(spawn.pos.x - 1, spawn.pos.y - 1)
				const up = spawn.room.getPositionAt(spawn.pos.x, spawn.pos.y - 1)
				const upRight = spawn.room.getPositionAt(spawn.pos.x + 1, spawn.pos.y - 1)
				const left = spawn.room.getPositionAt(spawn.pos.x - 1, spawn.pos.y)
				const right = spawn.room.getPositionAt(spawn.pos.x + 1, spawn.pos.y)
				const downLeft = spawn.room.getPositionAt(spawn.pos.x - 1, spawn.pos.y + 1)
				const down = spawn.room.getPositionAt(spawn.pos.x, spawn.pos.y + 1)
				const downRight = spawn.room.getPositionAt(spawn.pos.x + 1, spawn.pos.y + 1)

				for (const position of [ upLeft, up, upRight, left, right, downLeft, down, downRight ]) {
					if (position && position.look()
						.every(item => item.type != LOOK_CONSTRUCTION_SITES && item.type != LOOK_STRUCTURES)
					) {
						assertOk(spawn.room.createConstructionSite(position, STRUCTURE_ROAD), HERE)

						return
					}
				}

				// TODO detect new spawn creations and run the following for those
				for (const source of spawn.room.find(FIND_SOURCES)) {
					for (const step of
						source.pos.findPathTo(spawn, { ignoreCreeps: true, ignoreRoads: true, swampCost: 1, range: 1 })
					) {
						if (spawn.room.lookAt(step.x, step.y)
							.every(item => item.type != LOOK_CONSTRUCTION_SITES && item.type != LOOK_STRUCTURES)
						) {
							assertOk(
								spawn.room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD), `${HERE} ${step.x} ${step.y}`
							)

							return
						}
					}

					if (spawn.room.controller) {
						for (const step of source.pos.findPathTo(
							spawn.room.controller,
							{ ignoreCreeps: true, ignoreRoads: true, swampCost: 1, range: 1 }
						)) {
							if (spawn.room.lookAt(step.x, step.y)
								.every(item => item.type != LOOK_CONSTRUCTION_SITES && item.type != LOOK_STRUCTURES)
							) {
								assertOk(spawn.room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD), HERE)

								return
							}
						}
					}
				}

				for (const exit of Object.keys(Game.map.describeExits(spawn.room.name))) {
					const position = spawn.pos.findClosestByPath(Number(exit) as 1 | 3 | 5 | 7)

					if (position && !position.lookFor(LOOK_STRUCTURES).length) {
						for (const step of spawn.pos.findPathTo(position, { ignoreCreeps: true, ignoreRoads: true, swampCost: 1, range: 1 })) {
							if (spawn.room.lookAt(step.x, step.y)
								.every(item => item.type != LOOK_CONSTRUCTION_SITES && item.type != LOOK_STRUCTURES)
							) {
								assertOk(spawn.room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD), HERE)

								return
							}
						}
					}
				}
			})
		}
	}

	for (const room of Object.values(Game.rooms))
		roomsMemory[room.name] = { sources: room.find(FIND_SOURCES).map(({ pos }) => ({ x: pos.x, y: pos.y })) }

	setMemory(RoomsMemory, roomsMemory)

	const creeps = Object.values(Game.creeps)

	measureCpu(HERE, () => {
		for (const spawn of Object.values(Game.spawns)) {
			catchAndReport(() => {
				if (creeps.length < 12) {
					assertCode(
						spawn.spawnCreep([ WORK, CARRY, MOVE ], Math.floor(Math.random() * (2 ** 52)).toString(36)),
						[ OK, ERR_NOT_ENOUGH_ENERGY, ERR_BUSY ],
						HERE
					)
				}

				// if (spawn.room.controller) {
				// 	const steps = spawn.pos.findPathTo(
				// 		spawn.room.controller,
				// 		{ ignoreCreeps: true, ignoreRoads: true, swampCost: 1, range: 1 }
				// 	)

				// 	for (const step of spawn.pos.findPathTo(
				// 		spawn.room.controller,
				// 		{
				// 			ignoreCreeps: true,
				// 			ignoreRoads: true,
				// 			swampCost: 1,
				// 			range: 1,
				// 			costCallback: (room, cost) => {
				// 				if (room == spawn.room.name) {
				// 					for (const step of steps)
				// 						cost.set(step.x, step.y, 255)
				// 				}
				// 			}
				// 		}
				// 	)) {
				// 		if (spawn.room.lookAt(step.x, step.y)
				// 			.every(item => item.type != LOOK_CONSTRUCTION_SITES && item.type != LOOK_STRUCTURES)
				// 		)
				// 			spawn.room.visual.circle(step.x, step.y)
				// 			// assertOk(spawn.room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD), HERE)
				// 	}
				// }
			})
		}
	})

	measureCpu(HERE, () => {
		for (const creep of creeps) {
			catchAndReport(() => {
				if (creep.spawning)
					return

				if (!creep.store.getUsedCapacity()) {
					// storage is empty
					// harvest from an available source in the current room
					// otherwise move towards a source in another room
					// otherwise explore adjacent rooms
					const source = creep.pos.findClosestByPath(FIND_SOURCES, { range: 1 })

					if (source)
						harvest(creep, source)
					else if (!creep.fatigue) {
						const sources = Object.entries(roomsMemory)
							.filter(([ room ]) => room != creep.room.name)
							.map(([ room, { sources } ]) => sources.map(({ x, y }) => new RoomPosition(x, y, room)))
							.flat()

						const code = sources.length ? moveTo(creep, sources, { visualizePathStyle: { stroke: `#f99e2d` } }) : undefined

						if (code != OK) {
							if (code != undefined)
								assertCode(code, [ ERR_NO_PATH ], HERE)

							// for (const [ exit, room ] of Object.entries(Game.map.describeExits(creep.room.name))) {
							// 	if (!(room in roomsMemory)) {
							// 		const position = creep.pos.findClosestByPath(Number(exit) as 1 | 3 | 5 | 7)

							// 		if (position && !position.lookFor(LOOK_STRUCTURES).length) {
							// 			assertOk(creep.moveTo(
							// 				position,
							// 				{ visualizePathStyle: { stroke: `yellow` } }
							// 			), HERE)
							// 			break
							// 		}
							// 	}
							// }
						}
					}
				} else if (!creep.store.getFreeCapacity()) {
					// storage is full
					// transfer to/build target in current room
					// otherwise move towards target in another room
					const target = creep.pos.findClosestByPath([
						...creep.room.find(FIND_CONSTRUCTION_SITES),
						...creep.room.find(FIND_MY_SPAWNS)
							.filter(({ store }) => store.getFreeCapacity(RESOURCE_ENERGY)),
						...creep.room.controller?.my ? [ creep.room.controller ] : []
					], { range: 1 })

					if (target) {
						if (target instanceof ConstructionSite)
							build(creep, target)
						else
							transfer(creep, target, RESOURCE_ENERGY)
					} else if (!creep.fatigue) {
						const spawns = Object.values(Game.spawns)

						assertOk(moveTo(
							creep,
							[
								...Object.values(Game.constructionSites),
								...spawns.filter(spawn => spawn.store.getFreeCapacity(RESOURCE_ENERGY)),
								...spawns.map(spawn => spawn.room.controller).filter(Boolean)
							].filter(({ room }) => room && room.name != creep.room.name).map(({ pos }) => pos),
							{ visualizePathStyle: { stroke: `purple` } }
						), HERE)
					}
				} else {
					const target = creep.pos.findClosestByPath([
						...creep.room.find(FIND_SOURCES),
						...creep.room.find(FIND_CONSTRUCTION_SITES),
						...creep.room.find(FIND_MY_SPAWNS)
							.filter(({ store }) => store.getFreeCapacity(RESOURCE_ENERGY)),
						...creep.room.controller?.my ? [ creep.room.controller ] : []
					], { range: 1 })

					if (target) {
						const code = target instanceof ConstructionSite
							? creep.build(target)
							: (target instanceof Source
								? creep.harvest(target)
								: creep.transfer(target, RESOURCE_ENERGY)
							)

						if (code != OK) {
							assertCode(code, [ ERR_NOT_IN_RANGE ], HERE)
							assertOk(moveTo(creep, target, { visualizePathStyle: { stroke: `#eab2e0` } }), HERE)
						}
					} else if (!creep.fatigue) {
						const spawns = Object.values(Game.spawns)

						assertOk(
							moveTo(
								creep,
								[
									...Object.values(Game.constructionSites),
									...spawns.filter(spawn => spawn.store.getFreeCapacity(RESOURCE_ENERGY)),
									...spawns.map(spawn => spawn.room.controller).filter(Boolean)
								].filter(({ room }) => room && room.name != creep.room.name).map(({ pos }) => pos),
								{ visualizePathStyle: { stroke: `#975cea` } }
							),
							HERE
						)
					}
				}
			})
		}
	})


	if (Game.cpu.bucket == 10000) {
		Game.cpu.generatePixel()
		console.log("generated a pixel")
	}

	reconcileTraffic()
}

function build(creep: Creep, site: ConstructionSite) {
	const code = creep.build(site)

	if (code != OK) {
		assertCode(code, [ ERR_NOT_IN_RANGE ], HERE)

		if (!creep.fatigue)
			assertOk(moveTo(creep, site, { visualizePathStyle: { stroke: `red` } }), HERE)
	}
}

function transfer(creep: Creep, target: AnyCreep | Structure, resourceType: ResourceConstant, amount?: number) {
	const code = creep.transfer(target, resourceType, amount)

	if (code != OK) {
		assertCode(code, [ ERR_NOT_IN_RANGE ], HERE)

		// // TODO iterate through creeps sorted by closest up to self to find targets transfer to
		// const otherCreep = target.pos.findClosestByPath([ creep, ...creep.pos.findInRange(FIND_MY_CREEPS, 1) ])

		// if creep is able to get rid of all energy, do not move towards target
		// if creep is not, move towards

		// if (otherCreep && otherCreep.id != creep.id && otherCreep.store.getFreeCapacity()) {
		// 	assertOk(creep.transfer(otherCreep, RESOURCE_ENERGY), HERE)

		// 	if (!otherCreep.store.getUsedCapacity())
		// 		otherCreep.cancelOrder(`move`)

		// 	if (!creep.fatigue && otherCreep.store.getFreeCapacity() < creep.store.energy)
		// 		assertOk(moveTo(creep, target, { visualizePathStyle: { stroke: `green` } }), HERE)
		// } else
		if (!creep.fatigue)
			assertOk(moveTo(creep, target, { visualizePathStyle: { stroke: `green` } }), HERE)
	}
}

function harvest(creep: Creep, target: Source | Mineral | Deposit) {
	const code = creep.harvest(target)

	if (code != OK) {
		assertCode(code, [ ERR_NOT_IN_RANGE ], HERE)

		if (!creep.fatigue)
			assertOk(moveTo(creep, target, { visualizePathStyle: { stroke: `blue` } }), HERE)
	}
}

function catchAndReport(callback: () => void) {
	try {
		callback()
	} catch (error) {
		console.log(`Caught`, (error as any)?.stack)
		Game.notify(`Caught ${(error as any)?.stack}`)
	}
}

function measureCpu<T>(name: string, callback: () => T): T {
	const cpu = Game.cpu.getUsed()

	try {
		return callback()
	} finally {
		console.log(name, Game.cpu.getUsed() - cpu)
	}
}
