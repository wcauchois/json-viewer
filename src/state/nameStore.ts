import { create } from "zustand"
import { getHashForContent } from "../lib/utils"
import { persist } from "zustand/middleware"
import { useCallback, useEffect, useState } from "react"
import { useAppState } from "./app"

interface PersistedNameStoreState {
	map: {
		[hash: string]: {
			name: string
		}
	}

	addName(content: string, name: string): void

	getName(content: string): Promise<string | undefined>
}

interface OptimisticStoreState {
	contentToName: [content: string, name: string] | undefined
	setContentToName(content: string, name: string): void
}

const useOptimisticStore = create<OptimisticStoreState>(set => ({
	contentToName: undefined,
	setContentToName(content, name) {
		set({
			contentToName: [content, name],
		})
	},
}))

const useNameStore = create<PersistedNameStoreState>()(
	persist(
		(set, get) => ({
			map: {},
			async addName(content, name) {
				const hash = await getHashForContent(content)
				set({
					map: {
						...get().map,
						[hash]: { name },
					},
				})
			},
			async getName(content) {
				const hash = await getHashForContent(content)
				return get().map[hash]?.name
			},
		}),
		{
			name: "name-store",
		}
	)
)

export function useNameForContent(content: string) {
	const [nameState, setNameState] = useState<string | undefined>()
	const contentToName = useOptimisticStore(state => state.contentToName)

	const getName = useNameStore(state => state.getName)

	useEffect(() => {
		async function go() {
			const name = await getName(content)
			setNameState(name)
		}
		void go()
	}, [content, getName])

	return contentToName?.[0] === content ? contentToName[1] : nameState
}

export function useAddName() {
	const addName = useNameStore(state => state.addName)
	const setContentToName = useOptimisticStore(state => state.setContentToName)

	return useCallback(
		(content: string, name: string) => {
			if (content) {
				setContentToName(content, name)
				void addName(content, name)
			}
		},
		[addName, setContentToName]
	)
}

export function useSyncNameToDocumentTitle() {
	const text = useAppState(state => state.text)
	const name = useNameForContent(text)

	useEffect(() => {
		document.title = name ? `${name} - JSON Viewer` : "JSON Viewer"
	}, [name])
}
