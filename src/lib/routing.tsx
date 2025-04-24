import { ReactNode, useEffect } from "react"
import { useAppState } from "../state/app"
import { isDefined, makeDeferred, useOnInitialMount } from "./utils"
import { worker } from "../worker/workerClient"

// Some stuff cribbed from: https://github.com/topaz/paste/blob/master/index.html

export function forceCommitToHash() {
	const { text } = useAppState.getState()
	setHashFromText(text, { saveBeforeReplacing: true })
}

async function getTextFromHash() {
	const base64 = location.hash.replace(/^#\//, "")
	if (base64.length === 0) {
		return
	}

	try {
		// Base64 -> Uint8Array
		const response = await fetch(
			"data:application/octet-stream;base64," + base64
		)
		const blob = await response.blob()

		const readerLoadDeferred = makeDeferred<undefined>()
		const reader = new FileReader()
		reader.onload = () => {
			readerLoadDeferred.resolve(undefined)
		}
		reader.readAsArrayBuffer(blob)
		await readerLoadDeferred.promise

		if (!reader.result) {
			return
		}

		if (typeof reader.result === "string") {
			throw new Error(`FileReader: did not expect string result`)
		}
		const compressed = new Uint8Array(reader.result)

		// Decompress
		const decompressed = await worker.decompress(compressed)

		// Uint8Array -> String
		const decoder = new TextDecoder()
		return decoder.decode(decompressed)
	} catch (err) {
		console.error("Error converting hash:", err)
		return
	}
}

async function setHashFromText(
	text: string,
	options: { saveBeforeReplacing?: boolean } = {}
) {
	// String -> Uint8Array
	const encoder = new TextEncoder()
	const encoded = encoder.encode(text)

	// Compress
	const compressed = await worker.compress(encoded)

	// Uint8Array -> Base64
	const readerLoadDeferred = makeDeferred<undefined>()
	const reader = new FileReader()
	reader.onload = () => {
		readerLoadDeferred.resolve(undefined)
	}
	reader.readAsDataURL(new Blob([new Uint8Array(compressed)]))
	await readerLoadDeferred.promise

	if (typeof reader.result !== "string") {
		return
	}

	const base64 = reader.result.substring(reader.result.indexOf(",") + 1)

	if (options.saveBeforeReplacing) {
		// XX: not working?
		window.history.pushState(
			new Date().toISOString(),
			"",
			new URL(window.location.href)
		)
	}

	const nextUrl = new URL(window.location.href)
	nextUrl.hash = `#/${base64}`
	window.history.replaceState(new Date().toISOString(), "", nextUrl)
}

function useSyncRouteToState() {
	const setText = useAppState(state => state.setText)

	// Sync state from hash on startup.
	useOnInitialMount(async () => {
		const textFromHash = await getTextFromHash()
		if (isDefined(textFromHash)) {
			setText(textFromHash)
		}
	})

	// Sync state to hash on state change.
	useEffect(
		() =>
			useAppState.subscribe(nextState => {
				setHashFromText(nextState.text)
			}),
		[]
	)

	// Sync hash to state on hash change.
	useEffect(() => {
		async function listener() {
			const textFromHash = await getTextFromHash()
			if (isDefined(textFromHash)) {
				setText(textFromHash)
			}
		}
		window.addEventListener("hashchange", listener)
		return () => window.removeEventListener("hashchange", listener)
	}, [setText])
}

export function Router(props: { children: ReactNode }) {
	useSyncRouteToState()

	return <>{props.children}</>
}
