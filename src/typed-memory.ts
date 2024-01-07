import * as v from "valibot"

export type MemoryOptions<T extends v.BaseSchema> = { name: string, schema: T }

export const makeMemoryOptions = <T extends v.BaseSchema>(options: MemoryOptions<T>) => options

export const getMemory = <T extends v.BaseSchema>(options: MemoryOptions<T>) =>
	v.parse(options.schema, Memory[options.name])

export const setMemory = <T extends v.BaseSchema>(options: MemoryOptions<T>, value: v.Output<T>) =>
	Memory[options.name] = value
