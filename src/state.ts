import { create } from "zustand"
import { Result } from "./utils"

interface TextState {
	text: string
	setText: (newText: string) => void
	parsed: Result<Record<string, unknown>, Error>
}

export const useText = create<TextState>(set => ({
	text: "",
	parsed: {
		type: "failure",
		error: new Error("No input"),
	},
	setText: newText => {
		let parsed: TextState["parsed"]
		try {
			parsed = {
				type: "success",
				value: JSON.parse(newText),
			}
		} catch (err) {
			parsed = {
				type: "failure",
				error: err as Error,
			}
		}

		set({
			text: newText,
			parsed,
		})
	},
}))
