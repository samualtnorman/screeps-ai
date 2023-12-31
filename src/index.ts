import "@total-typescript/ts-reset"
import { MoveOpts, MoveTarget, moveTo, preTick, reconcileTraffic } from "screeps-cartographer"
import * as v from "valibot"
import { assertCode, assertOk } from "./assertCode"
import { catchAndReport } from "./catchAndReport"
import { measureCpu, prepareMeasureCpu } from "./measureCpu"
import { getMemory, makeMemoryOptions, setMemory } from "./typed-memory"

const countConstructionSites = () => Object.keys(Game.constructionSites).length

const moveToRoom = (creep: Creep, targets: Set<string>, opts?: MoveOpts) =>
	moveTo(creep, [ ...targets ].map((room): MoveTarget => ({ pos: new RoomPosition(0, 0, room), range: 50 })), opts)

console.log(`Started`)

const OptionalStringSchema = v.optional(v.string())

const ExitsInformationSchema =
	v.object({ 1: OptionalStringSchema, 3: OptionalStringSchema, 5: OptionalStringSchema, 7: OptionalStringSchema })

const ExitsMemory = makeMemoryOptions({
	name: `r13bdvehoe4lothcx16qdna6`,
	schema: v.fallback(v.record(v.string(), ExitsInformationSchema), {})
})

const RoomsMemory = makeMemoryOptions({
	name: `vdi1sf9zaxh3gh60o319sfhe`,
	schema: v.fallback(v.record(
		v.string(),
		v.object({ sources: v.array(v.object({ x: v.number(), y: v.number() })) })
	), {})
})

const exitsMemory = getMemory(ExitsMemory)

const describeExits = (roomName: string) => {
	if (exitsMemory[roomName])
		return exitsMemory[roomName] as ExitsInformation

	return exitsMemory[roomName] = Game.map.describeExits(roomName)
}

const roomsMemory = getMemory(RoomsMemory)

export let ticksAlive = 0

export const loop = () => {
	prepareMeasureCpu()
	measureCpu(HERE)
	ticksAlive++
	console.log(`Tick: ${Game.time} (${ticksAlive})`)
	preTick()

	for (const name in Memory.creeps) {
		if (!(name in Game.creeps))
			delete Memory.creeps[name]
	}

	measureCpu(HERE)

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
								spawn.room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD),
								`${HERE} ${step.x} ${step.y}`
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

				for (const exit of Object.keys(describeExits(spawn.room.name))) {
					const position = spawn.pos.findClosestByPath(Number(exit) as 1 | 3 | 5 | 7)

					if (position && !position.lookFor(LOOK_STRUCTURES).length) {
						for (const step of spawn.pos
							.findPathTo(position, { ignoreCreeps: true, ignoreRoads: true, swampCost: 1, range: 1 })
						) {
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

	measureCpu(HERE)

	for (const room of Object.values(Game.rooms))
		roomsMemory[room.name] = { sources: room.find(FIND_SOURCES).map(({ pos }) => ({ x: pos.x, y: pos.y })) }

	measureCpu(HERE)
	setMemory(RoomsMemory, roomsMemory)
	measureCpu(HERE)

	const creeps = Object.values(Game.creeps)

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

	measureCpu(HERE)

	for (const creep of creeps) catchAndReport((): void => {
		measureCpu(HERE)

		if (creep.spawning)
			return

		if (!creep.store.getUsedCapacity()) {
			// storage is empty
			// harvest from source in range
			// otherwise move towards source in same room
			// otherwise move towards another room

			measureCpu(HERE)

			const sources = creep.room.find(FIND_SOURCES)
			const target = sources.find(source => source.pos.isNearTo(creep))

			measureCpu(HERE)

			if (target) {
				measureCpu(HERE)
				assertOk(creep.harvest(target), HERE)
			} else if (!creep.fatigue) {
				measureCpu(HERE)

				const code = moveTo(
					creep,
					sources.map(({ pos }): MoveTarget => ({ pos, range: 1 })),
					{ visualizePathStyle: { stroke: `red` }, avoidCreeps: true }
				)

				measureCpu(HERE)

				if (code == ERR_NO_PATH) {
					measureCpu(HERE)

					assertOk(moveToRoom(
						creep,
						new Set(Object.values(describeExits(creep.room.name))),
						{ visualizePathStyle: { stroke: `green` } }
					), HERE)
				} else {
					measureCpu(HERE)
					assertOk(code, HERE)
				}
			}
		} else {
			// transfer to/build target in range
			// otherwise move towards target in same room
			// otherwise move towards target in another room

			measureCpu(HERE)

			const targets = [
				...creep.store.getFreeCapacity() ? creep.room.find(FIND_SOURCES).map(target => ({ target, range: 1 }))
					: [],
				...creep.room.find(FIND_CONSTRUCTION_SITES).map(target => ({ target, range: 3 })),
				...creep.room.find(FIND_MY_SPAWNS).filter(({ store }) => store.getFreeCapacity(RESOURCE_ENERGY))
					.map(target => ({ target, range: 1 })),
				...creep.room.controller?.my ? [ { target: creep.room.controller, range: 3 } ] : []
			]

			measureCpu(HERE)

			const target = targets.find(({ target, range }) => creep.pos.inRangeTo(target, range))?.target

			measureCpu(HERE)

			if (target) {
				measureCpu(HERE)

				assertOk(
					target instanceof ConstructionSite ? (measureCpu(HERE), creep.build(target))
						: target instanceof Source ? (measureCpu(HERE), creep.harvest(target))
						: target instanceof StructureController ? (measureCpu(HERE), creep.upgradeController(target))
						: (measureCpu(HERE), creep.transfer(target, RESOURCE_ENERGY)),
					HERE
				)
			} else if (!creep.fatigue) {
				measureCpu(HERE)

				const code = moveTo(
					creep,
					targets.map(({ target, range }) => ({ pos: target.pos, range })),
					{ visualizePathStyle: { stroke: `blue` }, avoidCreeps: true }
				)

				measureCpu(HERE)

				if (code == ERR_NO_PATH) {
					measureCpu(HERE)

					const spawns = Object.values(Game.spawns)

					assertOk(moveToRoom(
						creep,
						new Set([
							...Object.values(Game.constructionSites),
							...spawns.filter(spawn => spawn.store.getFreeCapacity(RESOURCE_ENERGY)),
							...spawns.map(spawn => spawn.room.controller).filter(Boolean)
						].filter(({ room }) => room && room.name != creep.room.name).map(({ room }) => room!.name)),
						{ visualizePathStyle: { stroke: `orange` } }
					), HERE)
				} else {
					measureCpu(HERE)
					assertOk(code, HERE)
				}
			}
		}

		measureCpu(HERE)
	})

	setMemory(ExitsMemory, exitsMemory)

	if (Game.cpu.bucket == 10000) {
		Game.cpu.generatePixel()
		console.log("generated a pixel")
	}

	measureCpu(`reconcileTraffic()`)
	reconcileTraffic()
	measureCpu(`end`)
}
