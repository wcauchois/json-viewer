import clsx from "clsx"
import { useAppState } from "../../state/app"
import {
	ASTNode,
	ASTNodeWithValue,
	astToJson,
	flattenAST,
	isNodeWithChildren,
	isNodeWithValue,
} from "../../lib/jsonAst"
import {
	IconBraces,
	IconBracketsLine,
	IconMagnifyingGlass,
	IconMinusSquare,
	IconPlusSquare,
	IconSquare,
} from "../../lib/icons"
import { isDefined, keyMap, unreachable } from "../../lib/utils"
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
import { Modal } from "../designSystem/Modal"
import { showSnackbar } from "../../state/snackbar"
import { openContextMenu } from "../../state/contextMenu"

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
						showSnackbar("Value copied to clipboard.")
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
		const expandedNodes = useAppState(state => state.expandedNodes)
		const expanded = useMemo(
			() => expandedNodes.has(node),
			[expandedNodes, node]
		)

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

			const definedEl = el
			function updateIsOverflowing() {
				// https://stackoverflow.com/a/10017343
				setIsOverflowing(definedEl.offsetWidth < definedEl.scrollWidth)
			}

			const observer = new ResizeObserver(() => {
				updateIsOverflowing()
			})
			observer.observe(el)
			updateIsOverflowing()

			return () => observer.disconnect()
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

		const expandOrFocusFirstChild = useCallback(() => {
			if (expandable && expanded) {
				firstChildRef.current?.focus()
			} else {
				setExpanded(true)
			}
		}, [expandable, expanded, setExpanded])

		const collapseOrFocusParent = useCallback(() => {
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

		const setSelfAndFirstLevelExpanded = useCallback(() => {
			setNodesExpanded(
				[
					node,
					...(node.type === "object"
						? node.children.map(c => c[1])
						: node.type === "array"
							? node.children
							: []),
				],
				true
			)
		}, [node, setNodesExpanded])

		const doCopyToClipboard = useCallback(() => {
			let copyText: string
			if (node.type === "string") {
				copyText = node.value
			} else {
				copyText = JSON.stringify(astToJson(node))
			}
			navigator.clipboard?.writeText(copyText)

			let snackbarText: string
			if (node.type === "array") {
				snackbarText = "Array copied to clipboard"
			} else if (node.type === "object") {
				snackbarText = "Object copied to clipboard"
			} else {
				snackbarText = "Value copied to clipboard"
			}
			showSnackbar(snackbarText)
		}, [node])

		const handleKeyDown = useCallback(
			async (e: React.KeyboardEvent) => {
				if (document.activeElement === containerRef.current) {
					// Note: "j" and "k" are handled higher up in ViewerTab.
					await keyMap(e, {
						["ArrowRight,l"]: () => {
							expandOrFocusFirstChild()
						},
						["ArrowLeft,h"]: () => {
							collapseOrFocusParent()
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
						["c"]: () => {
							doCopyToClipboard()
						},
					})
				}
			},
			[
				collapseOrFocusParent,
				expandOrFocusFirstChild,
				isOverflowing,
				setSelfAndAllChildrenExpanded,
				node,
				doCopyToClipboard,
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
								action: expandOrFocusFirstChild,
							},
							{
								name: "Expand all",
								action: () => setSelfAndAllChildrenExpanded(true),
							},
							{
								name: "Expand first level",
								action: () => setSelfAndFirstLevelExpanded(),
							},
						],
						[
							{
								name: "Collapse",
								action: collapseOrFocusParent,
							},
							{
								name: "Collapse all",
								action: () => setSelfAndAllChildrenExpanded(false),
							},
						],
					],
				})
			},
			[
				collapseOrFocusParent,
				expandOrFocusFirstChild,
				setSelfAndAllChildrenExpanded,
				setSelfAndFirstLevelExpanded,
			]
		)

		const handleMouseDown = useCallback(
			(e: React.MouseEvent) => {
				if (e.metaKey) {
					doCopyToClipboard()
				}
			},
			[doCopyToClipboard]
		)

		const childCollapseAndFocusParent = useCallback(() => {
			setExpanded(false)
			containerRef.current?.focus()
		}, [setExpanded])

		/*
		TODO
		const findQuery = useAppState(state => state.findQuery)
		const findMatchCount = useAppState(state => state.findMatchCount)
		const setFindMatchCount = useAppState(state => state.setFindMatchCount)
		const findCurrentMatchIndex = useAppState(
			state => state.findCurrentMatchIndex
		)

		const isMatch = useMemo(() => {
			if (!findQuery) return false
			if (isNodeWithValue(node)) {
				if (node.type === "null") return false
				const value = String(node.value)
				return value.toLowerCase().includes(findQuery.toLowerCase())
			}
			return false
		}, [findQuery, node])

		useEffect(() => {
			if (isMatch) {
				setFindMatchCount(findMatchCount + 1)
			}
		}, [isMatch, findMatchCount, setFindMatchCount])

		useEffect(() => {
			if (isMatch && findCurrentMatchIndex === findMatchCount) {
				containerRef.current?.scrollIntoView({
					block: "nearest",
					inline: "nearest",
					behavior: "smooth",
				})
			}
		}, [isMatch, findCurrentMatchIndex, findMatchCount])
		*/
		const isMatch = false
		const isCurrentMatch = false

		return (
			<>
				<div
					ref={containerRef}
					className={clsx(
						"flex items-center gap-1 focus:bg-blue-100 outline-none relative group",
						FocusableNodeClass,
						isMatch && "bg-yellow-100",
						isCurrentMatch && isMatch && "bg-yellow-200"
					)}
					tabIndex={0}
					onKeyDown={handleKeyDown}
					onContextMenu={handleContextMenu}
					onMouseDown={handleMouseDown}
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
