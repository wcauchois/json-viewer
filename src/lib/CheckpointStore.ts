import { buf2hex, ValidJson } from "./utils"
import { EventEmitter } from "eventemitter3"
import { z } from "zod"
import { useEffect, useState } from "react"
import { database } from "./database"
import _ from "lodash"

const checkpointSourceSchema = z.union([
	z.literal("paste"),
	z.literal("manual"),
])
type CheckpointSource = z.infer<typeof checkpointSourceSchema>

export interface CheckpointModel {
	date: Date
	hash: string
	name: string | undefined
	content: string
	source: CheckpointSource
}

const CheckpointModel = (() => {
	const rowSchema = z.object({
		hash: z.string(),
		date: z.number(),
		name: z.string().nullable(),
		content: z.string(),
		source: checkpointSourceSchema,
	})

	return {
		COLUMNS: ["hash", "date", "name", "content", "source"],
		rowSchema,
		mapRow: (driverRow: z.infer<typeof rowSchema>): CheckpointModel => ({
			date: new Date(driverRow.date * 1000),
			content: driverRow.content,
			hash: driverRow.hash,
			name: driverRow.name ?? undefined,
			source: driverRow.source,
		}),
	}
})()

export const getHashForContent = _.memoize(async (content: string) => {
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
})

export interface CheckpointFilter {
	sourceFilter?: CheckpointSource
	query?: string
}

export class CheckpointStore extends EventEmitter<"change"> {
	async upsertCheckpoint(args: {
		content: ValidJson
		source: CheckpointSource
	}) {
		const { content, source } = args

		// https://www.sqlite.org/lang_upsert.html
		await database.exec(
			`
				insert into checkpoint(date, hash, content, source) values ($date, $hash, $content, $source)
				on conflict do update set date = $date, content = $content, source = $source
			`,
			{
				$date: Math.round(Date.now() / 1000),
				$hash: await getHashForContent(content),
				$content: content,
				$source: source,
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

	async getCheckpoints(filter: CheckpointFilter = {}) {
		const rows = await database.fetchRows({
			sql: `
				select ${CheckpointModel.COLUMNS.join(",")} from checkpoint
				${filter.sourceFilter || filter.query ? "where" : ""}
				${filter.sourceFilter ? "source = $sourceFilter" : ""}
				${
					filter.query
						? (filter.sourceFilter ? "and " : "") +
							"upper(content) like '%' || upper($query) || '%'"
						: ""
				}
				order by date desc
			`,
			bind: {
				...(filter.sourceFilter
					? {
							$sourceFilter: filter.sourceFilter,
						}
					: {}),
				...(filter.query
					? {
							$query: filter.query,
						}
					: {}),
			},
			rowSchema: CheckpointModel.rowSchema,
		})
		return rows.map(CheckpointModel.mapRow)
	}

	async getLatestCheckpoint() {
		const rows = await database.fetchRows({
			sql: `
				select ${CheckpointModel.COLUMNS.join(",")} from checkpoint
				order by date desc
				limit 1
			`,
			rowSchema: CheckpointModel.rowSchema,
		})
		return rows.length > 0 ? CheckpointModel.mapRow(rows[0]) : undefined
	}

	async getSiblingCheckpoint(hash: string, mode: "earlier" | "later") {
		const rows = await database.fetchRows({
			sql: `
				select ${CheckpointModel.COLUMNS.map(c => `current.${c}`).join(",")}
				from checkpoint current
				join (
					select hash, ${mode === "earlier" ? "lead" : "lag"}(hash) over (order by date desc) as sibling_hash
					from checkpoint
				) sibling
				on current.hash = sibling.sibling_hash
				where sibling.hash = $hash
			`,
			bind: {
				$hash: hash,
			},
			rowSchema: CheckpointModel.rowSchema,
		})
		return rows.length > 0 ? CheckpointModel.mapRow(rows[0]) : undefined
	}

	async doesHashExistAsCheckpoint(hash: string) {
		const rows = await database.fetchRows({
			sql: `
				select count(*) as count
				from checkpoint
				where hash = $hash
			`,
			bind: {
				$hash: hash,
			},
			rowSchema: z.object({ count: z.number() }),
		})
		return rows[0].count > 0
	}
}

export const checkpointStore = new CheckpointStore()

export function useCheckpoints(filter: CheckpointFilter = {}) {
	const [result, setResult] = useState<CheckpointModel[]>([])

	useEffect(() => {
		async function refresh() {
			setResult(await checkpointStore.getCheckpoints(filter))
		}
		refresh()
		checkpointStore.on("change", refresh)
		return () => {
			checkpointStore.off("change", refresh)
		}
	}, [filter])

	return result
}
