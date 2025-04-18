import { useCallback, useRef } from "react"
import { useEventListener } from "usehooks-ts"
import { keyMatch } from "../lib/utils"
import {
	ArrowUpOutlined,
	ArrowDownOutlined,
	CloseCircleOutlined,
	SearchOutlined,
} from "@ant-design/icons"
import clsx from "clsx"

type FindBarProps = {
	findQuery: string
	setFindQuery: (query: string) => void
	matchInfo:
		| {
				current: number
				total: number
		  }
		| undefined
	/** Dismiss by pressing escape */
	onDismiss(): void
	incrementCurrentMatchIndex(amount: number): void
	className?: string
}

export function FindBar(props: FindBarProps) {
	const {
		findQuery,
		setFindQuery,
		matchInfo,
		onDismiss,
		incrementCurrentMatchIndex,
	} = props

	const inputRef = useRef<HTMLInputElement>(null)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				incrementCurrentMatchIndex(e.shiftKey ? -1 : 1)
			}
		},
		[incrementCurrentMatchIndex]
	)

	useEventListener("keydown", e => {
		if (e.key === "Escape") {
			onDismiss()
		} else if (keyMatch(e, "cmd+f")) {
			inputRef.current?.select()
			inputRef.current?.focus()
		}
	})

	return (
		<div
			className={clsx(
				"flex items-center gap-2 px-2 py-1 border-b text-base",
				props.className
			)}
		>
			<SearchOutlined />
			<input
				ref={inputRef}
				autoFocus
				type="text"
				className="grow text-sm outline-none"
				placeholder="Find in JSON"
				value={findQuery}
				onChange={e => setFindQuery(e.currentTarget.value)}
				onKeyDown={handleKeyDown}
			/>
			<div className="flex items-center gap-2">
				{matchInfo && (
					<>
						<div className="flex items-center gap-1 text-sm">
							<span>
								{matchInfo.total === 0
									? // So we show "0/0"
										"0"
									: matchInfo.current + 1}
								/{matchInfo.total}
							</span>
							<ArrowUpOutlined
								className="cursor-pointer"
								onClick={() => incrementCurrentMatchIndex(-1)}
							/>
							<ArrowDownOutlined
								className="cursor-pointer"
								onClick={() => incrementCurrentMatchIndex(1)}
							/>
						</div>
					</>
				)}
				<CloseCircleOutlined className="cursor-pointer" onClick={onDismiss} />
			</div>
		</div>
	)
}
