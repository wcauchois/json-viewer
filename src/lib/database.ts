import { callWorkerApi } from "../worker/workerClient"
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
}

export const database = new Database()
