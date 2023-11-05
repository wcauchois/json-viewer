import { SnackbarRenderer } from "./SnackbarRenderer"
import { TextTab } from "./TextTab"
import { ViewerTab } from "./ViewerTab"
import { ReactNode, useCallback, useEffect, useState } from "react"
import { useAppState, useAppStateStorage } from "./appState"
import { useEventListener } from "usehooks-ts"
import { showSnackbar } from "./snackbar"
import { Panel, PanelGroup } from "react-resizable-panels"
import { ResizeHandle } from "./reactUtils"
import { CheckpointPanel } from "./CheckpointPanel"
import { checkpointStore } from "./CheckpointStore"
import clsx from "clsx"
import React from "react"
import { IconSidebarCollapse, IconSidebarExpand } from "./icons"

interface TabDefinition {
	name: string
	render: (args: { className?: string }) => ReactNode
}

function App() {
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(window as any).__console = {
			useAppState,
			checkpointStore,
		}
	}, [])

	useAppStateStorage()

	const [tabIndex, setTabIndex] = useState(1)

	const tabs: TabDefinition[] = [
		{
			name: "Viewer",
			render: args => <ViewerTab {...args} />,
		},
		{
			name: "Text",
			render: args => <TextTab {...args} />,
		},
	]

	const setText = useAppState(state => state.setText)
	const text = useAppState(state => state.text)

	const leftSideBarExpanded = useAppState(state => state.leftSidebarExpanded)
	const setLeftSideBarExpanded = useAppState(
		state => state.setLeftSidebarExpanded
	)
	const toggleLeftSidebar = useCallback(() => {
		setLeftSideBarExpanded(!leftSideBarExpanded)
	}, [leftSideBarExpanded, setLeftSideBarExpanded])

	useEventListener("keydown", async e => {
		if (e.target === document.body) {
			if (e.key === "v") {
				setTabIndex(0)
			} else if (e.key === "t") {
				setTabIndex(1)
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

			<PanelGroup direction="horizontal" autoSaveId="main-panel-group">
				{leftSideBarExpanded && (
					<>
						<Panel id="checkpoints" order={1}>
							<CheckpointPanel />
						</Panel>
						<ResizeHandle direction="horizontal" />
					</>
				)}
				<Panel id="main" order={2}>
					<div className={"flex flex-col w-full h-full"}>
						<div className="flex border-b">
							<div className="flex border-r divide-x">
								<div className="flex items-center px-2">
									{leftSideBarExpanded ? (
										<IconSidebarExpand
											className="cursor-pointer"
											onClick={toggleLeftSidebar}
										/>
									) : (
										<IconSidebarCollapse
											className="cursor-pointer"
											onClick={toggleLeftSidebar}
										/>
									)}
								</div>
								{tabs.map((tab, i) => (
									<div
										key={i}
										className={clsx(
											"px-2 py-1 text-sm cursor-pointer select-none",
											i === tabIndex ? "bg-blue-50" : undefined
										)}
										onClick={() => setTabIndex(i)}
									>
										{tab.name}
									</div>
								))}
							</div>
						</div>
						<div className="grow">
							{tabs.map((tab, i) => (
								<React.Fragment key={i}>
									{tab.render({
										className: clsx({
											hidden: i !== tabIndex,
										}),
									})}
								</React.Fragment>
							))}
						</div>
					</div>
				</Panel>
			</PanelGroup>
		</div>
	)
}

export default App
