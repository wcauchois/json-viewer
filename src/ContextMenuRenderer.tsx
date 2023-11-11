import { useEventListener } from "usehooks-ts"
import { ContextMenuState, useContextMenu } from "./state/contextMenu"

function OpenContextMenu(props: {
	state: Extract<ContextMenuState, { open: true }>
}) {
	const {
		state: { itemGroups, position },
	} = props

	useEventListener("keydown", async e => {
		if (e.key === "Escape") {
			useContextMenu.setState({ open: false })
		}
	})

	return (
		<div
			className="fixed inset-0 z-20"
			onClick={() => {
				useContextMenu.setState({ open: false })
			}}
			onContextMenu={e => e.preventDefault()}
		>
			<div
				className="absolute border text-sm bg-white select-none shadow-md flex flex-col divide-y"
				style={{
					left: position[0],
					top: position[1],
				}}
			>
				{itemGroups.map((group, i) => (
					<div
						key={i}
						className="flex flex-col pb-0.5 pt-0.5 first:pt-0 last:pb-0"
					>
						{group.map((item, j) => (
							<div
								key={j}
								className="flex cursor-pointer hover:bg-blue-300 pr-1 pl-3"
								onClick={() => {
									item.action()
								}}
							>
								{item.name}
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	)
}

export function ContextMenuRenderer() {
	const state = useContextMenu()
	return state.open ? <OpenContextMenu state={state} /> : null
}
