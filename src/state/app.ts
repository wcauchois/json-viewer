import { create } from "zustand"
import { Result, isDefined } from "../lib/utils"
import { ASTNode, jsonToAST } from "../lib/jsonAst"
import { Set } from "immutable"
import { useEffect } from "react"

export interface AppState {
	text: string
	setText: (newText: string) => void
	expandedNodes: Set<ASTNode>
	parseResult: Result<
		{
			object: Record<string, unknown>
			ast: ASTNode
		},
		Error
	>
	setNodeExpanded: (node: ASTNode, expanded: boolean) => void
	setNodesExpanded: (nodes: ASTNode[], expanded: boolean) => void
	leftSidebarExpanded: boolean
	setLeftSidebarExpanded(expanded: boolean): void
	tabIndex: number
	setTabIndex: (index: number) => void
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

export const useAppState = create<AppState>((set, get) => ({
	text: "",
	expandedNodes: Set(),
	parseResult: defaultParseResult,
	setNodeExpanded: (node, expanded) => {
		get().setNodesExpanded([node], expanded)
	},
	setNodesExpanded: (nodes, expanded) => {
		set(state => ({
			expandedNodes: expanded
				? state.expandedNodes.union(nodes)
				: state.expandedNodes.subtract(nodes),
		}))
	},
	setText: newText => {
		let parseResult: AppState["parseResult"]
		let expandedNodes: AppState["expandedNodes"] = Set()
		try {
			const object = deepJsonParse(newText)
			const ast = jsonToAST(object)
			parseResult = {
				type: "success",
				value: {
					object,
					ast,
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
	tabIndex: 1,
	setTabIndex: index => set({ tabIndex: index }),
}))

const LOCAL_STORAGE_KEY = "appState"

interface LocalStorageValue {
	text: string
	leftSidebarExpanded: boolean
	tabIndex: number | undefined
}

export function useAppStateStorage() {
	const setText = useAppState(state => state.setText)
	const setLeftSidebarExpanded = useAppState(
		state => state.setLeftSidebarExpanded
	)
	const setTabIndex = useAppState(state => state.setTabIndex)

	useEffect(() => {
		const storageValue = window.localStorage.getItem(LOCAL_STORAGE_KEY)
		if (storageValue) {
			const storageJsonValue: LocalStorageValue = JSON.parse(storageValue)
			setText(storageJsonValue.text)
			setLeftSidebarExpanded(storageJsonValue.leftSidebarExpanded)
			if (isDefined(storageJsonValue.tabIndex)) {
				setTabIndex(storageJsonValue.tabIndex)
			}
		}

		return useAppState.subscribe(state => {
			const storageJsonValue: LocalStorageValue = {
				text: state.text,
				leftSidebarExpanded: state.leftSidebarExpanded,
				tabIndex: state.tabIndex,
			}
			window.localStorage.setItem(
				LOCAL_STORAGE_KEY,
				JSON.stringify(storageJsonValue)
			)
		})
	}, [setLeftSidebarExpanded, setTabIndex, setText])
}
