import * as Comlink from "comlink"
import init, { compress, decompress } from "lzma-rs"
import wasmUrl from "lzma-rs/lzma_rs_bg.wasm?url"

const lzmaInitialized = init({ module_or_path: wasmUrl })

const workerApi = {
	async ping() {
		return "hello from worker"
	},

	async compress(input: Uint8Array): Promise<Uint8Array> {
		await lzmaInitialized
		return compress(input)
	},

	async decompress(input: Uint8Array): Promise<Uint8Array> {
		await lzmaInitialized
		return decompress(input)
	},
}

export type WorkerApi = typeof workerApi
Comlink.expose(workerApi)
