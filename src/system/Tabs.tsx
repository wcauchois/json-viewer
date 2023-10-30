import clsx from "clsx"
import React, { ReactNode, useState } from "react"

export interface TabDefinition {
	name: string
	comp: ReactNode
}

export function Tabs(props: {
	tabs: TabDefinition[]
	defaultActiveIndex?: number
}) {
	const { tabs, defaultActiveIndex } = props

	const [activeIndex, setActiveIndex] = useState(defaultActiveIndex ?? 0)

	return (
		<div className="flex flex-col">
			<div className="flex border-b">
				<div className="flex border-r divide-x">
					{tabs.map((tab, i) => (
						<div
							key={i}
							className={clsx(
								"px-2 py-1 text-sm cursor-pointer",
								i === activeIndex ? "bg-blue-50" : undefined
							)}
							onClick={() => setActiveIndex(i)}
						>
							{tab.name}
						</div>
					))}
				</div>
			</div>
			<div>
				{tabs.map((tab, i) => (
					<React.Fragment key={i}>{tab.comp}</React.Fragment>
				))}
			</div>
		</div>
	)
}
