import { useAppState } from "../state/app"
import { showSnackbar } from "../state/snackbar"
import { checkpointStore } from "./CheckpointStore"

export async function pasteFromClipboard() {
	const clipboardText = await navigator.clipboard?.readText()
	useAppState.getState().setText(clipboardText ?? "")
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
