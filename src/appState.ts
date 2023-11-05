import { create } from "zustand"
import { Result } from "./utils"
import { ASTNode, flattenAST, jsonToAST } from "./jsonAst"
import { Set } from "immutable"

export interface AppState {
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
	leftSidebarExpanded: boolean
	setLeftSidebarExpanded(expanded: boolean): void
}

/**
 * Recursively parses JSON that's contained in strings within the input object.
 */
const deepJsonParse = (input: string) =>
	JSON.parse(input, (_key, value) => {
		if (typeof value === "string" && value.startsWith("{")) {
			try {
				return JSON.parse(value)
			} catch (err) {
				// Fall through
			}
		}
		return value
	})

const defaultParseResult: AppState["parseResult"] = {
	type: "failure",
	error: new Error("No input"),
}

export const useAppState = create<AppState>(set => ({
	text: "",
	expandedNodes: Set(),
	parseResult: defaultParseResult,
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
			const object = deepJsonParse(newText)
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
			expandedNodes = Set([ast])
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
	leftSidebarExpanded: false,
	setLeftSidebarExpanded(expanded) {
		set({
			leftSidebarExpanded: expanded,
		})
	},
}))
