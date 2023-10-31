export type Result<S, F> =
	| { type: "success"; value: S }
	| { type: "failure"; error: F }

export function unreachable(x: never): never {
	throw new Error(`Expected value never to occur: ${JSON.stringify(x)}`)
}

export const makeTypeGuard =
	<
		/** Input type. */
		WideType,
		/** Type to narrow to if `true`. */
		SuccessType extends WideType,
		/** Type to narrow to if `false`. */
		FailType extends WideType = Exclude<WideType, SuccessType>,
	>(
		typeGuard: (input: WideType) => { true: SuccessType } | { false: FailType }
	) =>
	(value: WideType): value is SuccessType =>
		"true" in typeGuard(value)

export type Assert<T, V extends T> = V

export function isDefined<T>(value: T | undefined): value is T {
	return value !== undefined
}

export function intersperseArray<Value, IntersperseValue>(
	array: Array<Value>,
	createIntersperseValue: (index: number) => IntersperseValue
) {
	const newArray: Array<Value | IntersperseValue> = []
	array.forEach((value, index) => {
		newArray.push(value)
		if (array[index + 1]) {
			newArray.push(createIntersperseValue(index))
		}
	})
	return newArray
}
