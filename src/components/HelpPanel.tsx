import clsx from "clsx"
import React from "react"
import { intersperseArray } from "../lib/utils"

const ENTER = "↵"
const SHIFT = "⇧"

export function HelpPanel() {
	return (
		<div className="flex flex-col px-2 py-1">
			<div className="font-bold">Help</div>
			<div className="flex flex-col text-sm">
				<KeyboardShortcuts
					spec={[
						{
							groupTitle: "Window focus",
							keys: [
								["c", `Copy JSON object to clipboard`],
								["p", `Paste JSON object from clipboard`],
								["v", `Switch to ‘Viewer’ tab`],
								["t", `Switch to ‘Text’ tab`],
								["e", `Toggle checkpoints panel`],
								["b", `Go back to previous checkpoint`],
								["f", `Go forward to next checkpoint`],
								[[SHIFT, "f"], `Go to latest checkpoint`],
								[ENTER, `Focus current panel`],
							],
						},
						{
							groupTitle: "Viewer tab",
							keys: [
								["j", `Select next object`],
								["k", `Select previous object`],
								["l", `Expand object`],
								["h", `Collapse object`],
								[[SHIFT, "l"], `Expand object (recursive)`],
								[[SHIFT, "h"], `Collapse object (recursive)`],
								[ENTER, `Show full value in modal (when truncated)`],
								["e", `Toggle checkpoints panel`],
							],
						},
					]}
				/>
			</div>
		</div>
	)
}

function KeyboardShortcuts(props: {
	spec: Array<{
		groupTitle: string
		keys: Array<[keyOrKeys: string | Array<string>, description: string]>
	}>
}) {
	const { spec } = props

	return (
		<div className="grid grid-cols-[min-content,1fr] items-end">
			{spec.map(({ groupTitle, keys }, i) => (
				<React.Fragment key={i}>
					<div
						className={clsx({
							"h-6": i > 0,
						})}
					/>
					<div className="text-yellow-500 font-bold">{groupTitle}</div>
					{keys.map(([keyOrKeys, description], j) => {
						const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys]
						return (
							<React.Fragment key={j}>
								<div className="flex justify-self-end self-start">
									<div className="font-mono flex">
										{intersperseArray(
											keys.map((k, ki) => (
												<div
													key={`key-${ki}`}
													className="text-yellow-500 font-mono"
												>
													{k}
												</div>
											)),
											ii => (
												<div key={ii} className="px-0.5">
													+
												</div>
											)
										)}
									</div>
									<div className="px-1">:</div>
								</div>
								<div>{description}</div>
							</React.Fragment>
						)
					})}
				</React.Fragment>
			))}
		</div>
	)
}
