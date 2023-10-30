import { create } from "zustand"
import { Result } from "./utils"
import { ASTNode, jsonToAST } from "./jsonAst"

interface TextState {
	text: string
	setText: (newText: string) => void
	parsed: Result<
		{
			object: Record<string, unknown>
			ast: ASTNode
		},
		Error
	>
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
			const object = JSON.parse(newText)
			parsed = {
				type: "success",
				value: {
					object,
					ast: jsonToAST(object),
				},
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
