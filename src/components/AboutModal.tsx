import React, { useImperativeHandle, useState } from "react"
import { Modal } from "./designSystem/Modal"
import { Header } from "./designSystem/Header"
import { ExternalLink } from "./designSystem/ExternalLink"

export interface AboutModalHandle {
	open(): void
}

function AboutModalContent() {
	return (
		<div className="text-sm">
			<Header level={1}>JSON Viewer</Header>
			<p>Thanks for using my JSON viewer!</p>
			<Header level={2}>Features</Header>
			<ul className="list-disc pl-5">
				<li>View and format JSON.</li>
				<li>Save checkpoints along the way.</li>
				<li>Navigate using keyboard shortcuts.</li>
			</ul>
			<Header level={2}>Source Code</Header>
			<p>
				<ExternalLink
					href="https://github.com/wcauchois/json-viewer"
					target="_blank"
				>
					https://github.com/wcauchois/json-viewer
				</ExternalLink>
			</p>
		</div>
	)
}

export const AboutModal = React.forwardRef(
	(_props: unknown, ref: React.Ref<AboutModalHandle>) => {
		const [open, setOpen] = useState(false)

		useImperativeHandle(ref, () => ({
			open() {
				setOpen(true)
			},
		}))
		return open ? (
			<Modal
				onClose={() => setOpen(false)}
				className="min-w-[min(400px,100vw-40px)]"
			>
				<AboutModalContent />
			</Modal>
		) : null
	}
)
