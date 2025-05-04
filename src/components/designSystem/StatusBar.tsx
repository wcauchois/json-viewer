import clsx from "clsx"
import { ReactNode } from "react"

export function StatusBar(props: { children: ReactNode; className?: string }) {
	const { children, className } = props

	return (
		<div
			className={clsx(
				"flex items-center px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 cursor-default",
				className
			)}
			onMouseDown={e => {
				// Prevents the user losing focus when they click on the status bar.
				e.preventDefault()
			}}
		>
			{children}
		</div>
	)
}
