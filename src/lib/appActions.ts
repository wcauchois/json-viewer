import { useAppState } from "../state/app"
import { showSnackbar } from "../state/snackbar"
import { checkpointStore, getHashForContent } from "./CheckpointStore"
import { flattenAST } from "./jsonAst"
import { isValidJson } from "./utils"

const MAX_LENGTH_FOR_AUTOEXPAND = 5000

export async function pasteFromClipboard() {
	const clipboardText = await navigator.clipboard?.readText()
	useAppState.getState().setText(clipboardText ?? "")

	const updatedAppState = useAppState.getState()
	if (
		clipboardText.length < MAX_LENGTH_FOR_AUTOEXPAND &&
		updatedAppState.parseResult.type === "success"
	) {
		updatedAppState.setNodesExpanded(
			flattenAST(updatedAppState.parseResult.value.ast),
			true
		)
	}

	if (clipboardText && isValidJson(clipboardText)) {
		checkpointStore.upsertCheckpoint({
			content: clipboardText,
			source: "paste",
		})
	}
	showSnackbar("Pasted from clipboard.")
}

export async function copyToClipboard() {
	const text = useAppState.getState().text
	await navigator.clipboard?.writeText(text)
	showSnackbar("Copied to clipboard!")
}

export async function selectSiblingCheckpoint(direction: "earlier" | "later") {
	const initialAppState = useAppState.getState()
	if (!initialAppState.text) {
		return
	}

	const currentHash = await getHashForContent(initialAppState.text)

	let siblingCheckpoint
	if (
		direction === "earlier" &&
		!(await checkpointStore.doesHashExistAsCheckpoint(currentHash))
	) {
		// No checkpoint selected and we're going earlier: select the
		// latest checkpoint for the user.
		siblingCheckpoint = await checkpointStore.getLatestCheckpoint()
	} else {
		siblingCheckpoint = await checkpointStore.getSiblingCheckpoint(
			currentHash,
			direction
		)
	}

	if (!siblingCheckpoint) {
		return
	}

	useAppState.getState().setText(siblingCheckpoint.content)
}

export async function selectLatestCheckpoint() {
	const latestCheckpoint = await checkpointStore.getLatestCheckpoint()
	if (latestCheckpoint) {
		useAppState.getState().setText(latestCheckpoint.content)
	}
}

export const sharedAppViewerTabShortcuts = {
	e: () => {
		const appState = useAppState.getState()
		appState.setLeftSidebarExpanded(!appState.leftSidebarExpanded)
	},
	b: () => selectSiblingCheckpoint("earlier"),
	f: () => selectSiblingCheckpoint("later"),
}
