import { Tabs, TabsHandle } from "./system/Tabs"
import { SnackbarRenderer } from "./SnackbarRenderer"
import { TextTab } from "./TextTab"
import { ViewerTab } from "./ViewerTab"
import { useEffect, useRef } from "react"
import { useAppState } from "./appState"
import { useEventListener } from "usehooks-ts"
import { showSnackbar } from "./snackbar"
import { Panel, PanelGroup } from "react-resizable-panels"
import { ResizeHandle } from "./reactUtils"

function App() {
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(window as any).__console = {
			useAppState,
		}
	}, [])

	const tabsRef = useRef<TabsHandle>(null)
	const setText = useAppState(state => state.setText)
	const text = useAppState(state => state.text)

	useEventListener("keydown", async e => {
		if (e.target === document.body) {
			if (e.key === "v") {
				tabsRef.current?.setIndex(0)
			} else if (e.key === "t") {
				tabsRef.current?.setIndex(1)
			} else if (e.key === "p") {
				const clipboardText = await navigator.clipboard?.readText()
				setText(clipboardText ?? "")
				showSnackbar("Pasted from clipboard.")
			} else if (e.key === "c") {
				navigator.clipboard?.writeText(text)
				showSnackbar("Copied to clipboard!")
			}
		}
	})

	return (
		<div className="flex w-screen h-screen">
			<SnackbarRenderer />

			<PanelGroup direction="horizontal">
				<Panel>
					<div>Hello, world</div>
				</Panel>
				<ResizeHandle direction="horizontal" />
				<Panel>
					<Tabs
						ref={tabsRef}
						className="w-full h-full"
						contentContainerClassName="grow"
						defaultIndex={1}
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
				</Panel>
			</PanelGroup>
		</div>
	)
}

export default App
