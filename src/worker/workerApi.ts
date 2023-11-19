import { EmptyObject, Result } from "../lib/utils"
import type { BindingSpec } from "@sqlite.org/sqlite-wasm"

export type WorkerApis = {
	init: {
		request: EmptyObject
		response: EmptyObject
	}
	exec: {
		request: {
			sql: string
			bind?: BindingSpec
			getData: boolean
		}
		response: {
			data: unknown[] | undefined
		}
	}
}

export interface MessageToWorker {
	type: "request"
	id: string
	method: keyof WorkerApis
	requestData: unknown
}

export interface MessageFromWorker {
	type: "response"
	id: string
	response: Result<unknown, Error>
}
