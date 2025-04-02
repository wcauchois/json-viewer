import clsx from "clsx"
import { AppState, useAppState } from "../../state/app"
import { isDefined, keyMap, keyMatch } from "../../lib/utils"
import { useCallback, useRef, useState } from "react"
import { useEventListener } from "usehooks-ts"
import {
	FocusableNodeClass,
	NodeRenderer,
	NodeRendererHandle,
} from "./NodeRenderer"
import _ from "lodash"
import { sharedAppViewerTabShortcuts } from "../../lib/appActions"
import { FindBar } from "../designSystem/FindBar"

const emptyFunction = () => {}

const MULTIPLIER_DEBOUNCE_MS = 500

function ViewerTabSuccessfulParse(props: {
	parseResult: Extract<AppState["parseResult"], { type: "success" }>
}) {
	const { parseResult } = props

	const containerRef = useRef<HTMLDivElement>(null)
	const rootNodeRendererRef = useRef<NodeRendererHandle>(null)

	const [findActive, setFindActive] = useState(false)

	useEventListener("keydown", async e => {
		if (e.target === document.body) {
			if (["h", "j", "k", "l", "Enter"].includes(e.key)) {
				rootNodeRendererRef.current?.focus()
			}
		}

		// Find.
		if (e.metaKey && e.key === "f") {
			e.preventDefault()
			setFindActive(true)
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
					void keyMap(e, sharedAppViewerTabShortcuts)
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
			<FindBar />
			<NodeRenderer
				ref={rootNodeRendererRef}
				node={parseResult.value.ast}
				isRoot={true}
				collapseAndFocusParent={emptyFunction}
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
