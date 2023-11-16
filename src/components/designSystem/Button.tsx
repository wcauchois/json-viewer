import { ReactNode } from "react"

export function Button(props: { children: ReactNode; onClick?: () => void }) {
	const { children, onClick } = props
	return (
		<div
			className="text-sm hover:outline px-1 py-0.5 cursor-pointer rounded hover:outline-gray-400 outline-1 outline-transparent transition-all ease-in-out duration-75 select-none"
			onClick={onClick}
		>
			{children}
		</div>
	)
}
