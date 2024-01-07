import { moveTo } from "screeps-cartographer"
import { assertCode, assertOk } from "./assertCode"
import { measureCpu } from "./measureCpu"

export function build(creep: Creep, site: ConstructionSite) {
	measureCpu(HERE)

	const code = creep.build(site)

	if (code != OK) {
		assertCode(code, [ ERR_NOT_IN_RANGE ], HERE)

		if (!creep.fatigue)
			assertOk(moveTo(creep, site, { visualizePathStyle: { stroke: `red` } }), HERE)
	}

	measureCpu(HERE)
}
