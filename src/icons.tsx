// https://reactsvgicons.com/search
// https://yqnn.github.io/svg-path-editor/

export function IconPlusSquare(props: React.SVGProps<SVGSVGElement>) {
	const { children, ...restProps } = props
	return (
		<svg
			viewBox="0 0 1024 1024"
			fill="currentColor"
			height="1em"
			width="1em"
			{...restProps}
		>
			{children}
			<path d="M328 544h152v152c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V544h152c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H544V328c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v152H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z" />
			<path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z" />
		</svg>
	)
}

export function IconMinusSquare(props: React.SVGProps<SVGSVGElement>) {
	const { children, ...restProps } = props
	return (
		<svg
			viewBox="0 0 1024 1024"
			fill="currentColor"
			height="1em"
			width="1em"
			{...restProps}
		>
			{children}
			<path d="M328 544h368c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z" />
			<path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z" />
		</svg>
	)
}

export function IconBraces(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			viewBox="0 0 24 24"
			height="1em"
			width="1em"
			{...props}
		>
			<path stroke="none" d="M0 0h24v24H0z" />
			<path d="M7 4a2 2 0 00-2 2v3a2 3 0 01-2 3 2 3 0 012 3v3a2 2 0 002 2M17 4a2 2 0 012 2v3a2 3 0 002 3 2 3 0 00-2 3v3a2 2 0 01-2 2" />
		</svg>
	)
}

export function IconBracketsLine(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="currentColor"
			height="1em"
			width="1em"
			{...props}
		>
			<path fill="none" d="M0 0h24v24H0z" />
			<path d="M9 3v2H6v14h3v2H4V3h5zm6 0h5v18h-5v-2h3V5h-3V3z" />
		</svg>
	)
}

export function IconSquare(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 1024 1024"
			fill="currentColor"
			height="1em"
			width="1em"
			{...props}
		>
			<rect x="144" y="144" width="736" height="736" />
		</svg>
	)
}
