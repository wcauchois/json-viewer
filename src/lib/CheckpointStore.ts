import { buf2hex } from "./utils"
import { EventEmitter } from "eventemitter3"
import { z } from "zod"
import { useEffect, useState } from "react"
import { database } from "./database"

export interface CheckpointModel {
	date: Date
	hash: string
	name: string | undefined
	content: string
}

async function getHashForContent(content: string) {
	let normalizedContent = content
	try {
		normalizedContent = JSON.stringify(JSON.parse(content))
	} catch (err) {
		// No op
	}
	return buf2hex(
		await window.crypto.subtle.digest(
			"SHA-1",
			new TextEncoder().encode(normalizedContent)
		)
	)
}

export class CheckpointStore extends EventEmitter<"change"> {
	async upsertCheckpoint(content: string) {
		// https://www.sqlite.org/lang_upsert.html
		await database.exec(
			`
				insert into checkpoint(date, hash, content) values ($date, $hash, $content)
				on conflict do update set date = $date, content = $content
			`,
			{
				$date: Math.round(Date.now() / 1000),
				$hash: await getHashForContent(content),
				$content: content,
			}
		)
		this.emit("change")
	}

	async renameCheckpoint(hash: string, name: string | undefined) {
		await database.exec(
			`update checkpoint set name = $name where hash = $hash`,
			{
				$name: name ?? null,
				$hash: hash,
			}
		)
		this.emit("change")
	}

	async getAllCheckpoints() {
		const rows = await database.fetchRows({
			sql: `select hash, date, name, content from checkpoint order by date desc`,
			rowSchema: z.object({
				hash: z.string(),
				date: z.number(),
				name: z.string().nullable(),
				content: z.string(),
			}),
		})
		return rows.map(
			(row): CheckpointModel => ({
				date: new Date(row.date * 1000),
				content: row.content,
				hash: row.hash,
				name: row.name ?? undefined,
			})
		)
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
	}, [])

	return result
}
