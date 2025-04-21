import { ReactNode, useEffect } from "react"
import { useAppState } from "../state/app"
import { useOnInitialMount } from "./utils"

export function forceCommitToHash() {
	//TODO
}

function getTextFromHash() {
	const hashContents = location.hash.replace(/^#\//, "")
	return hashContents
}

function setHashFromText(text: string) {
	const url = new URL(location)
	url.hash = `#/${text}`
	window.history.replaceState(null, "", url)
}

function useSyncRouteToState() {
	const text = useAppState(state => state.text)
	const setText = useAppState(state => state.setText)

	useOnInitialMount(() => {
		//
	})

	useEffect(
		() =>
			useAppState.subscribe(nextState => {
				setHashFromText(nextState.text)
			}),
		[]
	)
}

export function Router(props: { children: ReactNode }) {
	useSyncRouteToState()

	return <>{props.children}</>
}
