import sqlite3InitModule, { OpfsDatabase } from "@sqlite.org/sqlite-wasm"
import { MessageFromWorker, MessageToWorker, WorkerApis } from "./workerApi"
import { Result } from "../lib/utils"

const log = (...args: unknown[]) => console.log(...args)
const error = (...args: unknown[]) => console.error(...args)

let db: OpfsDatabase | undefined

const apis: {
	[K in keyof WorkerApis]: (
		args: WorkerApis[K]["request"]
	) => Promise<WorkerApis[K]["response"]>
} = {
	async init() {
		if (db) {
			return {}
		}

		const sqlite3 = await sqlite3InitModule({
			print: log,
			printErr: error,
		})

		db = new sqlite3.oo1.OpfsDb("./db.sqlite3", "ct")

		return {}
	},

	async exec(args) {
		if (!db) {
			throw new Error("Database not initialized")
		}

		if (args.getData) {
			const result = db.exec(args.sql, {
				bind: args.bind,
				returnValue: "resultRows",
				rowMode: "object",
			})
			return {
				data: result,
			}
		} else {
			db.exec(args.sql, {
				bind: args.bind,
			})

			return {
				data: undefined,
			}
		}
	},
}

addEventListener("message", async (event: MessageEvent<MessageToWorker>) => {
	const { data } = event
	let response: Result<unknown, Error>
	try {
		response = {
			type: "success",
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			value: await apis[data.method](data.requestData as any),
		}
	} catch (err) {
		response = {
			type: "failure",
			error: err as Error,
		}
	}

	const responseMessage: MessageFromWorker = {
		id: data.id,
		response,
		type: "response",
	}

	self.postMessage(responseMessage)
})

async function init() {}

init().catch(err => error(err))
