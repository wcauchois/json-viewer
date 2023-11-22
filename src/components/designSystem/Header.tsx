import clsx from "clsx"
import { ReactNode } from "react"

export function Header(props: { children: ReactNode; level: 1 | 2 }) {
	const { children, level } = props
	return (
		<div
			className={clsx(
				"font-bold mb-1.5 mt-1",
				level === 1 && "text-lg",
				level === 2 && "text-base"
			)}
		>
			{children}
		</div>
	)
}
