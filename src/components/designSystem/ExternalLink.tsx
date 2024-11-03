import clsx from "clsx"

export function ExternalLink(
	props: React.DetailedHTMLProps<
		React.AnchorHTMLAttributes<HTMLAnchorElement>,
		HTMLAnchorElement
	>
) {
	const { className, ...restProps } = props
	return (
		<a {...restProps} className={clsx("underline text-blue-700", className)} />
	)
}
