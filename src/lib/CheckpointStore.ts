import { openDB, DBSchema, IDBPDatabase } from "idb/with-async-ittr"
import { buf2hex } from "./utils"
import { EventEmitter } from "eventemitter3"
import { useEffect, useState } from "react"

export interface CheckpointModel {
	date: Date
	hash: string
	name: string | undefined
	content: string
}

interface CheckpointSchema extends DBSchema {
	checkpoints: {
		key: string
		value: CheckpointModel
		indexes: {
			date: Date
		}
	}
}

export class CheckpointStore extends EventEmitter<"change"> {
	private _db: Promise<IDBPDatabase<CheckpointSchema>> | undefined

	get db() {
		if (!this._db) {
			this._db = openDB<CheckpointSchema>("checkpoints", 1, {
				upgrade(db) {
					const store = db.createObjectStore("checkpoints", {
						keyPath: "hash",
					})
					store.createIndex("date", "date")
				},
			})
		}
		return this._db
	}

	async upsertCheckpoint(content: string) {
		const model: CheckpointModel = {
			date: new Date(),
			hash: buf2hex(
				await window.crypto.subtle.digest(
					"SHA-1",
					new TextEncoder().encode(content)
				)
			),
			content,
			name: undefined,
		}
		const db = await this.db
		const store = db.transaction("checkpoints", "readwrite").store
		await store.put(model)
		this.emit("change")
	}

	async renameCheckpoint(hash: string, name: string | undefined) {
		const db = await this.db
		const store = db.transaction("checkpoints", "readwrite").store
		const model = await store.get(hash)
		if (!model) {
			throw new Error(`Checkpoint with hash ${hash} not found`)
		}
		model.name = name
		await store.put(model)
		this.emit("change")
	}

	async getAllCheckpoints() {
		const db = await this.db
		const store = db.transaction("checkpoints", "readonly").store
		const index = store.index("date")
		const result: CheckpointModel[] = []
		for await (const model of index.iterate(undefined, "prev")) {
			result.push(model.value)
		}
		return result
	}
}

export const checkpointStore = new CheckpointStore()

export function useAllCheckpoints() {
	const [result, setResult] = useState<CheckpointModel[]>([])

	useEffect(() => {
		async function refresh() {
			setResult(await checkpointStore.getAllCheckpoints())
		}
		refresh()
		checkpointStore.on("change", refresh)
		return () => {
			checkpointStore.off("change", refresh)
		}
	})

	return result
}
