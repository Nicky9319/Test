import React, { useRef, useEffect } from 'react'

// Global state to coordinate multiple HoverComponent instances
let globalHoverCount = 0
let globalDisableTimeout = null

// Makes wrapped region clickable even when the window is globally click-through
// by enabling interaction on hover and disabling it when the pointer leaves.
const HoverComponent = ({ children, className, style }) => {
	const hoverDepthRef = useRef(0)

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
			// Cleanup: reduce global count by this instance's hover depth
			if (hoverDepthRef.current > 0) {
				globalHoverCount = Math.max(globalHoverCount - hoverDepthRef.current, 0)
				hoverDepthRef.current = 0
				
				// If no instances are hovered, disable interaction
				if (globalHoverCount === 0) {
					if (globalDisableTimeout) {
						clearTimeout(globalDisableTimeout)
						globalDisableTimeout = null
					}
					disableInteraction()
				}
			}
		}
	}, [])

	const handlePointerEnter = () => {
		// Clear any pending disable timeout
		if (globalDisableTimeout) {
			clearTimeout(globalDisableTimeout)
			globalDisableTimeout = null
		}

		// Increment this instance's hover depth
		hoverDepthRef.current += 1

		// If this is the first hover for this instance, increment global count
		if (hoverDepthRef.current === 1) {
			globalHoverCount += 1
			console.log(`HoverComponent entered. Global hover count: ${globalHoverCount}`)
			
			// Enable interaction if this is the first hovered instance globally
			if (globalHoverCount === 1) {
				enableInteraction()
			}
		}
	}

	const handlePointerLeave = () => {
		// Decrement this instance's hover depth
		hoverDepthRef.current = Math.max(hoverDepthRef.current - 1, 0)

		// If this instance is no longer hovered, decrement global count
		if (hoverDepthRef.current === 0) {
			globalHoverCount = Math.max(globalHoverCount - 1, 0)
			console.log(`HoverComponent left. Global hover count: ${globalHoverCount}`)
			
			// If no instances are hovered globally, disable interaction after delay
			if (globalHoverCount === 0) {
				// Small delay prevents flicker when moving between components
				globalDisableTimeout = setTimeout(() => {
					disableInteraction()
					globalDisableTimeout = null
					console.log('Interaction disabled - no HoverComponents hovered')
				}, 75)
			}
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
