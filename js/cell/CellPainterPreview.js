
// display the cell paint brush
// to visually preview a brush stroke
// this function draws a little rectangle with the brush texture onto the board
function CellPainterPreview(boardView){

	const material = createBrushRenderingShader()
	const brushTexture = new Texture2D(gl.LUMINANCE, gl.NEAREST)



	const isEven = n => (n % 2 == 0)
	this.setBrushPreviewCellPosition = cellPosition => {
		const offset = material.properties.brushOffset.value

		if(!isEven(brushTexture.getHeight()))
			offset[1] = Math.floor(cellPosition.y)

			// the center of the brush is between two cells
			// so we must offset the snapping by 0.5 cells
		else offset[1] = Math.floor(cellPosition.y - 0.5) + 0.5


		if(!isEven(brushTexture.getWidth()))
			offset[0] = Math.floor(cellPosition.x)
		else offset[0] = Math.floor(cellPosition.x - 0.5) + 0.5
	}

	this.setBrushPreview = newBrush => {
		const data = new Uint8Array(newBrush.cells.length)
		for(let cell = 0; cell < data.length; cell++)
			data[cell] = newBrush.cells[cell]? 255 : 0

		brushTexture.setData(newBrush.width, newBrush.height, data)
		material.properties.brushSize.value = [newBrush.width, newBrush.height]
	}




	this.render = () => {
		this.renderRequested = false

		material.use()
		brushTexture.bindAsInputTo(material.properties.brushTexture.value)

		gl.enable(gl.BLEND) // enable transparent overlay
      	gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
		TriangleStrip.getFullQuad().draw(material.properties.vertex.location)
		gl.disable(gl.BLEND)
	}

	this.renderRequested = false
	this.requestRender = () => {
		this.renderRequested = true
	}

	this.updateAspect = () => {
		material.properties.aspect.value = boardView.getShaderAspect()
	}

	this.onCanvasResized = () => {
		this.updateAspect()
		this.requestRender()
	}
	this.onCanvasResized()


	this.onBoardResized = () => {
		this.updateAspect()
		material.properties.boardSize.value = [
			boardView.board.getWidth(),
			boardView.board.getHeight()
		]
	}


	this.setViewData = data => {
		material.properties.offset.value[0] = data.offset.x
		material.properties.offset.value[1] = data.offset.y
		material.properties.scale.value = data.scale
		this.requestRender()
	}

}
