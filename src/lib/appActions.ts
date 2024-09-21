import { useAppState } from "../state/app"
import { showSnackbar } from "../state/snackbar"
import { checkpointStore } from "./CheckpointStore"
import { flattenAST } from "./jsonAst"

export async function pasteFromClipboard() {
	const clipboardText = await navigator.clipboard?.readText()
	useAppState.getState().setText(clipboardText ?? "")

	const updatedAppState = useAppState.getState()
	if (updatedAppState.parseResult.type === "success") {
		updatedAppState.setNodesExpanded(
			flattenAST(updatedAppState.parseResult.value.ast),
			true
		)
	}

	if (clipboardText) {
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
