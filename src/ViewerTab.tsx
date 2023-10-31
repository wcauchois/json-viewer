import clsx from "clsx"
import { AppState, useAppState } from "./appState"
import {
	ASTNode,
	ASTNodeWithValue,
	isNodeWithChildren,
	isNodeWithValue,
} from "./jsonAst"
import {
	IconBraces,
	IconBracketsLine,
	IconMagnifyingGlass,
	IconMinusSquare,
	IconPlusSquare,
	IconSquare,
} from "./icons"
import { isDefined, unreachable } from "./utils"
import _ from "lodash"
import { useEffect, useImperativeHandle, useRef, useState } from "react"
import React from "react"

const connectorStrokeColor = "rgb(156 163 175)"

function ExpandIcon(
	props: React.SVGProps<SVGSVGElement> & {
		expanded: boolean
		connectors: Array<"top" | "bottom">
	}
) {
	const { expanded, connectors, ...restProps } = props
	const Component = expanded ? IconMinusSquare : IconPlusSquare
	return (
		<Component
			className="cursor-pointer select-none"
			height="100%"
			{...restProps}
		>
			{connectors.includes("top") && (
				<line
					x1="512"
					y1="-512"
					x2="512"
					y2="144"
					strokeWidth="72"
					stroke={connectorStrokeColor}
				/>
			)}
			{connectors.includes("bottom") && (
				<line
					x1="512"
					y1="880"
					x2="512"
					y2="1536"
					strokeWidth="72"
					stroke={connectorStrokeColor}
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
				strokeWidth="72"
				stroke={connectorStrokeColor}
			/>
			{(type === "corner" || type === "tri") && (
				<line
					x1={512 - 72 / 2}
					y1="512"
					x2="1536"
					y2="512"
					strokeWidth="72"
					stroke={connectorStrokeColor}
				/>
			)}
		</svg>
	)
}

function TypeIconForNode(props: { node: ASTNode; className?: string }) {
	const { node, className } = props

	if (node.type === "object") {
		return <IconBraces className={className} />
	} else if (node.type === "array") {
		return <IconBracketsLine className={className} />
	} else if (node.type === "number") {
		return <IconSquare className={clsx(className, "text-green-400")} />
	} else if (node.type === "string") {
		return <IconSquare className={clsx(className, "text-blue-400")} />
	} else if (node.type === "boolean") {
		return <IconSquare className={clsx(className, "text-yellow-400")} />
	} else if (node.type === "null") {
		return <IconSquare className={clsx(className, "text-red-400")} />
	} else {
		unreachable(node)
	}
}

function NodeValueRenderer(props: { node: ASTNodeWithValue }) {
	const { node } = props

	if (node.type === "boolean" || node.type === "number") {
		return node.value.toString()
	} else if (node.type === "null") {
		return "null"
	} else if (node.type === "string") {
		return `"${node.value}"`
	} else {
		unreachable(node)
	}
}

const FocusableNodeClass = "app-focusable-node"

interface NodeRendererProps {
	node: ASTNode
	name?: string
	depth?: number
	depthLines?: number[]
	isLast?: boolean
	isRoot?: boolean
	collapseAndFocusParent: () => void
}

interface NodeRendererHandle {
	focus(): void
}

const NodeRenderer = React.forwardRef(
	(props: NodeRendererProps, ref: React.Ref<NodeRendererHandle>) => {
		const {
			node,
			name,
			depth = 0,
			depthLines = [],
			isLast,
			isRoot,
			collapseAndFocusParent,
		} = props

		const setNodeExpanded = useAppState(state => state.setNodeExpanded)
		const expandedNodes = useAppState(state => state.expandedNodes)

		const setExpanded = (newExpanded: boolean) =>
			setNodeExpanded(node, newExpanded)
		const expanded = expandedNodes.has(node)

		const containerRef = useRef<HTMLDivElement>(null)
		const nameAndValueRef = useRef<HTMLDivElement>(null)

		const [isOverflowing, setIsOverflowing] = useState(false)
		useEffect(() => {
			const el = nameAndValueRef.current
			if (!el) {
				return
			}
			// https://stackoverflow.com/a/10017343
			setIsOverflowing(el.offsetWidth < el.scrollWidth)
		}, [nameAndValueRef])

		useImperativeHandle(
			ref,
			() => ({
				focus() {
					containerRef.current?.focus()
				},
			}),
			[]
		)

		const firstChildRef = useRef<NodeRendererHandle>(null)

		let resolvedChildren:
			| Array<[childName: string, childNode: ASTNode]>
			| undefined
		if (isNodeWithChildren(node)) {
			if (node.type === "array") {
				resolvedChildren = node.children.map((childNode, index) => [
					index.toString(),
					childNode,
				])
			} else if (node.type === "object") {
				resolvedChildren = node.children
			} else {
				unreachable(node)
			}
		}

		const expandable = isDefined(resolvedChildren)

		return (
			<>
				<div
					ref={containerRef}
					className={clsx(
						"flex items-center gap-1 focus:bg-blue-100 outline-none relative group",
						FocusableNodeClass
					)}
					tabIndex={0}
					onKeyDown={e => {
						if (document.activeElement === containerRef.current) {
							if (e.key === "ArrowRight" || e.key === "l") {
								if (expandable && expanded) {
									firstChildRef.current?.focus()
								} else {
									setExpanded(true)
								}
							} else if (e.key === "ArrowLeft" || e.key === "h") {
								if (!expandable || !expanded) {
									collapseAndFocusParent()
								} else {
									setExpanded(false)
								}
							}
						}
					}}
				>
					{_.range(0, depth).map(i => (
						<div
							key={i}
							className="self-stretch shrink-0"
							style={{ width: "1em" }}
						>
							{depthLines.includes(i) && <ConnectorIcon type={"vertical"} />}
						</div>
					))}
					<div className="self-stretch shrink-0">
						{isDefined(resolvedChildren) && resolvedChildren.length > 0 ? (
							<ExpandIcon
								onClick={() => {
									setExpanded(!expanded)
								}}
								onMouseDown={e => {
									// Prevent expand/collapse from changing focus.
									e.preventDefault()
									e.stopPropagation()
								}}
								expanded={expanded}
								connectors={[
									"top",
									...(isLast || isRoot ? [] : ["bottom" as const]),
								]}
							/>
						) : (
							<ConnectorIcon type={isLast ? "corner" : "tri"} />
						)}
					</div>
					<TypeIconForNode node={node} className="shrink-0" />
					<div
						className="whitespace-nowrap text-ellipsis overflow-hidden"
						ref={nameAndValueRef}
					>
						{name ?? "JSON"}
						{isNodeWithValue(node) && (
							<>
								{" : "}
								<NodeValueRenderer node={node} />
							</>
						)}
					</div>
					{isOverflowing && (
						<div className="absolute right-0 top-0 bottom-0 flex items-center group-hover:visible invisible pr-1 pl-6 bg-gradient-to-r from-transparent via-white to-white">
							<IconMagnifyingGlass className="cursor-pointer fill-gray-500 hover:fill-black" />
						</div>
					)}
				</div>
				{expanded &&
					(resolvedChildren ?? []).map(([childName, childNode], i) => {
						const childIsLast =
							isDefined(resolvedChildren) && i === resolvedChildren.length - 1
						return (
							<NodeRenderer
								ref={i === 0 ? firstChildRef : undefined}
								key={childName}
								node={childNode}
								name={childName}
								depth={depth + 1}
								isLast={childIsLast}
								depthLines={[
									...depthLines,
									...(isLast || isRoot ? [] : [depth]),
								]}
								collapseAndFocusParent={() => {
									setExpanded(false)
									containerRef.current?.focus()
								}}
							/>
						)
					})}
			</>
		)
	}
)

function ViewerTabSuccessfulParse(props: {
	parseResult: Extract<AppState["parseResult"], { type: "success" }>
}) {
	const { parseResult } = props

	const containerRef = useRef<HTMLDivElement>(null)

	return (
		<div
			className="flex flex-col text-sm"
			ref={containerRef}
			onKeyDown={e => {
				if (!containerRef.current) {
					return
				}

				let moveDirection: "previous" | "next" | undefined
				if (e.key === "ArrowUp" || e.key === "k") {
					moveDirection = "previous"
				} else if (e.key === "ArrowDown" || e.key === "j") {
					moveDirection = "next"
				}

				if (isDefined(moveDirection)) {
					const focusedNode = containerRef.current.querySelector(
						`.${FocusableNodeClass}:focus`
					)
					if (focusedNode) {
						const desiredSibling =
							moveDirection === "next"
								? focusedNode.nextElementSibling
								: focusedNode.previousElementSibling
						if (desiredSibling && desiredSibling instanceof HTMLElement) {
							desiredSibling.focus()
						}
					}
				}
			}}
		>
			<NodeRenderer
				node={parseResult.value.ast}
				isRoot={true}
				collapseAndFocusParent={() => {}}
			/>
		</div>
	)
}

export function ViewerTab(props: { className?: string }) {
	const { className } = props

	const parseResult = useAppState(state => state.parseResult)

	return (
		<div className={clsx(className)}>
			{parseResult.type === "success" ? (
				<ViewerTabSuccessfulParse parseResult={parseResult} />
			) : (
				<div className="text-sm text-red-700 p-1">Failed to parse</div>
			)}
		</div>
	)
}
