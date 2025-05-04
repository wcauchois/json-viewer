import { useCallback, useEffect } from "react"
import { ASTNode } from "../lib/jsonAst"
import { create } from "zustand"
import { Map } from "immutable"

interface ElementToASTNodeState {
	map: Map<HTMLElement, ASTNode>
	register(element: HTMLElement, node: ASTNode): void
	unregister(element: HTMLElement): void
}

const useElementToASTNode = create<ElementToASTNodeState>(set => ({
	map: Map(),
	register(element, node) {
		set(state => ({ map: state.map.set(element, node) }))
	},
	unregister(element) {
		set(state => ({ map: state.map.delete(element) }))
	},
}))

export function useRegisterElementForASTNode(
	ref: React.RefObject<HTMLElement>,
	node: ASTNode
) {
	const register = useElementToASTNode(state => state.register)
	const unregister = useElementToASTNode(state => state.unregister)

	useEffect(() => {
		const current = ref.current
		if (current) {
			register(current, node)
		}
		return () => {
			if (current) {
				unregister(current)
			}
		}
	}, [node, ref, register, unregister])
}

type findASTNodeForElementFn = (element: HTMLElement) => ASTNode | undefined

export function useFindASTNodeForElement(): findASTNodeForElementFn {
	const map = useElementToASTNode(state => state.map)
	return useCallback(element => map.get(element), [map])
}

export function useSubscribeToElementToASTNode(
	listener: (args: { findASTNodeForElement: findASTNodeForElementFn }) => void
) {
	useEffect(() => {
		return useElementToASTNode.subscribe(state => {
			listener({
				findASTNodeForElement: element => state.map.get(element),
			})
		})
	}, [listener])
}
