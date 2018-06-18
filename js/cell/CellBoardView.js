// displaying the current cell generation is done via opengl
// when mouse dragging or scrolling, the canvas is still full screen and won't move,
// but only the rectangle inside the canvas moves and scales
function CellBoardView(board, canvas){
	this.board = board

	gl.clearColor(0, 0, 0, 0)

	// defines how to render the current cell generation to the webgl canvas
	const material = createCellRenderingShader(true)

	// blend between two cell generations. 0 for last generation, 1 for current generation
	let transitionTarget = 1
	let useTransition = true

	this.setUseTransition = transition => {
		useTransition = transition
		this.requestRender()
	}

	// contains the colors which a living cell can have, depending on the number of neighbours
	// consists of one row with 3 pixels, neighbourcount is x-axis for color picking
	// (the left pixel is the color for lonely cells, and the right pixel for groups)
	let gradientTexture = new Texture2D(gl.RGB)
	this.setLifeGradient = gradient => gradientTexture.setData(
		gradient.length / ['r','g','b'].length, 1, gradient
	)

	this.setAliveColor = (r,g,b) => material.properties.aliveColor.value = [r/255, g/255, b/255, 1]
	this.setDeadColor = (r,g,b) => material.properties.deadColor.value = [r/255, g/255, b/255, 1]

	this.setNeighboursMode = neighbours => {
		material.properties.neighboursMode.value = neighbours
		this.requestRender()
	}

	this.setActivityMode = activity => {
		material.properties.activityMode.value = activity
		this.requestRender()
	}



	this.onBoardResized = () => {
		material.properties.textureSize.value = [ board.getWidth(), board.getHeight() ]
		this.updateGridMultiplier()
		this.updateAspect()
	}

	this.renderRequested = false
	this.requestRender = () => {
		this.renderRequested = true
	}



	const displayFrameBuffer = new OffscreenRenderer()

	// displays the current cell generation on the webgl canvas
	this.render = () => {
		this.renderRequested = false
		gl.clear(gl.COLOR_BUFFER_BIT)

		// update shader variables
		board.getCellTexture().bindAsInputTo(material.properties.cellTexture.value)
		gradientTexture.bindAsInputTo(material.properties.gradient.value)

		material.use()
		TriangleStrip.getFullQuad().draw(material.properties.vertex.location)
	}


	let useGrid = true
	this.setUseGrid = grid => {
		useGrid = grid
		this.updateGridMultiplier()
	}

	this.updateGridMultiplier = () => {
		if(useGrid){
			const rawCellWidth = 1 / board.getWidth()
			const cellWidth = material.properties.scale.value * rawCellWidth // relative to window width
			const cellPxWidth = 2 * cellWidth * canvas.width
			const maxCellPxWidth = 10
			const fade = 0.02

			const gridMultiplier = (cellPxWidth > maxCellPxWidth)
				? Math.min(1 + fade * (cellPxWidth - maxCellPxWidth), 1.4)
				: 1

			material.properties.gridMultiplier.value = gridMultiplier
		}
		else material.properties.gridMultiplier.value = 1

		this.requestRender()
	}


	// update the scale and position of the displayed cell board
	// and blend in a grid if zommed in closely
	this.setViewData = data => {
		material.properties.offset.value[0] = data.offset.x
		material.properties.offset.value[1] = data.offset.y
		material.properties.scale.value = data.scale

		this.updateGridMultiplier()
		this.requestRender()
	}


	this.getShaderAspect = () => material.properties.aspect.value


	this.updateAspect = () => {
		// the rectangle must consider the window aspect for non-squished rendering
		//const inverseTextureAspect = board.getHeight() / board.getWidth()
		const canvasAspect = canvas.width / canvas.height
		const shaderAspect = canvasAspect //* inverseTextureAspect
		material.properties.aspect.value = shaderAspect
	}

	this.onCanvasResized = () => {
		this.updateAspect()
		gl.viewport(0, 0, canvas.width, canvas.height)
		this.requestRender()
	}




	this.incrementGeneration = () => {
		this.setAnimateGenerations(false)
		board.incrementGeneration()

		transitionTarget = 1
		material.properties.transition.value = 0

		this.requestRender()
	}




	let animateGenerations = false // contains if should we iterate the generation per frame
	let generator = new Timer(() => {
		board.incrementGeneration()
		this.requestRender()
	})


	this.setGenerationsPerSecond = gps => {
		generator.setActionsPerSecond(gps)
	}

	this.setGenerationsPerSecond(120)

	this.setAnimateGenerations = shouldPlay => {
		if(animateGenerations != shouldPlay){
			animateGenerations = shouldPlay
			this.requestRender()
			generator.reset()
		}
	}



	let lastUpdate = performance.now()
	let badFrameCount = 0
	const criticalFPS = 5

	const fluidFPS = 17

	// called every frame
	// increment generation if desired
	// and render if necessary
	this.update = () => {
		const now = performance.now()
		const delta = now - lastUpdate
		lastUpdate = now

		if(
			!document.hidden && animateGenerations // if tab active and animating
			&& delta > 1000/criticalFPS // and fps worse than 5
		)
			badFrameCount++
		else badFrameCount = 0

		if(badFrameCount > 5) // we had bad performance 5 frames in a row
			return confirm( // prevent further animation with bad performance
				"Your browser is doing its best to keep this game running,\n" +
				"but you should consider reducing the boardsize or animation speed.\n"
			)

		if(animateGenerations){
			const progress = generator.update()

			if(useTransition){
				// if animation is faster than 17fps,
				// should permanently transition halfway between the two generations
				if(generator.desiredDeltaMillis < 1000/fluidFPS)
					material.properties.transition.value = 0.5

				// if generations are slower than 17 fps
				else material.properties.transition.value = progress
			}
			else material.properties.transition.value = 1
			this.requestRender()
		}
		else {
			if(useTransition){
				const speed = 0.12
				if(material.properties.transition.value < transitionTarget){
					material.properties.transition.value += speed
					this.requestRender()
				}
				if(material.properties.transition.value > transitionTarget){
					material.properties.transition.value = transitionTarget
					this.requestRender()
				}
			}
			else material.properties.transition.value = 1
		}

		return true
	}


	// calculate where the board rectangle is placed on the screen
	// by the opengl rendering shader
	// result in [-1,1] if rectangle is inside the screen
	this.getNormalizedBoardRectangleInCanvas = () => {
		const scale = material.properties.scale.value
		const offset = material.properties.offset.value
		const canvasAspect = material.properties.aspect.value
		const aspect = canvasAspect * board.getHeight() / board.getWidth()

		return {
			x: 		-1 * scale + offset[0], 				// left side x
			y: 		-1 * scale * aspect + offset[1], 	// bottom side y
			width: 	 2 * scale,
			height:  2 * scale * aspect
		}
	}

	// where does that pixel lie inside the canvas? result in [0,1] if inside
	this.getNormalizedPixelInCanvas = pixel => {
		return {
			x: 2 * pixel.x / canvas.width - 1,
			y: 2 * (1 - pixel.y / canvas.height) - 1
		}
	}

	// where in the board does this pixel lie? result in [0,1] if inside
	this.getNormalizedCellInBoard = pixel => {
		const normalizedBoard = this.getNormalizedBoardRectangleInCanvas()
		const normalizedPixel = this.getNormalizedPixelInCanvas(pixel)
		return {
			x: 	(normalizedPixel.x - normalizedBoard.x) / normalizedBoard.width,
			y: 	(normalizedPixel.y - normalizedBoard.y) / normalizedBoard.height
		}
	}

	// which cell is clicked by that pixel in the canvas? result is x and y index
	this.getCellInBoard = pixel => {
		const normalizedPixelInBoard = this.getNormalizedCellInBoard(pixel)
	 	return {
			x: normalizedPixelInBoard.x * board.getWidth(),
			y: normalizedPixelInBoard.y * board.getHeight(),
		}
	}



	// trigger once to initialize
	this.onCanvasResized()
	this.requestRender()

}
