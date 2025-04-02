import { useAppState } from "../../state/app"
import { useCallback, useEffect, useRef } from "react"
import { IconCloseCircle, IconMagnifyingGlass } from "../../lib/icons"

export function FindBar() {
	const findQuery = useAppState(state => state.findQuery)
	const setFindQuery = useAppState(state => state.setFindQuery)
	const findActive = useAppState(state => state.findActive)
	const setFindActive = useAppState(state => state.setFindActive)
	const findMatchCount = useAppState(state => state.findMatchCount)
	const findCurrentMatchIndex = useAppState(
		state => state.findCurrentMatchIndex
	)
	const setFindCurrentMatchIndex = useAppState(
		state => state.setFindCurrentMatchIndex
	)
	const setFindMatchCount = useAppState(state => state.setFindMatchCount)

	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (findActive) {
			inputRef.current?.focus()
		}
	}, [findActive])

	useEffect(() => {
		setFindMatchCount(0)
		setFindCurrentMatchIndex(0)
	}, [findQuery, setFindMatchCount, setFindCurrentMatchIndex])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				setFindActive(false)
			} else if (e.key === "Enter") {
				if (e.shiftKey) {
					setFindCurrentMatchIndex(
						findCurrentMatchIndex > 0
							? findCurrentMatchIndex - 1
							: findMatchCount
					)
				} else {
					setFindCurrentMatchIndex(
						findCurrentMatchIndex < findMatchCount
							? findCurrentMatchIndex + 1
							: 1
					)
				}
			}
		},
		[
			findActive,
			findCurrentMatchIndex,
			findMatchCount,
			setFindActive,
			setFindCurrentMatchIndex,
		]
	)

	if (!findActive) {
		return null
	}

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
			{findQuery && (
				<>
					<span className="text-sm text-gray-500">
						{findCurrentMatchIndex}/{findMatchCount}
					</span>
					<IconCloseCircle
						className="cursor-pointer"
						onClick={() => {
							setFindQuery("")
							setFindActive(false)
						}}
					/>
				</>
			)}
		</div>
	)
}
