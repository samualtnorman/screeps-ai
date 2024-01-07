import { moveTo } from "screeps-cartographer"
import { assertCode, assertOk } from "./assertCode"
import { measureCpu } from "./measureCpu"

export function transfer(creep: Creep, target: AnyCreep | Structure, resourceType: ResourceConstant, amount?: number) {
	measureCpu(HERE)

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

	measureCpu(HERE)
}
