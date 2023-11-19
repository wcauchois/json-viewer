import { nanoid } from "nanoid"
import { MessageFromWorker, MessageToWorker, WorkerApis } from "./workerApi"

export const worker = new Worker(
	new URL("./workerEntrypoint", import.meta.url),
	{
		type: "module",
	}
)

export async function callWorkerApi<K extends keyof WorkerApis>(
	method: K,
	args: WorkerApis[K]["request"]
) {
	const requestId = nanoid()

	const requestMessage: MessageToWorker = {
		type: "request",
		id: requestId,
		method,
		requestData: args,
	}

	return new Promise<WorkerApis[K]["response"]>((resolve, reject) => {
		function listener(event: MessageEvent<MessageFromWorker>) {
			if (event.data.id === requestId) {
				worker.removeEventListener("message", listener)

				const response = event.data.response
				if (response.type === "success") {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					resolve(response.value as any)
				} else {
					reject(response.error)
				}
			}
		}

		worker.addEventListener("message", listener)
		worker.postMessage(requestMessage)
	})
}
