import {
	CheckpointModel,
	checkpointStore,
	useAllCheckpoints,
} from "./CheckpointStore"
import { useAppState } from "./state/app"
import { IconUpload } from "./icons"

function CheckpointItem(props: { checkpoint: CheckpointModel }) {
	const { checkpoint } = props
	return (
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
	)
}

function CheckpointList() {
	const checkpoints = useAllCheckpoints()

	return (
		<div className="flex flex-col">
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
							await checkpointStore.upsertCheckpoint(
								useAppState.getState().text
							)
						}}
					/>
				</div>
			</div>
			<CheckpointList />
		</div>
	)
}
