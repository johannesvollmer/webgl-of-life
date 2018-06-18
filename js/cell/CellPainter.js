
// contains all functionality for modifying the board cells
// TODO serialization should have its own file
function CellPainter(board, defaultBrush){
	const bytesPerPixel = ['r', 'g', 'b'].length

	// two thirds of this array are unused (green and blue channel)
	// but constructing a new array each time would have worse performance
	// we must use rgb and cannot have luminance textures anyways,
	// because luminance textures cannot be used as render target
	let cellData = new Uint8Array(0)



	this.board = board
	this.brush = defaultBrush

	this.brushSettings = {
		mode: CellPainter.MODE.INVERT,
		flip: { x:false, y:false },
		rotation: 0
	}


	this.writePaintingToBoard = (updateNeighbours = true) => {
		board.setCellData(cellData, updateNeighbours)
		board.generation = 0
		this.saveToSession()
	}

	this.readPaintingFromBoard = () => {
		if(board.generation !== 0){
			board.getCellData(cellData)
			board.generation = 0
		}
	}

	let oldDimensions = null
	this.onBoardResized = () => {
		const width = board.getWidth()
		const height = board.getHeight()
		const length = width * height * bytesPerPixel
		if(cellData.length !== length){
			const oldCellData = cellData
			cellData = new Uint8Array(length)

			if(oldDimensions){
				const oldWidth = oldDimensions.width
				const oldHeight = oldDimensions.height
				const offset = {
					x: Math.round((width - oldWidth) / 2),
					y: Math.round((height - oldHeight) / 2),
				}

				// repaint old data, centered inside the new board
				for(let y = 0; y < height; y++){
					for(let x = 0; x < width; x++){
						const old = { x: x - offset.x, y: y - offset.y }
						if(
							old.x < oldWidth && old.x >= 0
							&& old.y < oldHeight && old.y >= 0
						){
							const newIndex = (y * width + x) * bytesPerPixel
							const oldIndex = (old.y * oldWidth + old.x) * bytesPerPixel
							cellData[newIndex] = oldCellData[oldIndex]
						}
					}
				}
			}

			this.writePaintingToBoard()
		}

		oldDimensions = {
			width: width, height: height
		}
	}



	const setCellPainted = cell => {
		const x = Math.floor(cell.x)
		const y = Math.floor(cell.y)

		// non-integer indices will append an element to the end of the buffer
		// thus floor is required. What.
		if(x >= 0 && y >= 0 && x < board.getWidth() && y < board.getHeight()){
			const index = Math.floor((y * board.getWidth() + x) * bytesPerPixel)
			cellData[index] = this.brushSettings.mode(cellData[index] > 128)? 255 : 0
			return true // cell was painted
		}
		else return false // nothing changed
	}

	this.paint = cell => {
		this.readPaintingFromBoard()
		let wereCellsPainted = false
		const brush = this.brush
		for(let y = 0; y < brush.height; y++){
			for(let x = 0; x < brush.width; x++){
				if(brush.getCell({x:x, y:y})){
					if(setCellPainted({
						x: cell.x + x - brush.center.x + 0.5,
						y: cell.y + y - brush.center.y + 0.5,
					})){
						wereCellsPainted = true
					}
				}
			}
		}
		this.writePaintingToBoard()
		return wereCellsPainted
	}


	this.clear = () => {
		cellData.fill(0)
		this.writePaintingToBoard()
	}

	this.randomize = () => {
		const width = board.getWidth()
		const height = board.getHeight()
		const centerX = width / 2
		const centerY = height / 2
		const maxSquareLength = centerX * centerX + centerY * centerY

		let index = 0
		for(let y = 0; y < height; y++){
			for(let x = 0; x < width; x++){
				const centeredX = x - centerX
				const centeredY = y - centerY
				const squareLength = (centeredX * centeredX + centeredY * centeredY)
				const normalizedCenter = 1 - (squareLength / maxSquareLength)
				const normalizedLife = Math.pow(normalizedCenter, 8)
				cellData[index] = Math.random() > normalizedLife * 0.4? 0 : 255
				index += bytesPerPixel
			}
		}

		this.writePaintingToBoard()

		// do some generations to remove lonely cells
		board.incrementGeneration()
		board.incrementGeneration()

		this.readPaintingFromBoard()
		this.saveToSession()
	}





	this.loadFromString = stringData => {
		cellData.fill(0)

		for(let index of stringData.split(' '))
			cellData[parseInt(index)] = 255

		this.writePaintingToBoard()
	}

	function cellDataToString(cellData){
		const activeCellIndices = []
		for(let i = 0; i < cellData.length; i += bytesPerPixel)
			if(cellData[i] > 128) activeCellIndices.push(i)

		return activeCellIndices.join(' ')
	}
	this.saveToString = () => {
		return cellDataToString(cellData, bytesPerPixel)
	}





	this.restoreSession = loadDimensions => {
		const cachedCellData = sessionStorage.getItem('cell-data')
		if(cachedCellData){
			const width = sessionStorage.getItem('board-width')
			const height = sessionStorage.getItem('board-height')
			loadDimensions(parseInt(width), parseInt(height))
			this.loadFromString(cachedCellData)
			return true
		}
		else return false
	}

	// reuse painted data on page reload
	this.saveToSession = () => {
		sessionStorage.setItem('board-width', Math.floor(board.getWidth()))
		sessionStorage.setItem('board-height', Math.floor(board.getHeight()))
		sessionStorage.setItem('cell-data', this.saveToString())
	}


	this.loadFromSVGString = (svg, loadDimensions) => {
		const svgDOM = new DOMParser().parseFromString(svg, 'image/svg+xml')
		const svgElement = svgDOM.getElementById('game-data-element')
		if(svgElement){
			const width = svgElement.getAttributeNS(null, 'boardWidth')
			const height = svgElement.getAttributeNS(null, 'boardHeight')
			const gameData = svgElement.getAttributeNS(null, 'rawGameOfLifeData')
			if(gameData && width && height){
				loadDimensions(width, height)
				this.loadFromString(gameData)
				return true
			}
		}
	}

	this.saveToSVGString = (deadColor, aliveColor, grid) => {
		const w = board.getWidth()
		const h = board.getHeight()
		const cellData = board.getCellData(new Uint8Array(w * h * ['r', 'g', 'b'].length))
		const bytesPerPixel = ['r', 'g', 'b', 'a'].length

		function isGrid(x,y){
			return x % 2 !== y % 2
		}

		const rectangles = []
		for(let y = 0; y < h; y++){
			for(let x = 0; x < w; x++){
				if(cellData.rgba[(w*y + x) * bytesPerPixel] > 128){
					rectangles.push(Create.svgElement({
						tagName: 'use', x: x, y: h - 1 - y,
						href: isGrid(x,y)? '#dark' : '#light'
					}))
				}
			}
		}

		const svg = Create.svgElement({
			tagName: 'svg', version: '1.1',
			viewBox: '0 0 ' + w + ' ' + h,
			width: w*20, height: h*20,
			id:'game-data-element',
			boardWidth: w, boardHeight: h,
			rawGameOfLifeData: cellDataToString(
				cellData.rgb, ['r','g','b'].length
			),
			children: [
				Create.svgElement({
					tagName: 'symbol', id:'light', children:[
						Create.svgElement({
							tagName: 'rect', x:0, y:0,
							width: 1, height: 1,
							style: `
								fill: ${aliveColor};
								stroke:none;
							`
						})
					]
				}),
				Create.svgElement({
					tagName: 'symbol', id:'dark', children:[
						Create.svgElement({
							tagName: 'rect', x:0, y:0,
							width: 1, height: 1,
							style: `
								fill: ${aliveColor};
								opacity: 0.9;
								stroke:none;
							`
						})
					]
				}),
				Create.svgElement({
						tagName: 'rect', x:0, y:0,
						width: w, height: h,
						style: `
							fill: ${deadColor};
							stroke:none;
						`
				}),
				Create.svgElement({
					tagName: 'g',
					children: rectangles
				})
			]
		})

		return new XMLSerializer().serializeToString(svg)
	}

}

CellPainter.MODE = {
	INVERT: cell => !cell,
	ADD: cell => true,
	REMOVE: cell => false,
	RANDOM: cell => Math.random() < 0.5,
}

CellPainter.Brush = function(name, category, width, height, cells){
	this.name = name
	this.category = category
	this.cells = cells
	this.width = width
	this.height = height
	this.center = { x: width / 2, y: height / 2 }
	this.getCell = cell => this.cells[cell.y * this.width + cell.x]
}
