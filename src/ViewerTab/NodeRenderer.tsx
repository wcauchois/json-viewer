import clsx from "clsx"
import { useAppState } from "../state/app"
import {
	ASTNode,
	ASTNodeWithValue,
	flattenAST,
	isNodeWithChildren,
	isNodeWithValue,
} from "../jsonAst"
import {
	IconBraces,
	IconBracketsLine,
	IconMagnifyingGlass,
	IconMinusSquare,
	IconPlusSquare,
	IconSquare,
} from "../icons"
import { isDefined, keyMap, unreachable } from "../utils"
import _ from "lodash"
import {
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react"
import React from "react"
import { Modal } from "../system/Modal"
import { showSnackbar } from "../state/snackbar"
import { openContextMenu } from "../state/contextMenu"

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

export const FocusableNodeClass = "app-focusable-node"

interface NodeRendererProps {
	node: ASTNode
	name?: string
	depth?: number
	depthLines?: number[]
	isLast?: boolean
	isRoot?: boolean
	collapseAndFocusParent: () => void
}

export interface NodeRendererHandle {
	focus(): void
}

function DetailModal(props: {
	node: Extract<ASTNode, { type: "string" }>
	onClose: () => void
}) {
	const { onClose, node } = props

	return (
		<Modal
			onClose={onClose}
			onKeyDown={async e => {
				await keyMap(e, {
					Enter: () => onClose(),
					c: () => {
						navigator.clipboard.writeText(node.value)
						showSnackbar("Copied field value to clipboard!")
					},
				})
			}}
			className="min-w-[min(600px,100vw-40px)] max-w-[calc(100vw-40px)] max-h-[calc(100vh-40px)]"
		>
			<div className="flex">
				<pre className="overflow-scroll px-2 text-xs">{node.value}</pre>
			</div>
		</Modal>
	)
}

export const NodeRenderer = React.memo(
	React.forwardRef(function NodeRendererComponent(
		props: NodeRendererProps,
		ref: React.Ref<NodeRendererHandle>
	) {
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
		const setNodesExpanded = useAppState(state => state.setNodesExpanded)
		const expanded = useAppState(state => state.expandedNodes.has(node))

		const setExpanded = useCallback(
			(newExpanded: boolean) => setNodeExpanded(node, newExpanded),
			[node, setNodeExpanded]
		)

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

		const [detailModalOpen, setDetailModalOpen] = useState(false)
		const closeDetailModal = () => {
			setDetailModalOpen(false)
			containerRef.current?.focus() // Return focus
		}

		const resolvedChildren = useMemo(():
			| Array<[childName: string, childNode: ASTNode]>
			| undefined => {
			if (isNodeWithChildren(node)) {
				if (node.type === "array") {
					return node.children.map((childNode, index) => [
						index.toString(),
						childNode,
					])
				} else if (node.type === "object") {
					return node.children
				} else {
					unreachable(node)
				}
			}
		}, [node])

		const expandable = isDefined(resolvedChildren)

		const doExpand = useCallback(() => {
			if (expandable && expanded) {
				firstChildRef.current?.focus()
			} else {
				setExpanded(true)
			}
		}, [expandable, expanded, setExpanded])

		const doCollapse = useCallback(() => {
			if (!expandable || !expanded) {
				collapseAndFocusParent()
			} else {
				setExpanded(false)
			}
		}, [collapseAndFocusParent, expandable, expanded, setExpanded])

		const setSelfAndAllChildrenExpanded = useCallback(
			(expanded: boolean) => {
				setNodesExpanded(flattenAST(node), expanded)
			},
			[node, setNodesExpanded]
		)

		const handleKeyDown = useCallback(
			async (e: React.KeyboardEvent) => {
				if (document.activeElement === containerRef.current) {
					await keyMap(e, {
						["ArrowRight,l"]: () => {
							doExpand()
						},
						["ArrowLeft,h"]: () => {
							doCollapse()
						},
						["shift+H"]: () => {
							setSelfAndAllChildrenExpanded(false)
						},
						["shift+L"]: () => {
							setSelfAndAllChildrenExpanded(true)
						},
						["Enter"]: () => {
							if (isOverflowing && node.type === "string") {
								setDetailModalOpen(true)
							}
						},
					})
				}
			},
			[
				doCollapse,
				doExpand,
				isOverflowing,
				node.type,
				setSelfAndAllChildrenExpanded,
			]
		)

		const handleContextMenu = useCallback(
			(e: React.MouseEvent) => {
				e.preventDefault()
				openContextMenu({
					position: [e.clientX, e.clientY],
					itemGroups: [
						[
							{
								name: "Expand",
								action: doExpand,
							},
							{
								name: "Expand all",
								action: () => setSelfAndAllChildrenExpanded(true),
							},
						],
						[
							{
								name: "Collapse",
								action: doCollapse,
							},
							{
								name: "Collapse all",
								action: () => setSelfAndAllChildrenExpanded(false),
							},
						],
					],
				})
			},
			[doCollapse, doExpand, setSelfAndAllChildrenExpanded]
		)

		const childCollapseAndFocusParent = useCallback(() => {
			setExpanded(false)
			containerRef.current?.focus()
		}, [setExpanded])

		return (
			<>
				<div
					ref={containerRef}
					className={clsx(
						"flex items-center gap-1 focus:bg-blue-100 outline-none relative group",
						FocusableNodeClass
					)}
					tabIndex={0}
					onKeyDown={handleKeyDown}
					onContextMenu={handleContextMenu}
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
									// Prevent capturing focus
									e.preventDefault()
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
					{isOverflowing && node.type === "string" && (
						<>
							<div className="absolute right-0 top-0 bottom-0 flex items-center group-hover:visible invisible pr-1 pl-6 bg-gradient-to-r from-transparent via-white to-white">
								<IconMagnifyingGlass
									className="cursor-pointer fill-gray-500 hover:fill-black"
									onClick={() => {
										setDetailModalOpen(true)
									}}
									onMouseDown={e => {
										// Prevent capturing focus
										e.preventDefault()
									}}
								/>
							</div>
							{detailModalOpen && (
								<DetailModal onClose={() => closeDetailModal()} node={node} />
							)}
						</>
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
								collapseAndFocusParent={childCollapseAndFocusParent}
							/>
						)
					})}
			</>
		)
	})
)
