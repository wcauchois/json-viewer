import { ReactNode } from "react"
import { IconCloseCircle } from "../icons"
import clsx from "clsx"

export function Modal(props: {
	children: ReactNode
	className?: string
	onClose?: () => void
}) {
	const { children, className, onClose } = props
	return (
		<>
			<div
				className="fixed inset-0 flex items-center justify-center z-20"
				onClick={() => {
					onClose?.()
				}}
			>
				<div
					className={clsx(
						"bg-white border rounded border-gray-500 flex flex-col shadow",
						className
					)}
					onClick={e => {
						e.stopPropagation()
					}}
				>
					<div className="flex justify-end p-2 border-b border-solid">
						<IconCloseCircle
							className="cursor-pointer"
							onClick={() => {
								onClose?.()
							}}
						/>
					</div>
					<div className="p-2">{children}</div>
				</div>
			</div>
			<div className="fixed inset-0 bg-black opacity-5 z-10" />
		</>
	)
}
