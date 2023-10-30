export type Result<S, F> =
	| { type: "success"; value: S }
	| { type: "failure"; error: F }
