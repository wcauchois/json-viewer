import { create } from "zustand"
import { nanoid } from "nanoid"

interface ShownSnackbar {
	id: string
	text: string
}

interface SnackbarState {
	snackbar: ShownSnackbar | undefined
	setSnackbar: (newSnackbar: ShownSnackbar | undefined) => void
}

export const useSnackbar = create<SnackbarState>(set => ({
	snackbar: undefined,
	setSnackbar: newSnackbar => set({ snackbar: newSnackbar }),
}))

const SNACKBAR_DURATION = 1500

export function showSnackbar(text: string) {
	const id = nanoid()

	useSnackbar.getState().setSnackbar({
		id,
		text,
	})

	setTimeout(() => {
		if (useSnackbar.getState().snackbar?.id === id) {
			useSnackbar.getState().setSnackbar(undefined)
		}
	}, SNACKBAR_DURATION)
}
