import clsx from "clsx"
import React, { ReactNode, useState } from "react"

export interface TabDefinition {
	name: string
	render: (args: { className?: string }) => ReactNode
}

export function Tabs(props: {
	tabs: TabDefinition[]
	defaultActiveIndex?: number
	className?: string
	contentContainerClassName?: string
}) {
	const { tabs, defaultActiveIndex, className, contentContainerClassName } =
		props

	const [activeIndex, setActiveIndex] = useState(defaultActiveIndex ?? 0)

	return (
		<div className={clsx("flex flex-col", className)}>
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
			<div className={contentContainerClassName}>
				{tabs.map((tab, i) => (
					<React.Fragment key={i}>
						{tab.render({
							className: clsx({
								hidden: i !== activeIndex,
							}),
						})}
					</React.Fragment>
				))}
			</div>
		</div>
	)
}
