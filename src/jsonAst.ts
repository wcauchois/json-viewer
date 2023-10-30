export type ASTNode =
	| {
			type: "object"
			children: Array<[name: string, node: ASTNode]>
	  }
	| {
			type: "number"
			value: number
	  }
	| {
			type: "string"
			value: string
	  }
	| {
			type: "boolean"
			value: boolean
	  }
	| {
			type: "array"
			children: ASTNode[]
	  }
	| { type: "null" }

export function jsonToAST(input: unknown): ASTNode {
	if (input === null) {
		return { type: "null" }
	} else if (typeof input === "string") {
		return { type: "string", value: input }
	} else if (typeof input === "number") {
		return { type: "number", value: input }
	} else if (typeof input === "boolean") {
		return { type: "boolean", value: input }
	} else if (Array.isArray(input)) {
		return { type: "array", children: input.map(item => jsonToAST(item)) }
	} else if (typeof input === "object") {
		return {
			type: "object",
			children: Object.entries(input).map(([key, value]): [string, ASTNode] => [
				key,
				jsonToAST(value),
			]),
		}
	} else {
		throw new Error(`Unexpected input for jsonToAST: ${JSON.stringify(input)}`)
	}
}
