import { callWorkerApi } from "../worker/workerClient"
import type { BindingSpec } from "@sqlite.org/sqlite-wasm"
import { z } from "zod"

interface MigrationInterface {
	exec(sql: string): Promise<void>
}

const migrations: Record<
	string,
	(database: MigrationInterface) => Promise<void>
> = {
	create_test_table: async database => {
		await database.exec(`create table test(text text)`)
	},

	create_checkpoint_table: async database => {
		await database.exec(`
			create table checkpoint(
				hash text not null primary key,
				date integer not null,
				name text,
				content text not null,
				source text not null
			)
		`)
	},
}

class Database {
	private _initPromise: Promise<void> | undefined

	private async initializeDatabase() {
		await callWorkerApi("init", {})

		await callWorkerApi("exec", {
			sql: `create table if not exists migrations(name text)`,
			getData: false,
		})

		for (const [migrationName, migrateFn] of Object.entries(migrations)) {
			// TODO: Transaction for the migration?
			const result = await callWorkerApi("exec", {
				sql: `select count(*) as count from migrations where name = $name`,
				bind: {
					$name: migrationName,
				},
				getData: true,
			})

			const count = z
				.object({
					count: z.number(),
				})
				.parse(result.data![0]).count

			if (count === 0) {
				console.log(`%cRunning migration ${migrationName}`, "color: blue")

				await migrateFn({
					exec: async sql => {
						await callWorkerApi("exec", { sql, getData: false })
					},
				})

				await callWorkerApi("exec", {
					sql: `insert into migrations (name) values ($name)`,
					bind: {
						$name: migrationName,
					},
					getData: false,
				})
			}
		}
	}

	ensureInitialized() {
		if (!this._initPromise) {
			this._initPromise = this.initializeDatabase()
		}
		return this._initPromise
	}

	async exec(sql: string, bind?: BindingSpec) {
		await this.ensureInitialized()
		await callWorkerApi("exec", {
			sql,
			bind,
			getData: false,
		})
	}

	async fetchRows<T extends z.ZodTypeAny>(args: {
		sql: string
		bind?: BindingSpec | undefined
		rowSchema: T
	}): Promise<Array<z.infer<T>>> {
		const { sql, bind, rowSchema } = args
		console.log("fetch sql", sql)
		await this.ensureInitialized()
		const result = await callWorkerApi("exec", {
			sql,
			bind,
			getData: true,
		})
		return (result.data ?? []).map(row => rowSchema.parse(row))
	}
}

export const database = new Database()
