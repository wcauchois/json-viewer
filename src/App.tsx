import { SnackbarRenderer } from "./components/SnackbarRenderer"
import { TextTab } from "./components/TextTab/TextTab"
import { ViewerTab } from "./components/ViewerTab/ViewerTab"
import { ReactNode, useCallback, useEffect } from "react"
import { useAppState, useAppStateStorage } from "./state/app"
import { useEventListener } from "usehooks-ts"
import { Panel, PanelGroup } from "react-resizable-panels"
import { ResizeHandle } from "./lib/reactUtils"
import { CheckpointPanel } from "./components/CheckpointPanel"
import { checkpointStore } from "./lib/CheckpointStore"
import clsx from "clsx"
import { IconSidebarCollapse, IconSidebarExpand } from "./lib/icons"
import { keyMap } from "./lib/utils"
import { ContextMenuRenderer } from "./components/ContextMenuRenderer"
import { copyToClipboard, pasteFromClipboard } from "./lib/appActions"
import { callWorkerApi, worker } from "./worker/workerClient"

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
			worker,
			callWorkerApi,
		}
	}, [])

	useAppStateStorage()

	const tabIndex = useAppState(state => state.tabIndex)
	const setTabIndex = useAppState(state => state.setTabIndex)

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

	const leftSideBarExpanded = useAppState(state => state.leftSidebarExpanded)
	const setLeftSideBarExpanded = useAppState(
		state => state.setLeftSidebarExpanded
	)
	const toggleLeftSidebar = useCallback(() => {
		setLeftSideBarExpanded(!leftSideBarExpanded)
	}, [leftSideBarExpanded, setLeftSideBarExpanded])

	useEventListener("keydown", async e => {
		if (e.target === document.body) {
			await keyMap(e, {
				v: () => setTabIndex(0),
				t: () => setTabIndex(1),
				p: () => pasteFromClipboard(),
				c: () => copyToClipboard(),
			})
		}
	})

	return (
		<div className="flex w-screen h-screen">
			<SnackbarRenderer />
			<ContextMenuRenderer />

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
						<div className="grow overflow-y-scroll">
							{tabs[tabIndex].render({})}
						</div>
					</div>
				</Panel>
			</PanelGroup>
		</div>
	)
}

export default App
