import { ReactNode } from "react"
import { IconCloseCircle } from "../icons"
import clsx from "clsx"

export function Modal(props: {
	children: ReactNode
	className?: string
	onClose?: () => void
	onKeyDown?: React.KeyboardEventHandler
}) {
	const { children, className, onClose, onKeyDown } = props
	return (
		<>
			<div
				className="fixed inset-0 flex items-center justify-center z-20"
				onClick={() => {
					onClose?.()
				}}
			>
				<div
					tabIndex={0}
					className={clsx(
						"bg-white border rounded border-gray-500 flex flex-col shadow outline-none",
						className
					)}
					onClick={e => {
						// Prevent click from going to the overlay
						e.stopPropagation()
					}}
					ref={el => el?.focus()}
					onKeyDown={e => {
						e.stopPropagation()
						if (e.key === "Escape") {
							onClose?.()
						}
						onKeyDown?.(e)
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
					<div className="p-2 overflow-y-scroll">{children}</div>
				</div>
			</div>
			<div className="fixed inset-0 bg-black opacity-5 z-10" />
		</>
	)
}
