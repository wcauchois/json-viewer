import { ReactNode, useEffect } from "react"
import { useAppState } from "../state/app"
import { makeDeferred, useOnInitialMount } from "./utils"
import { worker } from "../worker/workerClient"

// Some stuff cribbed from: https://github.com/topaz/paste/blob/master/index.html

export function forceCommitToHash() {
	//TODO
}

function getTextFromHash() {
	const hashContents = location.hash.replace(/^#\//, "")
	return hashContents
}

async function setHashFromText(text: string) {
	const url = new URL(window.location.href)
	console.log("set hash from text")

	const encoder = new TextEncoder()
	const encoded = encoder.encode(text)
	const compressed = await worker.compress(encoded)

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

	url.hash = `#/${base64}`
	window.history.replaceState(null, "", url)
}

function useSyncRouteToState() {
	const text = useAppState(state => state.text)
	const setText = useAppState(state => state.setText)

	// Sync state from hash on startup.
	useOnInitialMount(() => {
		//
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
		function listener() {
			setText(getTextFromHash())
		}
		window.addEventListener("hashchange", listener)
		return () => window.removeEventListener("hashchange", listener)
	}, [setText])
}

export function Router(props: { children: ReactNode }) {
	useSyncRouteToState()

	return <>{props.children}</>
}
