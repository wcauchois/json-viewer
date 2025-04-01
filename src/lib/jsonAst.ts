import { makeTypeGuard, unreachable } from "./utils"

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

export type NodeTypesWithChildren = Extract<ASTNode["type"], "object" | "array">
export type ASTNodeWithChildren = Extract<
	ASTNode,
	{ type: NodeTypesWithChildren }
>
export const isNodeWithChildren = makeTypeGuard<ASTNode, ASTNodeWithChildren>(
	node =>
		node.type === "object" || node.type === "array"
			? { true: node }
			: { false: node }
)

export type NodeTypesWithValue = Exclude<ASTNode["type"], NodeTypesWithChildren>
export type ASTNodeWithValue = Extract<ASTNode, { type: NodeTypesWithValue }>
export const isNodeWithValue = makeTypeGuard<ASTNode, ASTNodeWithValue>(node =>
	isNodeWithChildren(node) ? { false: node } : { true: node }
)

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

export function astToJson(ast: ASTNode): unknown {
	if (
		ast.type === "string" ||
		ast.type === "number" ||
		ast.type === "boolean"
	) {
		return ast.value
	} else if (ast.type === "null") {
		return null
	} else if (ast.type === "array") {
		return ast.children.map(child => astToJson(child))
	} else if (ast.type === "object") {
		return Object.fromEntries(
			ast.children.map(([key, value]) => [key, astToJson(value)])
		)
	} else {
		unreachable(ast)
	}
}

export function flattenAST(node: ASTNode): ASTNode[] {
	if (
		node.type === "string" ||
		node.type === "null" ||
		node.type === "boolean" ||
		node.type === "number"
	) {
		return [node]
	} else if (node.type === "array") {
		return [node, ...node.children.flatMap(childNode => flattenAST(childNode))]
	} else if (node.type === "object") {
		return [
			node,
			...node.children.flatMap(([, childNode]) => flattenAST(childNode)),
		]
	} else {
		unreachable(node)
	}
}
