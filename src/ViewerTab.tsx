import clsx from "clsx"

export function ViewerTab(props: { className?: string }) {
	const { className } = props

	return <div className={clsx(className)}>Viewer</div>
}
