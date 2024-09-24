import type { JsonValue } from "@samual/lib"
import * as v from "valibot"

type MemorySchema = v.GenericSchema<any, JsonValue>

export type MemoryOptions<T extends MemorySchema> = { name: string, schema: T }

export const makeMemoryOptions = <T extends MemorySchema>(options: MemoryOptions<T>) => options

export const getMemory = <T extends MemorySchema>(options: MemoryOptions<T>) =>
	v.parse(options.schema, Memory[options.name])

export const setMemory = <T extends MemorySchema>(options: MemoryOptions<T>, value: v.InferOutput<T>) =>
	Memory[options.name] = value
