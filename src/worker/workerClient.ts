import * as Comlink from "comlink"
import { type WorkerApi } from "./workerEntrypoint"

export const worker = Comlink.wrap<WorkerApi>(
	new Worker(new URL("./workerEntrypoint", import.meta.url), {
		type: "module",
	})
)
