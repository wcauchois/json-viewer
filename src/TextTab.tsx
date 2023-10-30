import clsx from "clsx"
import { useAppState } from "./appState"
import { useRef } from "react"
import { showSnackbar } from "./snackbar"
import { Button } from "./system/Button"

interface ToolbarItem {
	name: string
	action: () => void
}

function Toolbar(props: { itemGroups: ToolbarItem[][] }) {
	const { itemGroups } = props

	return (
		<div className="flex px-2 py-1 border-b divide-x">
			{itemGroups.map((group, i) => (
				<div className="flex gap-2 px-2 first:pl-0" key={i}>
					{group.map((item, j) => (
						<Button key={j} onClick={item.action}>
							{item.name}
						</Button>
					))}
				</div>
			))}
		</div>
	)
}

export function TextTab(props: { className?: string }) {
	const { className } = props

	const text = useAppState(state => state.text)
	const setText = useAppState(state => state.setText)

	const textareaRef = useRef<HTMLTextAreaElement>(null)

	return (
		<div className={clsx(className, "w-full h-full flex flex-col")}>
			<Toolbar
				itemGroups={[
					[
						{
							name: "Paste",
							action: async () => {
								if (!navigator.clipboard) {
									return
								}
								const clipboardText = await navigator.clipboard.readText()
								setText(clipboardText)
							},
						},
						{
							name: "Copy",
							action: async () => {
								if (!navigator.clipboard) {
									return
								}
								navigator.clipboard.writeText(text)
								showSnackbar("Copied to clipboard!")
							},
						},
					],
					[
						{
							name: "Format",
							action: () => {
								const parseResult = useAppState.getState().parseResult
								if (parseResult.type === "success") {
									setText(JSON.stringify(parseResult.value.object, null, 2))
									textareaRef.current?.scrollTo(0, 0)
								} else {
									showSnackbar("Could not format: JSON does not parse.")
								}
							},
						},
						{
							name: "Remove whitespace",
							action: () => {
								const parseResult = useAppState.getState().parseResult
								if (parseResult.type === "success") {
									setText(JSON.stringify(parseResult.value.object))
									textareaRef.current?.scrollTo(0, 0)
								} else {
									showSnackbar(
										"Could not remove whitespace: JSON does not parse."
									)
								}
							},
						},
					],
					[
						{
							name: "Clear",
							action: () => {
								setText("")
							},
						},
					],
				]}
			/>
			<textarea
				ref={textareaRef}
				placeholder="Paste JSON here"
				className="p-1 text-xs font-mono resize-none grow"
				value={text}
				onChange={e => setText(e.currentTarget.value)}
			/>
		</div>
	)
}
