import { AnimatePresence, motion } from "framer-motion"
import { ReactNode } from "react"
import { useSnackbar } from "../state/snackbar"

function Snackbar(props: { children: ReactNode }) {
	const { children } = props

	return (
		<div className="fixed bottom-4 w-full flex justify-center">
			<motion.div
				className="py-2 px-4 text-sm bg-black text-white rounded"
				initial={{
					translateY: 50,
				}}
				animate={{
					translateY: 0,
				}}
				exit={{
					translateY: 70,
				}}
			>
				{children}
			</motion.div>
		</div>
	)
}

export function SnackbarRenderer() {
	const snackbar = useSnackbar(state => state.snackbar)
	return (
		<AnimatePresence>
			{snackbar ? <Snackbar key={snackbar.id}>{snackbar.text}</Snackbar> : null}
		</AnimatePresence>
	)
}
