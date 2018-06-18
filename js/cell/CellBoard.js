
// this game of life does everything in webgl 1.0
// these textures each contain the cell state of a single generation
// the evolution of a cell generation is achieved by an opengl shader
// and thus can be evaluated parallelized on the GPU (which should yield better performance than sequential js)
function CellBoard(){
	let width = 0
	let height = 0

	this.getWidth = () => width
	this.getHeight = () => height

	// keep track of the current generation
	this.generation = 0

	// contains the current generation of cells.
	// each pixel represents once cell
	// the red channel contains the alive-state (0 for dead, 1 for alive)
	// the green channel contains the number of neighbours, if updateNeighbourCount has been called
	// the blue channel contains the previous alive-state of that cell (used for animation)
	// caching of neighbour count reduces calculations and texture lookups in the shader
	// gl.NEAREST: disable interpolation to display single pixels instead of smooth gradients
	let cellTexture = new Texture2D(gl.RGB, gl.NEAREST)
	this.getCellTexture = () => cellTexture

	// the new generation of cells will be written into this texture. @see cellTexture
	// disable interpolation to display single pixels instead of smooth gradients
	let temporaryCellTexture = new Texture2D(gl.RGB, gl.NEAREST)


	// set the cell data inside the cell texture
	// a whole w * h * RGB Uint8Array is required, but only the red channel is used
	// the other channels will be initialized in updateNeighbourCount()
	this.setCellData = (data, updateNeighbours = true) => {
		cellTexture.setData(width, height, data)

		if(updateNeighbours)
			this.updateNeighbourCount()
	}

	this.getCellDataRGBA = () => {
		const rgba = new Uint8Array(width * height * ['r','g','b','a'].length)
		offscreenRenderer.readRGBAPixelsFromTexture(cellTexture, rgba)
		return rgba
	}

	this.getCellData = data => {
		// read pixels returns rgba, so we map it to rgb before returning
		const desiredBytesPerPixel = ['r','g','b'].length
		const receivedBytesPerPixel = ['r','g','b','a'].length
		const rgba = this.getCellDataRGBA()

		let dataIndex = 0
		let rgbaIndex = 0
		while(dataIndex < data.length){
			data[dataIndex] = rgba[rgbaIndex] // copy red channel, skip others
			dataIndex += desiredBytesPerPixel
			rgbaIndex += receivedBytesPerPixel
		}

		return { rgba:rgba, rgb:data }
	}


	// contains rules for cell survival. one row with 9 pixels. x index maps to neighbour count
	// e.g. [1,1,0,0,0,0,0,0,0] would cause all cells with 0 or 1 neighbours to survive
	// disable interpolation for rules to obtain either 0 or 1
	const surviveRuleTexture = new Texture2D(gl.LUMINANCE, gl.NEAREST)
	let surviveRule = null

	this.getSurviveRule = () => surviveRule
	this.setSurviveRule = rule => {
		surviveRuleTexture.setData(9, 1, rule) // only one channel needed
		surviveRule = rule
	}


	// contains rules for cell rervival. one row with 9 pixels. x index maps to neighbour count
	// e.g. [0,1,0,1,0,0,0,0,0] would cause all cells to live which have 1 or 3 neighbours
	// disable interpolation for rules to obtain either 0 or 1
	const reviveRuleTexture = new Texture2D(gl.LUMINANCE, gl.NEAREST)
	let reviveRule = null

	this.getReviveRule = () => reviveRule
	this.setReviveRule = rule => {
		reviveRuleTexture.setData(9,1, rule) // only one channel needed
		reviveRule = rule
	}

	// defines the algorithm to render the new cell generation based on the old cell generation
	const convolutionMaterial = createCellConvolutionShader()

	// defines the algorithm to save the neighbour count into the blue channel of the cell texture
	const neighbourMaterial = createNeighbourShader()

	// do not display the process of evolution. instead, do it off screen with this renderer
	const offscreenRenderer = new OffscreenRenderer()


	this.setDimensions = (newWidth, newHeight) => {
		newWidth = Math.floor(newWidth)
		newHeight = Math.floor(newHeight)
		if(width != newWidth || height != newHeight){
			convolutionMaterial.properties.pixelScaling.value = [ 1 / newWidth, 1 / newHeight ]
			neighbourMaterial.properties.pixelScaling.value = [ 1 / newWidth, 1 / newHeight ]

			cellTexture.setData(newWidth, newHeight, null)
			temporaryCellTexture.setData(newWidth, newHeight, null)

			width = newWidth
			height = newHeight
		}
	}


	// render a cached texture based on a source cell generation
	// this will analyze the source cell generation
	// and write the neighbour count of each cell into the green channel
	// while the red channel continues representing the alive state of the cell
	function readNeighbourCountToTexture(sourceCellTexture, targetCellTexture){
		offscreenRenderer.bindWithTargetTexture(targetCellTexture, () => {
			// specify the source generation as input for the cache shader
			sourceCellTexture.bindAsInputTo(neighbourMaterial.properties.cellTexture.value)
			neighbourMaterial.use()

			// actually apply the cache into green and blue channel
			TriangleStrip.getFullQuad().draw(neighbourMaterial.properties.vertex.location)
		})
	}

	// replace the cell texture with a new texture which
	// has the neighbour count inside the green channel
	// and the original alive status in the red channel
	this.updateNeighbourCount = () => {
		const neighbourCellTexture = temporaryCellTexture
		readNeighbourCountToTexture(cellTexture, neighbourCellTexture)
		temporaryCellTexture = cellTexture		// don't throw away the old texture
		cellTexture = neighbourCellTexture		// use the new texture which contains the neighbours
	}


	// the heart of this game of life:
	// the new generation is obtained by rendering a full quad
	// with the convolution material and the old generation texture as input
	// into the future cell texture which is contained in the framebuffer
	this.incrementGeneration = () => {
		offscreenRenderer.bindWithTargetTexture(temporaryCellTexture, () => {

			// specify the current generation of cells as input for the convolution
			cellTexture.bindAsInputTo(convolutionMaterial.properties.cellTexture.value)
			surviveRuleTexture.bindAsInputTo(convolutionMaterial.properties.surviveRule.value)
			reviveRuleTexture.bindAsInputTo(convolutionMaterial.properties.reviveRule.value)
			convolutionMaterial.use()

			// actually render the new generation of cells by applying the rules in the shader
			TriangleStrip.getFullQuad().draw(convolutionMaterial.properties.vertex.location)
		})

		// render the neighbour count of the new generation into the original cellTexture
		readNeighbourCountToTexture(temporaryCellTexture, cellTexture)
		this.generation++
	}



}
