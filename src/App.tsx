import clsx from "clsx"
import { useText } from "./state"
import { Tabs } from "./system/Tabs"
import { ReactNode, useRef } from "react"

function ViewerTab(props: { className?: string }) {
	const { className } = props

	return <div className={clsx(className)}>Viewer</div>
}

function Button(props: { children: ReactNode; onClick?: () => void }) {
	const { children, onClick } = props
	return (
		<div
			className="text-sm hover:outline px-1 py-0.5 cursor-pointer rounded hover:outline-gray-400 outline-1 outline-transparent transition-all ease-in-out duration-75"
			onClick={onClick}
		>
			{children}
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
			<div className="flex gap-2 px-2 py-1 border-b">
				<Button
					onClick={() => {
						const parsed = useText.getState().parsed
						if (parsed.type === "success") {
							setText(JSON.stringify(parsed.value, null, 2))
							textareaRef.current?.scrollTo(0, 0)
						}
					}}
				>
					Format
				</Button>
				<Button
					onClick={() => {
						const parsed = useText.getState().parsed
						if (parsed.type === "success") {
							setText(JSON.stringify(parsed.value))
							textareaRef.current?.scrollTo(0, 0)
						}
					}}
				>
					Remove whitespace
				</Button>
				<Button
					onClick={() => {
						setText("")
					}}
				>
					Clear
				</Button>
			</div>
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
