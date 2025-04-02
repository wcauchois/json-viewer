import clsx from "clsx"
import { SuccessfulParseResult, useAppState } from "../../state/app"
import {
	assertDefined,
	isDefined,
	keyMap,
	keyMatch,
	unreachable,
} from "../../lib/utils"
import { useCallback, useMemo, useReducer, useRef, useState } from "react"
import { useEventListener } from "usehooks-ts"
import {
	FocusableNodeClass,
	NodeRenderer,
	NodeRendererHandle,
} from "./NodeRenderer"
import _ from "lodash"
import { sharedAppViewerTabShortcuts } from "../../lib/appActions"
import { FindBar } from "../designSystem/FindBar"
import { ASTNode, isNodeWithChildren, visitAST } from "../../lib/jsonAst"

const emptyFunction = () => {}

const MULTIPLIER_DEBOUNCE_MS = 500

type FindState = {
	query: string
	/** Will be undefined if the query is empty. */
	currentMatchIndex: number | undefined
}

type FindStateAction =
	| {
			type: "setQuery"
			newQuery: string
	  }
	| {
			type: "setCurrentMatchIndex"
			newCurrentMatchIndex: number | undefined
	  }
	| {
			type: "show"
	  }
	| {
			type: "hide"
	  }

function useFindState() {
	return useReducer(
		(
			state: FindState | undefined,
			action: FindStateAction
		): FindState | undefined => {
			if (action.type === "show") {
				return {
					query: "",
					currentMatchIndex: undefined,
				}
			} else if (action.type === "hide") {
				return
			} else if (action.type === "setQuery") {
				assertDefined(state)
				return {
					...state,
					query: action.newQuery,
					currentMatchIndex:
						action.newQuery.length > 0
							? (state.currentMatchIndex ?? 0)
							: undefined,
				}
			} else if (action.type === "setCurrentMatchIndex") {
				assertDefined(state)
				return { ...state, currentMatchIndex: action.newCurrentMatchIndex }
			} else {
				unreachable(action)
			}
		},
		undefined
	)
}

function astNodeContainsString(node: ASTNode, str: string) {
	if (isNodeWithChildren(node)) {
		return false
	} else if (node.type === "string") {
		return node.value.includes(str)
	} else if (node.type === "number") {
		return node.value.toString().includes(str)
	} else if (node.type === "boolean") {
		return node.value.toString().includes(str)
	} else if (node.type === "null") {
		return "null".includes(str)
	}
}

function useFoundNodes(
	findState: FindState | undefined,
	parseResult: SuccessfulParseResult
) {
	return useMemo(() => {
		if (!findState || findState.query.length === 0) {
			return []
		} else {
			const foundNodes: ASTNode[] = []
			visitAST(parseResult.value.ast, node => {
				if (astNodeContainsString(node, findState.query)) {
					foundNodes.push(node)
				}
			})
			return foundNodes
		}
	}, [findState, parseResult])
}

function ViewerTabSuccessfulParse(props: {
	parseResult: SuccessfulParseResult
}) {
	const { parseResult } = props

	const containerRef = useRef<HTMLDivElement>(null)
	const rootNodeRendererRef = useRef<NodeRendererHandle>(null)

	const [findState, dispatchFindState] = useFindState()
	const foundNodes = useFoundNodes(findState, parseResult)

	useEventListener("keydown", async e => {
		if (e.target === document.body) {
			if (["h", "j", "k", "l", "Enter"].includes(e.key)) {
				rootNodeRendererRef.current?.focus()
			}
		}

		// Find.
		if (e.metaKey && e.key === "f") {
			e.preventDefault()
			dispatchFindState({ type: "show" })
		}
	})

	const [motionMultiplier, setMotionMultiplier] = useState<number | undefined>()
	const clearMotionMultiplierTimeoutRef = useRef<number>(0)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!containerRef.current) {
				return
			}

			if (
				_.range(1, 10)
					.map(x => x.toString())
					.includes(e.key)
			) {
				const keyAsNumber = Number(e.key)
				setMotionMultiplier(keyAsNumber)
				clearTimeout(clearMotionMultiplierTimeoutRef.current)
				clearMotionMultiplierTimeoutRef.current = setTimeout(() => {
					setMotionMultiplier(undefined)
				}, MULTIPLIER_DEBOUNCE_MS)
			} else {
				let moveDirection: "previous" | "next" | undefined
				if (keyMatch(e, "ArrowUp,k")) {
					moveDirection = "previous"
				} else if (keyMatch(e, "ArrowDown,j")) {
					moveDirection = "next"
				}

				if (isDefined(moveDirection)) {
					const multiplier = motionMultiplier ?? 1
					if (isDefined(motionMultiplier)) {
						setMotionMultiplier(undefined)
					}

					const focusedNode = containerRef.current.querySelector(
						`.${FocusableNodeClass}:focus`
					)
					if (focusedNode) {
						let desiredSibling = focusedNode
						for (let i = 0; i < multiplier; i++) {
							const nextSibling =
								moveDirection === "next"
									? desiredSibling.nextElementSibling
									: desiredSibling.previousElementSibling
							if (nextSibling) {
								desiredSibling = nextSibling
							} else {
								break
							}
						}
						if (
							desiredSibling &&
							desiredSibling !== focusedNode &&
							desiredSibling instanceof HTMLElement
						) {
							desiredSibling.focus()
						}
					}
				} else if (e.key === "Escape") {
					if (
						document.activeElement &&
						document.activeElement instanceof HTMLElement
					) {
						document.activeElement.blur()
					}
				} else {
					// Exclude find bar from other shortcuts.
					if (!(e.target instanceof HTMLInputElement)) {
						void keyMap(e, sharedAppViewerTabShortcuts)
					}
				}
			}
		},
		[motionMultiplier]
	)

	return (
		<div
			className="flex flex-col text-sm"
			ref={containerRef}
			onKeyDown={handleKeyDown}
		>
			{findState && (
				<FindBar
					onDismiss={() => dispatchFindState({ type: "hide" })}
					findQuery={findState.query}
					matchInfo={
						isDefined(findState.currentMatchIndex)
							? {
									current: findState.currentMatchIndex,
									total: foundNodes.length,
								}
							: undefined
					}
					setFindQuery={newQuery => {
						dispatchFindState({
							type: "setQuery",
							newQuery,
						})
					}}
					incrementCurrentMatchIndex={amount => {
						if (isDefined(findState.currentMatchIndex)) {
							const newIndexUnwrapped = findState.currentMatchIndex + amount
							dispatchFindState({
								type: "setCurrentMatchIndex",
								newCurrentMatchIndex:
									newIndexUnwrapped < 0
										? foundNodes.length - 1 // Wraparound
										: newIndexUnwrapped % foundNodes.length,
							})
						}
					}}
				/>
			)}
			<NodeRenderer
				ref={rootNodeRendererRef}
				node={parseResult.value.ast}
				isRoot={true}
				collapseAndFocusParent={emptyFunction}
				findInfo={
					findState
						? {
								foundNodes,
								currentFoundNode: isDefined(findState.currentMatchIndex)
									? foundNodes[findState.currentMatchIndex]
									: undefined,
							}
						: undefined
				}
			/>
		</div>
	)
}

export function ViewerTab(props: { className?: string }) {
	const { className } = props

	const parseResult = useAppState(state => state.parseResult)

	return (
		<div className={clsx(className)}>
			{parseResult.type === "success" ? (
				<ViewerTabSuccessfulParse parseResult={parseResult} />
			) : (
				<div className="text-sm text-red-700 p-1">Failed to parse</div>
			)}
		</div>
	)
}
