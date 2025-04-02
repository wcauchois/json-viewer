import { useCallback, useEffect, useRef } from "react"
import { IconCloseCircle, IconMagnifyingGlass } from "../../lib/icons"

interface FindBarProps {
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

	// useEffect(() => {
	// 	if (findActive) {
	// 		inputRef.current?.focus()
	// 	}
	// }, [findActive])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				onDismiss()
			} else if (e.key === "Enter") {
				if (e.shiftKey) {
					incrementCurrentMatchIndex(1)
				} else {
					incrementCurrentMatchIndex(-1)
				}
			}
		},
		[incrementCurrentMatchIndex, onDismiss]
	)

	return (
		<div className="flex items-center gap-2 px-2 py-1 border-b">
			<IconMagnifyingGlass className="fill-gray-500" />
			<input
				ref={inputRef}
				type="text"
				className="grow text-sm outline-none"
				placeholder="Find in JSON"
				value={findQuery}
				onChange={e => setFindQuery(e.currentTarget.value)}
				onKeyDown={handleKeyDown}
			/>
			{matchInfo && (
				<>
					<span className="text-sm text-gray-500">
						{matchInfo.current}/{matchInfo.total}
					</span>
					<IconCloseCircle className="cursor-pointer" onClick={onDismiss} />
				</>
			)}
		</div>
	)
}
