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

// https://stackoverflow.com/a/40031979
export function buf2hex(buffer: ArrayBuffer) {
	return [...new Uint8Array(buffer)]
		.map(x => x.toString(16).padStart(2, "0"))
		.join("")
}

const modifierKeyToAlias: { [K in React.ModifierKey]: string | true } = {
	Alt: "alt",
	AltGraph: true,
	CapsLock: true,
	Control: "ctrl",
	Fn: true,
	FnLock: true,
	Hyper: true,
	Meta: "cmd",
	NumLock: true,
	ScrollLock: true,
	Shift: "shift",
	Super: true,
	Symbol: true,
	SymbolLock: true,
}

const aliasToModifierKey = Object.fromEntries(
	Object.entries(modifierKeyToAlias).flatMap(([k, v]) =>
		typeof v === "string" ? [[v, k]] : []
	)
)

const ALL_MODIFIER_KEYS = Object.keys(modifierKeyToAlias) as React.ModifierKey[]

export function keyMatch(
	event: React.KeyboardEvent | KeyboardEvent,
	keyDesc: string
) {
	const keyOptions = keyDesc.split(",").map(s => s.trim())

	for (const keyOption of keyOptions) {
		const requiredModifiers: React.ModifierKey[] = []
		const parts = keyOption.split("+")
		let key: string | undefined

		for (const part of parts) {
			const modifierKey = aliasToModifierKey[part]
			if (modifierKey) {
				requiredModifiers.push(modifierKey as React.ModifierKey)
			} else {
				key = part
			}
		}

		if (!key) {
			throw new Error(`Invalid key description: ${key}`)
		}

		if (
			event.key === key &&
			ALL_MODIFIER_KEYS.every(
				modifierKey =>
					event.getModifierState(modifierKey) ===
					requiredModifiers.includes(modifierKey)
			)
		) {
			return true
		}
	}

	return false
}

export async function keyMap(
	event: React.KeyboardEvent | KeyboardEvent,
	map: Record<string, () => void | Promise<void>>
) {
	for (const [keyDesc, action] of Object.entries(map)) {
		if (keyMatch(event, keyDesc)) {
			await action()
		}
	}
}

export type EmptyObject = Record<string, never>

export function isValidJson(input: string) {
	try {
		JSON.parse(input)
		return true
	} catch {
		return false
	}
}
