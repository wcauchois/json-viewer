import { StatusBar } from "../designSystem/StatusBar"
import { useFocusedNode } from "../../lib/useFocusedNode"
import { ASTNode } from "../../lib/jsonAst"
import { unreachable } from "../../lib/utils"
import { showSnackbar } from "../../state/snackbar"

export function ViewerStatusBar() {
	const focusedNode = useFocusedNode()

	return (
		<StatusBar className="text-xs justify-between">
			<NodePath focusedNode={focusedNode} />
			<InfoMessage />
		</StatusBar>
	)
}

function NodePath(props: { focusedNode: ASTNode | undefined }) {
	const { focusedNode } = props

	const pathDisplay = focusedNode
		? focusedNode.path.length === 0
			? { type: "root" as const }
			: {
					type: "node" as const,
					string: focusedNode.path.join("."),
				}
		: { type: "none" as const }

	if (pathDisplay.type === "root") {
		return <div>Root node selected</div>
	} else if (pathDisplay.type === "none") {
		return <div>No selected node</div>
	} else if (pathDisplay.type === "node") {
		return (
			<div
				className="font-mono cursor-pointer hover:underline"
				onMouseDown={() => {
					navigator.clipboard?.writeText(pathDisplay.string)
					showSnackbar("JSON path copied to clipboard")
				}}
			>
				{pathDisplay.string}
			</div>
		)
	} else {
		unreachable(pathDisplay)
	}
}

function InfoMessage() {
	return (
		<a
			className="underline cursor-pointer"
			href="https://bsky.app/profile/wcauchois.bsky.social"
			target="_blank"
		>
			Follow me on Bluesky for updates
		</a>
	)
}
