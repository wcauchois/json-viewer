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

function NodeRenderer(props: { node: ASTNode; name?: string; depth?: number }) {
	const { node, name, depth = 0 } = props

	const setNodeExpanded = useAppState(state => state.setNodeExpanded)
	const expandedNodes = useAppState(state => state.expandedNodes)

	const setExpanded = (newExpanded: boolean) =>
		setNodeExpanded(node, newExpanded)
	const expanded = expandedNodes.has(node)
	const expandable = node.type === "array" || node.type === "object"

	return (
		<>
			<div
				className="flex items-center gap-1"
				style={{ marginLeft: `calc((1em + 4px) * ${depth})` }}
			>
				<div className="self-stretch">
					{expandable ? (
						<ExpandIcon
							onClick={() => setExpanded(!expanded)}
							expanded={expanded}
							connectors={["top", "bottom"]}
						/>
					) : (
						<ConnectorIcon type="vertical" />
					)}
				</div>
				{node.type === "object" && <IconBraces />}
				{node.type === "array" && <IconBracketsLine />}
				{node.type === "number" && <IconSquare className="text-blue-300" />}
				<div>
					{name ?? "JSON"}
					{(node.type == "boolean" ||
						node.type === "number" ||
						node.type === "string" ||
						node.type === "null") &&
						` : ${node.type === "null" ? "null" : node.value.toString()}`}
				</div>
			</div>
			{expanded && (
				<>
					{node.type === "object" &&
						node.children.map(([childName, childNode]) => (
							<NodeRenderer
								key={childName}
								node={childNode}
								name={childName}
								depth={depth + 1}
							/>
						))}
					{node.type === "array" &&
						node.children.map((childNode, i) => (
							<NodeRenderer
								key={i}
								node={childNode}
								name={i.toString()}
								depth={depth + 1}
							/>
						))}
				</>
			)}
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
