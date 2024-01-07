import { moveTo } from "screeps-cartographer"
import { assertCode, assertOk } from "./assertCode"
import { measureCpu } from "./measureCpu"

export function harvest(creep: Creep, target: Source | Mineral | Deposit) {
	measureCpu(HERE)

	const code = creep.harvest(target)

	measureCpu(HERE)

	if (code != OK) {
		measureCpu(HERE)
		assertCode(code, [ ERR_NOT_IN_RANGE ], HERE)
		measureCpu(HERE)

		if (!creep.fatigue)
			assertOk(moveTo(creep, target, { visualizePathStyle: { stroke: `blue` } }), HERE)

		measureCpu(HERE)
	}

	measureCpu(HERE)
}
