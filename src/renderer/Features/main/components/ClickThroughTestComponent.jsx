import React, { useState } from 'react'
import HoverComponent from '../../common/components/HoverComponent'
import TestTargetComponent from './TestTargetComponent'

const ClickThroughTestComponent = () => {
	const [isOverlayVisible, setIsOverlayVisible] = useState(true)
	const [isTargetClickable, setIsTargetClickable] = useState(true)

	const toggleOverlay = () => {
		setIsOverlayVisible(!isOverlayVisible)
		// When hiding overlay, also make target click-through
		if (isOverlayVisible) {
			setIsTargetClickable(false)
		} else {
			setIsTargetClickable(true)
		}
		console.log(`Overlay is now ${!isOverlayVisible ? 'visible' : 'hidden'}`)
		console.log(`Target is now ${!isOverlayVisible ? 'click-through' : 'clickable'}`)
	}

	return (
		<div style={{ position: 'relative', width: '100%', height: '100vh' }}>
			{/* Test target component - conditionally wrapped with HoverComponent */}
			{isTargetClickable ? (
				<HoverComponent>
					<TestTargetComponent />
				</HoverComponent>
			) : (
				<TestTargetComponent />
			)}

			{/* Toggle button wrapped with HoverComponent */}
			<HoverComponent>
				<div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
					<button
						onClick={toggleOverlay}
						style={{
							padding: '10px 20px',
							backgroundColor: isOverlayVisible ? '#e74c3c' : '#27ae60',
							color: 'white',
							border: 'none',
							borderRadius: '5px',
							cursor: 'pointer',
							fontWeight: 'bold',
							fontSize: '14px'
						}}
					>
						{isOverlayVisible ? '🔒 Hide Overlay' : '👁️ Show Overlay'}
					</button>
					<div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
						Status: {isOverlayVisible ? 'Overlay is blocking clicks' : 'Overlay is hidden - clicks should pass through'}
						<br />
						Target: {isTargetClickable ? 'Clickable' : 'Click-through'}
					</div>
				</div>
			</HoverComponent>

			{/* HoverComponent overlay that can be hidden/shown */}
			{isOverlayVisible && (
				<HoverComponent
					style={{
						position: 'absolute',
						top: '200px',
						left: '50px',
						width: '300px',
						height: '200px',
						backgroundColor: 'rgba(52, 152, 219, 0.8)',
						border: '3px solid #2980b9',
						borderRadius: '10px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 5
					}}
				>
					<div style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>
						🛡️ HoverComponent Overlay
						<br />
						<small>This blocks clicks when visible</small>
					</div>
				</HoverComponent>
			)}
		</div>
	)
}

export default ClickThroughTestComponent
