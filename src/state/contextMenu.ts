import { create } from "zustand"

export interface ContextMenuItem {
	name: string
	action: () => void
}

export type ContextMenuState =
	| {
			open: true
			itemGroups: ContextMenuItem[][]
			position: [number, number]
	  }
	| { open: false }

export const useContextMenu = create<ContextMenuState>(() => ({
	open: false,
}))

export function openContextMenu(args: {
	itemGroups: ContextMenuItem[][]
	position: [number, number]
}) {
	useContextMenu.setState({
		open: true,
		...args,
	})
}
