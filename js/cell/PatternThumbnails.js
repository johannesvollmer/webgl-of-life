// creates an svg dom element based on the brush
window.Create.patternThumbnail = brush => {
	const cellSpacing = {
		x: 1 / brush.width,
		y: 1 / brush.height
	}

	const margin = 0.15
	const cellDimensions = {
		width: (1 - margin) * cellSpacing.x,
		height: (1 - margin) * cellSpacing.y
	}

	// place a rectangle inside the svg
	// for every living cell in the brush
	const rectangles = []
	for(let y = 0; y < brush.height; y++){
		for(let x = 0; x < brush.width; x++){
			if(brush.getCell({x:x, y:y})){
				rectangles.push(Create.svgElement({
					tagName:'rect',
					x: x * cellSpacing.x,
					y: 1 - (y+1) * cellSpacing.y,
					width:  cellDimensions.width,
					height: cellDimensions.height
				}))
			}
		}
	}

	// scale contents of the svg to be aspect-free
	// only scale down to avoid rectangles out of bounds
	const brushAspect = brush.width / brush.height
	const scale = brushAspect < 1
		? { x: brushAspect, y: 1 } // scale down along x axis
		: { x: 1, y: 1/brushAspect } // scale down along y axis

	// offset the group by an amout before scaling
	// to center it inside the svg inside the 32x32 box
	const offset = {
		x: 0.5 * (1 - scale.x),
		y: 0.5 * (1 - scale.y)
	}

	const group = Create.svgElement({
		tagName: 'g', children: rectangles,	style:'fill:#fff', // TODO colors in css
		transform: 	' translate(' + offset.x + ', ' + offset.y + ')'
				+ 	'scale(' + scale.x + ', ' + scale.y + ')'
	})

	return Create.svgElement({
		tagName: 'svg', version:'1.1',
		viewBox:'0 0 1 1', width: '100%', height: '100%',
		class: 'button', children: [group]
	})
}
