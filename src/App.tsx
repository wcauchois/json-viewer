import { SnackbarRenderer } from "./components/SnackbarRenderer"
import { TextTab } from "./components/TextTab/TextTab"
import { ViewerTab } from "./components/ViewerTab/ViewerTab"
import { ReactNode, useEffect } from "react"
import {
	useAppState,
	useAppStateStorage,
	useToggleRightSidebar,
} from "./state/app"
import { useEventListener } from "usehooks-ts"
import { Panel, PanelGroup } from "react-resizable-panels"
import { ResizeHandle } from "./lib/reactUtils"
import clsx from "clsx"
import { keyMap } from "./lib/utils"
import { ContextMenuRenderer } from "./components/ContextMenuRenderer"
import { copyToClipboard, pasteFromClipboard } from "./lib/appActions"
import { HelpPanel } from "./components/HelpPanel"
import { QuestionCircleOutlined } from "@ant-design/icons"

interface TabDefinition {
	name: string
	render: (args: { className?: string }) => ReactNode
}

function App() {
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		;(window as any).__console = {
			useAppState,
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

	const rightSideBarExpanded = useAppState(state => state.rightSidebarExpanded)
	const toggleRightSidebar = useToggleRightSidebar()

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
				<Panel id="main" order={2}>
					<div className={"flex flex-col w-full h-full"}>
						<div className="flex border-b justify-between">
							<div className="flex border-r divide-x">
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
							<IconWrap>
								<QuestionCircleOutlined
									className="cursor-pointer"
									onClick={toggleRightSidebar}
								/>
							</IconWrap>
						</div>
						<div className="grow overflow-y-scroll">
							{tabs[tabIndex].render({})}
						</div>
					</div>
				</Panel>

				{rightSideBarExpanded && (
					<>
						<ResizeHandle direction="horizontal" />
						<Panel id="help" order={2} style={{ overflowY: "scroll" }}>
							<HelpPanel />
						</Panel>
					</>
				)}
			</PanelGroup>
		</div>
	)
}

function IconWrap(props: { children: ReactNode }) {
	return <div className="flex items-center px-2">{props.children}</div>
}

export default App
