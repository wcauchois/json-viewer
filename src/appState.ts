import { create } from "zustand"
import { Result } from "./utils"
import { ASTNode, flattenAST, jsonToAST } from "./jsonAst"
import { Set } from "immutable"

interface AppState {
	text: string
	setText: (newText: string) => void
	expandedNodes: Set<ASTNode>
	parseResult: Result<
		{
			object: Record<string, unknown>
			ast: ASTNode
			flatAST: ASTNode[]
		},
		Error
	>
	setNodeExpanded: (node: ASTNode, expanded: boolean) => void
}

export const useAppState = create<AppState>(set => ({
	text: "",
	expandedNodes: Set(),
	parseResult: {
		type: "failure",
		error: new Error("No input"),
	},
	setNodeExpanded: (node, expanded) => {
		set(state => ({
			expandedNodes: expanded
				? state.expandedNodes.add(node)
				: state.expandedNodes.filter(candidate => candidate !== node),
		}))
	},
	setText: newText => {
		let parseResult: AppState["parseResult"]
		let expandedNodes: AppState["expandedNodes"] = Set()
		try {
			const object = JSON.parse(newText)
			const ast = jsonToAST(object)
			const flatAST = flattenAST(ast)
			parseResult = {
				type: "success",
				value: {
					object,
					ast,
					flatAST,
				},
			}
			expandedNodes = Set(flatAST) // Default all expanded
		} catch (err) {
			parseResult = {
				type: "failure",
				error: err as Error,
			}
		}

		set({
			text: newText,
			parseResult: parseResult,
			expandedNodes,
		})
	},
}))
