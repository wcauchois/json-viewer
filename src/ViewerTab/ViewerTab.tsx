import clsx from "clsx"
import { AppState, useAppState } from "../state/app"
import { isDefined, keyMatch } from "../utils"
import { useRef } from "react"
import { useEventListener } from "usehooks-ts"
import {
	FocusableNodeClass,
	NodeRenderer,
	NodeRendererHandle,
} from "./NodeRenderer"

const emptyFunction = () => {}

function ViewerTabSuccessfulParse(props: {
	parseResult: Extract<AppState["parseResult"], { type: "success" }>
}) {
	const { parseResult } = props

	const containerRef = useRef<HTMLDivElement>(null)
	const rootNodeRendererRef = useRef<NodeRendererHandle>(null)

	useEventListener("keydown", async e => {
		if (e.target === document.body) {
			if (["h", "j", "k", "l", "Enter"].includes(e.key)) {
				rootNodeRendererRef.current?.focus()
			}
		}
	})

	return (
		<div
			className="flex flex-col text-sm"
			ref={containerRef}
			onKeyDown={e => {
				if (!containerRef.current) {
					return
				}

				let moveDirection: "previous" | "next" | undefined
				if (keyMatch(e, "ArrowUp,k")) {
					moveDirection = "previous"
				} else if (keyMatch(e, "ArrowDown,j")) {
					moveDirection = "next"
				}

				if (isDefined(moveDirection)) {
					const focusedNode = containerRef.current.querySelector(
						`.${FocusableNodeClass}:focus`
					)
					if (focusedNode) {
						const desiredSibling =
							moveDirection === "next"
								? focusedNode.nextElementSibling
								: focusedNode.previousElementSibling
						if (desiredSibling && desiredSibling instanceof HTMLElement) {
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
				}
			}}
		>
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
