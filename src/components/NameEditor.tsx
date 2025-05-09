import { CheckOutlined, CloseOutlined, EditOutlined } from "@ant-design/icons"
import { useState } from "react"
import { useAppState } from "../state/app"
import { useAddName, useNameForContent } from "../state/nameStore"

export function NameEditor() {
	const [isEditingName, setIsEditingName] = useState(false)

	const text = useAppState(state => state.text)
	const name = useNameForContent(text)

	if (!text) {
		return
	}

	return (
		<div className="flex-1 flex items-center justify-center">
			<div className="flex items-center gap-1">
				{isEditingName ? (
					<EditingState onDone={() => setIsEditingName(false)} />
				) : (
					<>
						<span className="text-sm font-medium text-gray-700">
							{name ?? "Untitled JSON"}
						</span>
						<EditOutlined
							className="cursor-pointer text-gray-500 hover:text-gray-700"
							onClick={() => {
								setIsEditingName(true)
							}}
						/>
					</>
				)}
			</div>
		</div>
	)
}

function EditingState(props: { onDone: () => void }) {
	const { onDone } = props

	const [tempName, setTempName] = useState("")

	const text = useAppState(state => state.text)
	const addName = useAddName()

	const handleNameCancel = () => {
		onDone()
	}

	const handleNameConfirm = () => {
		addName(text, tempName)
		onDone()
	}

	return (
		<>
			<input
				type="text"
				value={tempName}
				onChange={e => setTempName(e.target.value)}
				onKeyDown={e => {
					if (e.key === "Escape") {
						handleNameCancel()
					} else if (e.key === "Enter") {
						handleNameConfirm()
					}
				}}
				className="px-1 py-0.5 text-sm border rounded"
				autoFocus
			/>
			<CheckOutlined
				className="cursor-pointer text-green-600"
				onClick={handleNameConfirm}
			/>
			<CloseOutlined
				className="cursor-pointer text-red-600"
				onClick={handleNameCancel}
			/>
		</>
	)
}
