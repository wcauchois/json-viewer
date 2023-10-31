import clsx from "clsx"
import { useAppState } from "./appState"
import { ASTNode } from "./jsonAst"
import {
	IconBraces,
	IconBracketsLine,
	IconMinusSquare,
	IconPlusSquare,
	IconSquare,
} from "./icons"
import { isDefined, unreachable } from "./utils"
import _ from "lodash"

function ExpandIcon(props: {
	onClick: () => void
	expanded: boolean
	connectors: Array<"top" | "bottom">
}) {
	const { onClick, expanded, connectors } = props
	const Component = expanded ? IconMinusSquare : IconPlusSquare
	return (
		<Component
			className="cursor-pointer select-none"
			height="100%"
			onClick={onClick}
		>
			{connectors.includes("top") && (
				<line
					x1="512"
					y1="-512"
					x2="512"
					y2="144"
					stroke-width="72"
					stroke="currentColor"
				/>
			)}
			{connectors.includes("bottom") && (
				<line
					x1="512"
					y1="880"
					x2="512"
					y2="1536"
					stroke-width="72"
					stroke="currentColor"
				/>
			)}
		</Component>
	)
}

function ConnectorIcon(props: { type: "vertical" | "corner" | "tri" }) {
	const { type } = props

	return (
		<svg viewBox="0 0 1024 1024" fill="currentColor" height="100%" width="1em">
			<line
				x1="512"
				y1="-512"
				x2="512"
				y2={type === "corner" ? 512 : 1536}
				stroke-width="72"
				stroke="currentColor"
			/>
			{(type === "corner" || type === "tri") && (
				<line
					x1={512 - 72 / 2}
					y1="512"
					x2="1536"
					y2="512"
					stroke-width="72"
					stroke="currentColor"
				/>
			)}
		</svg>
	)
}

function TypeIconForNode(props: { node: ASTNode }) {
	const { node } = props

	if (node.type === "object") {
		return <IconBraces />
	} else if (node.type === "array") {
		return <IconBracketsLine />
	} else if (node.type === "number") {
		return <IconSquare className="text-green-400" />
	} else if (node.type === "string") {
		return <IconSquare className="text-blue-400" />
	} else if (node.type === "boolean") {
		return <IconSquare className="text-yellow-400" />
	} else if (node.type === "null") {
		return <IconSquare className="text-red-400" />
	} else {
		unreachable(node)
	}
}

function NodeRenderer(props: {
	node: ASTNode
	name?: string
	depth?: number
	depthLines?: number[]
	isLast?: boolean
}) {
	const { node, name, depth = 0, depthLines = [], isLast } = props

	const setNodeExpanded = useAppState(state => state.setNodeExpanded)
	const expandedNodes = useAppState(state => state.expandedNodes)

	const setExpanded = (newExpanded: boolean) =>
		setNodeExpanded(node, newExpanded)
	const expanded = expandedNodes.has(node)

	let resolvedChildren:
		| Array<[childName: string, childNode: ASTNode]>
		| undefined
	if (node.type === "array") {
		resolvedChildren = node.children.map((childNode, index) => [
			index.toString(),
			childNode,
		])
	} else if (node.type === "object") {
		resolvedChildren = node.children
	}

	return (
		<>
			<div className="flex items-center gap-1">
				{_.range(0, depth).map(i => (
					<div key={i} className="self-stretch" style={{ width: "1em" }}>
						{depthLines.includes(i) && <ConnectorIcon type={"vertical"} />}
					</div>
				))}
				<div className="self-stretch">
					{isDefined(resolvedChildren) && resolvedChildren.length > 0 ? (
						<ExpandIcon
							onClick={() => setExpanded(!expanded)}
							expanded={expanded}
							connectors={["top", ...(isLast ? [] : ["bottom" as const])]}
						/>
					) : (
						<ConnectorIcon type={isLast ? "corner" : "tri"} />
					)}
				</div>
				<TypeIconForNode node={node} />
				<div>
					{name ?? "JSON"}
					{(node.type == "boolean" ||
						node.type === "number" ||
						node.type === "string" ||
						node.type === "null") &&
						` : ${node.type === "null" ? "null" : node.value.toString()}`}
				</div>
			</div>
			{expanded &&
				(resolvedChildren ?? []).map(([childName, childNode], i) => {
					const childIsLast =
						isDefined(resolvedChildren) && i === resolvedChildren.length - 1
					return (
						<NodeRenderer
							key={childName}
							node={childNode}
							name={childName}
							depth={depth + 1}
							isLast={childIsLast}
							depthLines={[...depthLines, ...(!isLast ? [depth] : [])]}
						/>
					)
				})}
		</>
	)
}

export function ViewerTab(props: { className?: string }) {
	const { className } = props

	const parseResult = useAppState(state => state.parseResult)

	return (
		<div className={clsx(className)}>
			{parseResult.type === "success" ? (
				<div className="flex flex-col">
					<NodeRenderer node={parseResult.value.ast} />
				</div>
			) : (
				<div className="text-sm text-red-700 p-1">Failed to parse</div>
			)}
		</div>
	)
}
