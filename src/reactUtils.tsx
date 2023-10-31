import { intersperseArray } from "./utils"

/** Newline to <br> element. */
export const nl2br = (s: string): JSX.Element => (
	<>
		{intersperseArray(s.split("\n"), () => (
			<br />
		))}
	</>
)
