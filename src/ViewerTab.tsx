import clsx from "clsx"
import { useAppState } from "./appState"
import { ASTNode } from "./jsonAst"
import { IconMinusSquare, IconPlusSquare } from "./icons"

function ExpandIcon(props: { onClick: () => void; expanded: boolean }) {
	const { onClick, expanded } = props
	const Component = expanded ? IconMinusSquare : IconPlusSquare
	return <Component className="cursor-pointer select-none" onClick={onClick} />
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
				style={{ marginLeft: depth * 20 }}
			>
				{expandable && (
					<ExpandIcon
						onClick={() => setExpanded(!expanded)}
						expanded={expanded}
					/>
				)}
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
