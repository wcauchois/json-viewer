import { useCallback, useState } from "react"
import { useEventListener } from "usehooks-ts"
import { ASTNode } from "./jsonAst"
import {
	useFindASTNodeForElement,
	useSubscribeToElementToASTNode,
} from "../state/elementToAstNode"

export function useFocusedNode() {
	const [state, setState] = useState<
		| {
				focusedNode: ASTNode | undefined
				focusedElement: HTMLElement | undefined
		  }
		| undefined
	>()

	const findASTNodeForElement = useFindASTNodeForElement()

	useEventListener(
		"focus",
		evt => {
			if (evt.target instanceof HTMLElement) {
				setState({
					focusedNode: findASTNodeForElement(evt.target),
					focusedElement: evt.target,
				})
			} else {
				setState(undefined)
			}
		},
		undefined,
		{
			// https://hidde.blog/console-logging-the-focused-element-as-it-changes/
			capture: true,
		}
	)

	useEventListener(
		"blur",
		() => {
			setState(undefined)
		},
		undefined,
		{
			capture: true,
		}
	)

	// When the set of registered nodes changes, ensure that the focused node
	// is still in that set (prevents us from keeping around old state.)
	useSubscribeToElementToASTNode(
		useCallback(
			({ findASTNodeForElement }) => {
				if (!state?.focusedElement) {
					return
				}
				const foundNode = findASTNodeForElement(state.focusedElement)
				if (!foundNode) {
					setState(undefined)
				}
			},
			[state?.focusedElement]
		)
	)

	return state?.focusedNode
}
