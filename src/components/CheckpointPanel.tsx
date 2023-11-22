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
				className="flex text-sm border p-1 m-1 hover:border-black cursor-pointer"
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

type FilterType = "manual" | "paste" | "all"

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
				"cursor-pointer px-1 border rounded border-gray-500 select-none",
				selected ? "bg-purple-300" : "hover:bg-purple-100"
			)}
		>
			{name}
		</div>
	)
}

function FilterPills(props: {
	filterType: FilterType
	setFilterType: (newFilterType: FilterType) => void
}) {
	const { filterType, setFilterType } = props

	const filterPillToName: { [K in FilterType]: string } = {
		all: "All",
		manual: "Manual",
		paste: "Paste",
	}

	return (
		<div className="flex text-sm mx-2 space-x-2 mb-1">
			{Object.entries(filterPillToName).map(([currentFilterType, name]) => (
				<FilterPill
					key={currentFilterType}
					name={name}
					selected={filterType === currentFilterType}
					onClick={() => {
						if (
							filterType === currentFilterType &&
							currentFilterType !== "all"
						) {
							// Clicking on a non-all pill again resets filters.
							setFilterType("all")
						} else {
							setFilterType(currentFilterType as FilterType)
						}
					}}
				/>
			))}
		</div>
	)
}

function CheckpointList() {
	const [filterType, setFilterType] = useState<FilterType>("all")
	const checkpointFilter = useMemo(
		(): CheckpointFilter => ({
			sourceFilter: filterType !== "all" ? filterType : undefined,
		}),
		[filterType]
	)
	const checkpoints = useCheckpoints(checkpointFilter)

	return (
		<div className="flex flex-col">
			<FilterPills filterType={filterType} setFilterType={setFilterType} />
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
