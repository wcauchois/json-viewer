import { Button } from "./Button"

export interface ToolbarItem {
	name: string
	action: () => void
}

export function Toolbar(props: { itemGroups: ToolbarItem[][] }) {
	const { itemGroups } = props

	return (
		<div className="flex px-2 py-1 border-b divide-x">
			{itemGroups.map((group, i) => (
				<div className="flex gap-2 px-2 first:pl-0" key={i}>
					{group.map((item, j) => (
						<Button key={j} onClick={item.action}>
							{item.name}
						</Button>
					))}
				</div>
			))}
		</div>
	)
}
