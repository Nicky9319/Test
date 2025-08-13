import React, { useRef, useEffect } from 'react'

// Makes wrapped region clickable even when the window is globally click-through
// by enabling interaction on hover and disabling it when the pointer leaves.
const HoverComponent = ({ children, className, style }) => {
	const hoverDepthRef = useRef(0)
	const disableTimeoutRef = useRef(null)

	const enableInteraction = () => {
		try {
			window.electronAPI?.enableInteraction?.()
		} catch {}
	}

	const disableInteraction = () => {
		try {
			window.electronAPI?.disableInteraction?.()
		} catch {}
	}

	useEffect(() => {
		return () => {
			if (disableTimeoutRef.current) {
				clearTimeout(disableTimeoutRef.current)
				disableTimeoutRef.current = null
			}
			// Ensure we don't leave the window in interactive state by accident
			disableInteraction()
		}
	}, [])

	const handlePointerEnter = () => {
		if (disableTimeoutRef.current) {
			clearTimeout(disableTimeoutRef.current)
			disableTimeoutRef.current = null
		}
		hoverDepthRef.current += 1
		if (hoverDepthRef.current === 1) {
			enableInteraction()
		}
	}

	const handlePointerLeave = () => {
		hoverDepthRef.current = Math.max(hoverDepthRef.current - 1, 0)
		if (hoverDepthRef.current === 0) {
			// Small delay prevents flicker when moving between nested children
			disableTimeoutRef.current = setTimeout(() => {
				disableInteraction()
				disableTimeoutRef.current = null
			}, 75)
		}
	}

	const handlePointerDown = () => {
		// Ensure we are interactive right before handling the click
		enableInteraction()
	}

	return (
		<div
			className={className}
			style={{ pointerEvents: 'auto', ...style }}
			onPointerEnter={handlePointerEnter}
			onPointerLeave={handlePointerLeave}
			onPointerDown={handlePointerDown}
		>
			{children}
		</div>
	)
}

export default HoverComponent
