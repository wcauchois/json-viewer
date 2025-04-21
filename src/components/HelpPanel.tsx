import clsx from "clsx"
import React, { ReactNode } from "react"
import { intersperseArray } from "../lib/utils"

const ENTER = "↵"
const SHIFT = "⇧"
const ESCAPE = "Esc"

function Paragraph(props: { children: ReactNode; className?: string }) {
	return <div className={clsx("py-1", props.className)}>{props.children}</div>
}

function Subheader(props: { children: ReactNode }) {
	return <Paragraph className="font-bold py-2">{props.children}</Paragraph>
}

function BulletedList(props: { items: Array<ReactNode> }) {
	return (
		<ul className="list-disc pl-4 gap-y-1 flex flex-col">
			{props.items.map((item, i) => (
				<li key={i}>{item}</li>
			))}
		</ul>
	)
}

function Keycode(props: { children: ReactNode }) {
	return <span className="text-yellow-500 font-mono">{props.children}</span>
}

export function HelpPanel() {
	return (
		<div className="flex flex-col px-2 py-1">
			<div className="font-bold">Help</div>
			<div className="flex flex-col text-sm">
				<HelpContent />
			</div>
		</div>
	)
}

function HelpContent() {
	return (
		<>
			<Subheader>Tips:</Subheader>
			<BulletedList
				items={[
					<>
						You can use Vim-style keyboard shortcuts (<Keycode>h</Keycode>,{" "}
						<Keycode>j</Keycode>, <Keycode>k</Keycode>, and <Keycode>l</Keycode>
						) to navigate the object in the viewer tab.
					</>,
					<>
						Focus can be mostly managed by the keyboard (and uses the browser’s
						focus facilities.) A certain set of key bindings is available when
						no element is focused (“Window focus” below.) Think of this as Vim's
						normal mode. You can use <Keycode>v</Keycode> and{" "}
						<Keycode>t</Keycode> there to switch between tabs. Press{" "}
						<Keycode>{ENTER}</Keycode> to focus the current tab, and{" "}
						<Keycode>{ESCAPE}</Keycode> to return focus to the window (go back
						to normal mode.)
					</>,
					<>
						When a string value is really long it will get horizontally
						truncated. Hover over the row and you will see a magnifying glass;
						click it to open a modal with the formatted content. You can also
						use the shortcut <Keycode>{ENTER}</Keycode> while the row is focused
						with the keyboard.
					</>,
					<>JSON inside strings is recursively parsed.</>,
					<>
						Command-click on anything in the viewer tab to copy it to your
						clipboard.
					</>,
				]}
			/>
			<Subheader>Keyboard shortcuts:</Subheader>
			<AppKeyboardShortcuts />
		</>
	)
}

function AppKeyboardShortcuts() {
	return (
		<KeyboardShortcuts
			spec={[
				{
					groupTitle: "Window focus",
					keys: [
						["c", `Copy JSON object to clipboard`],
						["p", `Paste JSON object from clipboard`],
						["v", `Switch to ‘Viewer’ tab`],
						["t", `Switch to ‘Text’ tab`],
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
						[[SHIFT, "f"], `Open find bar`],
						[ENTER, `Show full value in modal (when truncated)`],
					],
				},
			]}
		/>
	)
}

type KeyboardShortcutKey = [
	keyOrKeys: string | Array<string>,
	description: string,
]

function KeyboardShortcuts(props: {
	spec: Array<{
		groupTitle: string
		keys: Array<KeyboardShortcutKey>
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
												<Keycode key={`key-${ki}`}>{k}</Keycode>
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
