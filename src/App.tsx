import { Tabs } from "./system/Tabs"
import { SnackbarRenderer } from "./SnackbarRenderer"
import { TextTab } from "./TextTab"
import { ViewerTab } from "./ViewerTab"

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
