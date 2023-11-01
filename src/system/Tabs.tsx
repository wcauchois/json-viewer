import clsx from "clsx"
import React, { ReactNode, useImperativeHandle, useState } from "react"

export interface TabDefinition {
	name: string
	render: (args: { className?: string }) => ReactNode
}

export interface TabsHandle {
	setIndex(newIndex: number): void
}

export const Tabs = React.forwardRef(
	(
		props: {
			tabs: TabDefinition[]
			defaultIndex?: number
			className?: string
			contentContainerClassName?: string
		},
		ref: React.Ref<TabsHandle>
	) => {
		const { tabs, defaultIndex, className, contentContainerClassName } = props

		const [index, setIndex] = useState(defaultIndex ?? 0)

		useImperativeHandle(ref, () => ({
			setIndex,
		}))

		return (
			<div className={clsx("flex flex-col", className)}>
				<div className="flex border-b">
					<div className="flex border-r divide-x">
						{tabs.map((tab, i) => (
							<div
								key={i}
								className={clsx(
									"px-2 py-1 text-sm cursor-pointer select-none",
									i === index ? "bg-blue-50" : undefined
								)}
								onClick={() => setIndex(i)}
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
									hidden: i !== index,
								}),
							})}
						</React.Fragment>
					))}
				</div>
			</div>
		)
	}
)
