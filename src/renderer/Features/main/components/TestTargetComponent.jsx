import React from 'react'

const TestTargetComponent = () => {
	const handleClick = () => {
		console.log('🎯 TestTargetComponent was clicked!')
		alert('🎯 TestTargetComponent was clicked! This means clicks are passing through!')
	}

	return (
		<div
			onClick={handleClick}
			style={{
				position: 'absolute',
				top: '200px',
				left: '50px',
				width: '300px',
				height: '200px',
				backgroundColor: '#ff6b6b',
				border: '3px solid #d63031',
				borderRadius: '10px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				cursor: 'pointer',
				zIndex: 1,
				userSelect: 'none'
			}}
		>
			<div style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>
				�� Click Target Area
				<br />
				<small>This component should receive clicks when the overlay is hidden</small>
			</div>
		</div>
	)
}

export default TestTargetComponent
