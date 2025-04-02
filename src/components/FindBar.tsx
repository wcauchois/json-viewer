import { useCallback, useRef } from "react"
import { IconCloseCircle, IconMagnifyingGlass } from "../lib/icons"
import { useEventListener } from "usehooks-ts"
import { keyMatch } from "../lib/utils"
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons"

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
		<div className="flex items-center gap-2 px-2 py-1 border-b">
			<IconMagnifyingGlass className="fill-gray-500" />
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
			{matchInfo && (
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-500">
						{matchInfo.total === 0
							? // So we show "0/0"
								"0"
							: matchInfo.current + 1}
						/{matchInfo.total}
					</span>
					<div className="flex items-center gap-1">
						<ArrowUpOutlined
							className="cursor-pointer text-gray-500 hover:text-gray-700"
							onClick={() => incrementCurrentMatchIndex(-1)}
						/>
						<ArrowDownOutlined
							className="cursor-pointer text-gray-500 hover:text-gray-700"
							onClick={() => incrementCurrentMatchIndex(1)}
						/>
						<IconCloseCircle className="cursor-pointer" onClick={onDismiss} />
					</div>
				</div>
			)}
		</div>
	)
}
