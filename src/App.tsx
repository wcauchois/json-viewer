import { Tabs } from "./system/Tabs"

function App() {
	return (
		<div className="flex flex-col">
			<Tabs
				tabs={[
					{
						name: "Viewer",
						comp: <div>Viewer</div>,
					},
					{
						name: "Text",
						comp: <div>Text</div>,
					},
				]}
			/>
		</div>
	)
}

export default App
