import {
	CheckpointFilter,
	CheckpointModel,
	checkpointStore,
	useCheckpoints,
} from "../lib/CheckpointStore"
import { useAppState } from "../state/app"
import { DateTime } from "luxon"
import { IconUpload } from "../lib/icons"
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { useInterval } from "usehooks-ts"
import clsx from "clsx"

function CheckpointItem(props: { checkpoint: CheckpointModel }) {
	const { checkpoint } = props

	const currentText = useAppState(state => state.text)

	const isSelected = useMemo(
		() => currentText === checkpoint.content,
		[currentText, checkpoint]
	)

	const dateTime = useMemo(
		() => DateTime.fromJSDate(checkpoint.date),
		[checkpoint.date]
	)

	const getDateString = useCallback(() => {
		if (DateTime.local().diff(dateTime, "seconds").seconds < 5) {
			return "just now"
		} else {
			return dateTime.toRelative()
		}
	}, [dateTime])

	const [dateString, setDateString] = useState(getDateString)

	const pollInterval =
		DateTime.local().diff(dateTime, "seconds").seconds < 60 ? 5_000 : 30_000

	useInterval(() => {
		setDateString(getDateString())
	}, pollInterval)

	useEffect(() => {
		setDateString(getDateString())
	}, [getDateString])

	const metadataRows: Array<[string, ReactNode]> = [
		["date", dateString],
		["source", checkpoint.source],
	]

	return (
		<div className="flex flex-col mb-2">
			<div
				className={clsx(
					"flex text-sm border p-1 m-1 cursor-pointer",
					isSelected ? "border-purple-400" : "hover:border-black"
				)}
				onClick={() => {
					useAppState.getState().setText(checkpoint.content)
				}}
			>
				<pre
					className="max-h-14 overflow-hidden"
					style={{
						WebkitMaskImage:
							"linear-gradient(to bottom, rgba(0, 0, 0, 1.0) 3.2em, transparent 100%)",
					}}
				>
					{checkpoint.content}
				</pre>
			</div>
			<table className="text-xs mx-1">
				<tbody>
					{metadataRows.map(([key, value]) => (
						<tr key={key}>
							<td className="pr-2 text-gray-500">{key}</td>
							<td className="w-full">{value}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

type DisplayFilter =
	| {
			type: "manual" | "paste" | "all"
	  }
	| {
			type: "find"
			query: string
	  }

function FilterPill(props: {
	name: string
	onClick: () => void
	selected: boolean
}) {
	const { name, onClick, selected } = props
	return (
		<div
			onClick={onClick}
			className={clsx(
				"cursor-pointer px-1 border rounded border-gray-500 select-none transition-all",
				selected ? "bg-purple-300" : "hover:bg-purple-100"
			)}
		>
			{name}
		</div>
	)
}

function FilterPills(props: {
	displayFilter: DisplayFilter
	setDisplayFilter: (newDisplayFilter: DisplayFilter) => void
}) {
	const { displayFilter, setDisplayFilter } = props

	const filterTypeToName: { [K in DisplayFilter["type"]]: string } = {
		all: "All",
		manual: "Manual",
		paste: "Paste",
		find: "Find",
	}

	return (
		<div className="flex flex-col">
			<div className="flex text-sm mx-2 space-x-2 mb-1">
				{Object.entries(filterTypeToName).map(([filterType_, name]) => {
					const filterType = filterType_ as DisplayFilter["type"]
					return (
						<FilterPill
							key={filterType}
							name={name}
							selected={displayFilter.type === filterType}
							onClick={() => {
								if (displayFilter.type === filterType && filterType !== "all") {
									// Clicking on a non-all pill again resets filters.
									setDisplayFilter({ type: "all" })
								} else {
									setDisplayFilter(
										filterType === "find"
											? {
													type: "find",
													query: "",
												}
											: {
													type: filterType,
												}
									)
								}
							}}
						/>
					)
				})}
			</div>
			{displayFilter.type === "find" ? (
				<div className="flex mx-2 my-1">
					<input
						ref={el => el?.focus()}
						className="grow rounded text-sm px-2 py-1 outline-gray-400 focus:outline-purple-500 outline outline-1"
						placeholder="Enter a query"
						type="text"
						value={displayFilter.query}
						onChange={e => {
							setDisplayFilter({
								type: "find",
								query: e.currentTarget.value,
							})
						}}
					/>
				</div>
			) : null}
		</div>
	)
}

function CheckpointList() {
	const [displayFilter, setDisplayFilter] = useState<DisplayFilter>({
		type: "all",
	})
	const checkpointFilter = useMemo(
		(): CheckpointFilter => ({
			sourceFilter:
				displayFilter.type === "manual" || displayFilter.type === "paste"
					? displayFilter.type
					: undefined,
			query: displayFilter.type === "find" ? displayFilter.query : undefined,
		}),
		[displayFilter]
	)
	const checkpoints = useCheckpoints(checkpointFilter)

	return (
		<div className="flex flex-col">
			<FilterPills
				displayFilter={displayFilter}
				setDisplayFilter={setDisplayFilter}
			/>
			{checkpoints.map(checkpoint => (
				<CheckpointItem checkpoint={checkpoint} key={checkpoint.hash} />
			))}
		</div>
	)
}

export function CheckpointPanel() {
	return (
		<div className="flex flex-col">
			<div className="flex justify-between mx-2 my-1">
				<div>Checkpoints</div>
				<div className="flex gap-2 items-center">
					<IconUpload
						className="cursor-pointer"
						onClick={async () => {
							await checkpointStore.upsertCheckpoint({
								content: useAppState.getState().text,
								source: "manual",
							})
						}}
					/>
				</div>
			</div>
			<CheckpointList />
		</div>
	)
}
