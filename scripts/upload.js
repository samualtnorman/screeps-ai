#!/usr/bin/env node
import { readFileSync } from "fs"
import * as v from "valibot"
import { TOKEN } from "../env.js"

const USERNAME = "Samual"
const LOCAL_ORIGIN = "http://localhost:21025"
const OFFICIAL_ORIGIN = "https://screeps.com"
const ORIGIN = OFFICIAL_ORIGIN

const ApiUserCodeResponseSchema = v.object({ ok: v.literal(1), branch: v.string(), modules: v.record(v.string(), v.string()) })
const ApiUserCloneBranchSchema = v.object({ ok: v.literal(1), timestamp: v.number() })

const getCode = async (/** @type {string} */ branch) => v.parse(
	ApiUserCodeResponseSchema,
	await (await fetch(`${ORIGIN}/api/user/code?${new URLSearchParams({ branch })}`, {
		headers: { "x-username": USERNAME, "x-token": TOKEN }
	})).json()
)

const setCode = async (/** @type {string} */ branch, /** @type {Record<string, string>} */ modules) =>
	(await fetch(`${ORIGIN}/api/user/code`, {
		method: "POST",
		headers: { "content-type": "application/json", "x-username": USERNAME, "x-token": TOKEN },
		body: JSON.stringify({ _hash: Date.now(), branch, modules })
	})).json()

/** @param {string} branch @param {string} newName @param {Record<string, string>} defaultModules */
const cloneBranch = async (branch, newName, defaultModules) => v.parse(
	ApiUserCloneBranchSchema,
	await (await fetch(`${ORIGIN}/api/user/clone-branch`, {
		method: "POST",
		headers: { "content-type": "application/json", "x-username": USERNAME, "x-token": TOKEN },
		body: JSON.stringify({ branch, newName, defaultModules })
	})).json()
)

// await cloneBranch("", "guitless", { main: readFileSync("dist/main.js", { encoding: "utf8" }) })
await setCode("guitless", { main: readFileSync("dist/main.js", { encoding: "utf8" }) })
process.exit()
