import * as Comlink from "comlink"
import init, { compress } from "lzma-rs"
import wasmUrl from "lzma-rs/lzma_rs_bg.wasm?url"

console.log("wasm url", wasmUrl)
const lzmaInitialized = init(wasmUrl)

const workerApi = {
	async ping() {
		await lzmaInitialized
		return "hello from worker"
	},
	compress: async (input: Uint8Array): Promise<Uint8Array> => {
		await lzmaInitialized
		return compress(input)
	},
}

export type WorkerApi = typeof workerApi
Comlink.expose(workerApi)
