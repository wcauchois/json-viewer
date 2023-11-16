import { useAppState } from "../state/app"
import { showSnackbar } from "../state/snackbar"

export async function pasteFromClipboard() {
	const clipboardText = await navigator.clipboard?.readText()
	useAppState.getState().setText(clipboardText ?? "")
	showSnackbar("Pasted from clipboard.")
}

export async function copyToClipboard() {
	const text = useAppState.getState().text
	await navigator.clipboard?.writeText(text)
	showSnackbar("Copied to clipboard!")
}
