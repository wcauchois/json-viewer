import { useAppState } from "../state/app"
import { showSnackbar } from "../state/snackbar"
import { flattenAST } from "./jsonAst"
import { forceCommitToHash } from "./routing"
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
		forceCommitToHash()
	}
	showSnackbar("Pasted from clipboard.")
}

export async function copyToClipboard() {
	const text = useAppState.getState().text
	await navigator.clipboard?.writeText(text)
	showSnackbar("Copied to clipboard!")
}
