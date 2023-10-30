import clsx from "clsx"
import { useText } from "./state"
import { Tabs } from "./system/Tabs"
import { useRef } from "react"
import { SnackbarRenderer } from "./SnackbarRenderer"
import { showSnackbar } from "./snackbar"
import { Button } from "./system/Button"

function ViewerTab(props: { className?: string }) {
	const { className } = props

	return <div className={clsx(className)}>Viewer</div>
}

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

function TextTab(props: { className?: string }) {
	const { className } = props

	const text = useText(state => state.text)
	const setText = useText(state => state.setText)

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
								const parsed = useText.getState().parsed
								if (parsed.type === "success") {
									setText(JSON.stringify(parsed.value, null, 2))
									textareaRef.current?.scrollTo(0, 0)
								} else {
									showSnackbar("Could not format: JSON does not parse.")
								}
							},
						},
						{
							name: "Remove whitespace",
							action: () => {
								const parsed = useText.getState().parsed
								if (parsed.type === "success") {
									setText(JSON.stringify(parsed.value))
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
				className="p-1 text-xs font-mono resize-none grow"
				value={text}
				onChange={e => setText(e.currentTarget.value)}
			/>
		</div>
	)
}

function App() {
	return (
		<div className="flex w-screen h-screen">
			<SnackbarRenderer />
			<Tabs
				className="w-full h-full"
				contentContainerClassName="grow"
				defaultActiveIndex={1}
				tabs={[
					{
						name: "Viewer",
						render: args => <ViewerTab {...args} />,
					},
					{
						name: "Text",
						render: args => <TextTab {...args} />,
					},
				]}
			/>
		</div>
	)
}

export default App
