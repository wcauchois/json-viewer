import clsx from "clsx"
import { SuccessfulParseResult, useAppState } from "../../state/app"
import {
	assertDefined,
	isDefined,
	keyMap,
	keyMatch,
	unreachable,
} from "../../lib/utils"
import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react"
import { useEventListener } from "usehooks-ts"
import {
	FocusableNodeClass,
	NodeRenderer,
	NodeRendererHandle,
} from "./NodeRenderer"
import _ from "lodash"
import { sharedAppViewerTabShortcuts } from "../../lib/appActions"
import { FindBar } from "../FindBar"
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
				return (
					state ?? {
						query: "",
						currentMatchIndex: undefined,
					}
				)
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
				return {
					...state,
					currentMatchIndex: isDefined(action.newCurrentMatchIndex)
						? Math.max(0, action.newCurrentMatchIndex)
						: undefined,
				}
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

function useFoundNodesWithAncestors(
	findState: FindState | undefined,
	parseResult: SuccessfulParseResult
) {
	return useMemo(() => {
		if (!findState || findState.query.length === 0) {
			return []
		} else {
			const result: Array<[node: ASTNode, ancestors: ASTNode[]]> = []
			visitAST(parseResult.value.ast, (node, ancestors, path) => {
				if (
					astNodeContainsString(node, findState.query) ||
					(path.length > 0 &&
						path[0].includes(findState.query) &&
						// Don't match on key if we're dealing with an array (key will be a number.)
						(ancestors.length === 0 || ancestors[0].type !== "array"))
				) {
					result.push([node, ancestors])
				}
			})
			return result
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
	const foundNodesWithAncestors = useFoundNodesWithAncestors(
		findState,
		parseResult
	)

	useEventListener("keydown", async e => {
		if (e.target === document.body) {
			if (["h", "j", "k", "l", "Enter"].includes(e.key)) {
				rootNodeRendererRef.current?.focus()
			}
		}

		// Find.
		if (keyMatch(e, "cmd+f") || keyMatch(e, "/")) {
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

	// Ensure that the find-selected node is expanded.
	const setNodesExpanded = useAppState(state => state.setNodesExpanded)
	useEffect(() => {
		if (
			foundNodesWithAncestors.length > 0 &&
			isDefined(findState?.currentMatchIndex) &&
			findState.currentMatchIndex < foundNodesWithAncestors.length
		) {
			const [node, ancestors] =
				foundNodesWithAncestors[findState.currentMatchIndex]
			setNodesExpanded([node, ...ancestors], true)
		}
	}, [foundNodesWithAncestors, findState?.currentMatchIndex, setNodesExpanded])

	// Ensure that currentMatchIndex is within bounds.
	useEffect(() => {
		if (
			isDefined(findState?.currentMatchIndex) &&
			findState.currentMatchIndex >= foundNodesWithAncestors.length
		) {
			dispatchFindState({
				type: "setCurrentMatchIndex",
				newCurrentMatchIndex: foundNodesWithAncestors.length - 1,
			})
		}
	}, [dispatchFindState, findState?.currentMatchIndex, foundNodesWithAncestors])

	return (
		<div
			className="flex flex-col text-sm relative"
			ref={containerRef}
			onKeyDown={handleKeyDown}
		>
			{findState && (
				<FindBar
					className="sticky top-0 bg-white z-10"
					onDismiss={() => {
						dispatchFindState({ type: "hide" })
						if (foundNodesWithAncestors.length > 0) {
							rootNodeRendererRef.current?.focusNode(
								foundNodesWithAncestors[findState?.currentMatchIndex ?? 0][0]
							)
						}
					}}
					findQuery={findState.query}
					matchInfo={
						isDefined(findState.currentMatchIndex)
							? {
									current: findState.currentMatchIndex,
									total: foundNodesWithAncestors.length,
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
										? foundNodesWithAncestors.length - 1 // Wraparound
										: newIndexUnwrapped % foundNodesWithAncestors.length,
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
								foundNodes: foundNodesWithAncestors.map(([n]) => n),
								currentFoundNode: isDefined(findState.currentMatchIndex)
									? foundNodesWithAncestors[findState.currentMatchIndex]?.[0]
									: undefined,
							}
						: undefined
				}
			/>
		</div>
	)
}

function ViewerTabFailedParse() {
	useEventListener("keydown", async e => {
		if (keyMatch(e, "cmd+f")) {
			// Still preventDefault on cmd+F so that we don't only
			// intercept it in successful parse.
			e.preventDefault()
		}
	})

	return <div className="text-sm text-red-700 p-1">Failed to parse</div>
}

export function ViewerTab(props: { className?: string }) {
	const { className } = props

	const parseResult = useAppState(state => state.parseResult)

	return (
		<div className={clsx(className)}>
			{parseResult.type === "success" ? (
				<ViewerTabSuccessfulParse parseResult={parseResult} />
			) : (
				<ViewerTabFailedParse />
			)}
		</div>
	)
}
