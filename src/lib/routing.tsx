import { ReactNode, useCallback, useEffect } from "react"
import { useAppState } from "../state/app"
import {
	isDefined,
	makeDeferred,
	Result,
	tryJsonParse,
	useOnInitialMount,
} from "./utils"
import { worker } from "../worker/workerClient"
import { z } from "zod"
import { ASTNode } from "./jsonAst"

// Some stuff cribbed from: https://github.com/topaz/paste/blob/master/index.html

// It'd be better if this was in context and not a global variable, but let's
// be lazy and assume there's only ever one router.
let shouldForceHistoryPush = false

const routeStateSchema = z.object({
	text: z.string(),
	initiallyFocusedPath: z.array(z.string()).optional(),
})

type RouteState = z.infer<typeof routeStateSchema>

export async function forceHistoryPush() {
	shouldForceHistoryPush = true
}

function parseRouteState(hashValue: string): Result<RouteState, Error> {
	const decoded = decodeURIComponent(hashValue)
	const jsonParseResult = tryJsonParse(decoded)
	if (jsonParseResult.type === "failure") {
		return jsonParseResult
	}
	const schemaParseResult = routeStateSchema.safeParse(jsonParseResult.value)
	if (schemaParseResult.success) {
		return {
			type: "success",
			value: schemaParseResult.data,
		}
	} else {
		return {
			type: "failure",
			error: schemaParseResult.error,
		}
	}
}

function serializeRouteState(routeState: RouteState): string {
	const jsonSerialized = JSON.stringify(routeState)
	return encodeURIComponent(jsonSerialized)
}

async function getRouteStateFromHash(): Promise<RouteState | undefined> {
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
		const serializedState = decoder.decode(decompressed)
		return Result.unwrap(parseRouteState(serializedState))
	} catch (err) {
		console.error("Error converting hash:", err)
		return
	}
}

async function convertStringToCompressedBase64(text: string) {
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
	return base64
}

export async function createUrlForRouteState(state: RouteState) {
	const base64 = await convertStringToCompressedBase64(
		serializeRouteState(state)
	)
	const url = new URL(window.location.href)
	url.hash = `#/${base64}`
	return url
}

function getNodesInPath(rootNode: ASTNode, inputPath: string[]) {
	const result = [rootNode]

	let currentNode = rootNode
	const pathQueue = [...inputPath]

	while (pathQueue.length > 0) {
		const pathItem = pathQueue.shift()!
		if (currentNode.type === "object") {
			const child = currentNode.children.find(([name]) => name === pathItem)
			if (!child) {
				break
			}

			result.push(child[1])
			currentNode = child[1]
		} else if (currentNode.type === "array") {
			const number = parseInt(pathItem, 10)
			if (isNaN(number)) {
				break
			}

			const child = currentNode.children[number]
			if (!child) {
				break
			}

			result.push(child)
			currentNode = child
		} else {
			break
		}
	}

	return result
}

function useSyncRouteStateToApp() {
	const setText = useAppState(state => state.setText)
	const setForceFocusNode = useAppState(state => state.setForceFocusNode)
	const setNodesExpanded = useAppState(state => state.setNodesExpanded)

	const syncRouteStateToApp = useCallback(
		(routeState: RouteState) => {
			setText(routeState.text)

			if (routeState.initiallyFocusedPath) {
				const parseResult = useAppState.getState().parseResult
				if (parseResult.type === "success") {
					const nodesInPath = getNodesInPath(
						parseResult.value.ast,
						routeState.initiallyFocusedPath
					)
					setNodesExpanded(nodesInPath, true)
					const lastNodeInPath = nodesInPath.at(-1)
					if (lastNodeInPath) {
						setForceFocusNode(lastNodeInPath)
					}
				}
			}
		},
		[setForceFocusNode, setText, setNodesExpanded]
	)

	return syncRouteStateToApp
}

function useSyncRoute() {
	const setText = useAppState(state => state.setText)
	const syncRouteStateToApp = useSyncRouteStateToApp()

	// Sync state from hash on startup.
	useOnInitialMount(async () => {
		const stateFromHash = await getRouteStateFromHash()
		if (isDefined(stateFromHash)) {
			syncRouteStateToApp(stateFromHash)
		}
	})

	// Sync state to hash on state change.
	useEffect(
		() =>
			useAppState.subscribe(async ({ text }) => {
				const newUrl = await createUrlForRouteState({ text })
				if (shouldForceHistoryPush) {
					window.history.pushState(text, "", newUrl)
					shouldForceHistoryPush = false
				} else {
					window.history.replaceState(text, "", newUrl)
				}
			}),
		[]
	)

	// Sync hash to state on hash change.
	useEffect(() => {
		async function listener() {
			const stateFromHash = await getRouteStateFromHash()
			if (isDefined(stateFromHash)) {
				syncRouteStateToApp(stateFromHash)
			}
		}
		window.addEventListener("hashchange", listener)
		return () => window.removeEventListener("hashchange", listener)
	}, [setText, syncRouteStateToApp])

	// Sync history state to app state on popstate
	useEffect(() => {
		async function listener(e: PopStateEvent) {
			if (typeof e.state !== "string") {
				return
			}
			const textFromHistory = e.state
			setText(textFromHistory)
		}
		window.addEventListener("popstate", listener)
		return () => window.removeEventListener("popstate", listener)
	}, [setText])
}

export function Router(props: { children: ReactNode }) {
	useSyncRoute()

	return <>{props.children}</>
}
