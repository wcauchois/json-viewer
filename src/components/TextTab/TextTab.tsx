import clsx from "clsx"
import { useAppState } from "../../state/app"
import { useRef } from "react"
import { showSnackbar } from "../../state/snackbar"
import { useEventListener } from "usehooks-ts"
import { isValidJson, keyMap } from "../../lib/utils"
import { copyToClipboard, pasteFromClipboard } from "../../lib/appActions"
import { Toolbar } from "../designSystem/Toolbar"
import { AboutModal, AboutModalHandle } from "../AboutModal"
import { forceCommitToHash } from "../../lib/routing"

export function TextTab(props: { className?: string }) {
	const { className } = props

	const text = useAppState(state => state.text)
	const setText = useAppState(state => state.setText)

	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const aboutModal = useRef<AboutModalHandle>(null)

	useEventListener("keydown", async e => {
		if (e.target === document.body) {
			await keyMap(e, {
				Enter: () => {
					e.preventDefault()
					textareaRef.current?.focus()
				},
			})
		}
	})

	return (
		<div className={clsx(className, "w-full h-full flex flex-col")}>
			<AboutModal ref={aboutModal} />
			<Toolbar
				itemGroups={[
					[
						{
							name: "Paste",
							action: () => pasteFromClipboard(),
						},
						{
							name: "Copy",
							action: () => copyToClipboard(),
						},
					],
					[
						{
							name: "Format",
							action: () => {
								const parseResult = useAppState.getState().parseResult
								if (parseResult.type === "success") {
									setText(JSON.stringify(parseResult.value.object, null, 2))
									textareaRef.current?.scrollTo(0, 0)
								} else {
									showSnackbar("Could not format: JSON does not parse.")
								}
							},
						},
						{
							name: "Remove whitespace",
							action: () => {
								const parseResult = useAppState.getState().parseResult
								if (parseResult.type === "success") {
									setText(JSON.stringify(parseResult.value.object))
									textareaRef.current?.scrollTo(0, 0)
								} else {
									showSnackbar(
										"Could not remove whitespace: JSON does not parse."
									)
								}
							},
						},
					],
					[
						{
							name: "Clear",
							action: () => {
								setText("")
							},
						},
						{
							name: "About",
							action: () => aboutModal.current?.open(),
						},
					],
				]}
			/>
			<textarea
				ref={textareaRef}
				placeholder="Paste JSON here"
				className="p-1 text-xs font-mono resize-none grow main-text-area"
				value={text}
				onChange={e => setText(e.currentTarget.value)}
				onPaste={e => {
					const value = e.clipboardData.getData("text")
					if (isValidJson(value)) {
						forceCommitToHash()
					}
				}}
				onKeyDown={e => {
					if (e.key === "Escape") {
						textareaRef.current?.blur()
					}
				}}
			/>
		</div>
	)
}
