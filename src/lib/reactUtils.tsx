import { PanelResizeHandle } from "react-resizable-panels"
import { intersperseArray } from "./utils"

/** Newline to <br> element. */
export const nl2br = (s: string): JSX.Element => (
	<>
		{intersperseArray(s.split("\n"), () => (
			<br />
		))}
	</>
)

const BORDER_COLOR = "rgb(203, 205, 209)"

export function ResizeHandle(props: { direction: "horizontal" | "vertical" }) {
	const { direction } = props

	const padding = 3

	return (
		<PanelResizeHandle
			style={{
				position: "relative",
			}}
		>
			<div
				style={{
					position: "absolute",
					display: "flex",
					alignItems: "center",
					...(direction === "vertical"
						? {
								top: -padding,
								height: padding * 2 + 1,
								width: "100%",
						  }
						: {
								flexDirection: "column",
								left: -padding,
								width: padding * 2 + 1,
								height: "100%",
						  }),
				}}
			>
				<div
					style={
						direction === "vertical"
							? {
									width: "100%",
									height: 0,
									borderBottom: `1px solid ${BORDER_COLOR}`,
							  }
							: {
									height: "100%",
									width: 0,
									borderRight: `1px solid ${BORDER_COLOR}`,
							  }
					}
				/>
			</div>
		</PanelResizeHandle>
	)
}
