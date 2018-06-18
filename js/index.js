function setup(){
	// create a function alias of document.getElementById
	const id = document.getElementById.bind(document)


	// try loading a webgl context for our canvas into window.gl
	const canvas = id('gl')
	window.gl = (() => {
		for (let contextName of ['experimental-webgl', 'webgl']){
			try {
				const gl = canvas.getContext(contextName, { antialias: true })
				if (gl) return gl
			}
			catch (ignored) {}
		}
	})()

	if(!window.gl){
		alert("Webgl could not be loaded. Please use a browser which supports WebGL.")
	}


	// contains cells, rules and functions to increment by one generation
	const board = new CellBoard(50, 25)

	// contains everything to display the board
	const boardView = new CellBoardView(board, canvas)
	boardView.setDeadColor(20, 20, 40) // black
	boardView.setAliveColor(240, 100, 70) // red
	boardView.setLifeGradient(new Uint8Array([
		20, 20, 40,  	// black, few neighbours
		40, 60, 80,  	// blue, some neighbours
		240, 100, 70, 	// red, few neighbours
		240, 200, 10,  	// yellow, some neighbours
		240, 240, 240  	// white, many neighbours
	]))

	const defaultBrushes = getDefaultPatterns()


	// keeps a copy of the cells in ram, which it modifies
	// and provides the functionality to upload it to the cell-board
	const painter = new CellPainter(board, defaultBrushes.dot)

	// display the painting brush, to show where we would paint
	const painterPreview = new CellPainterPreview(boardView)
	painterPreview.setBrushPreview(painter.brush) // update once


	// this will compute camera offset and movement
	// based on mouse drag an mouse wheel on the canvas
	// on change detected, apply these values to the opengl materials
	const viewMotionDetector = new ScaleAndDragDetector(
		canvas, viewData => {
			boardView.setViewData(viewData)
			painterPreview.setViewData(viewData)
		}
	)


	const increment = id('increment-time')
	const resetView = id('reset-view')

	const paint = id('paint')
	const showSettings = id('show-settings')

	const paintSettings = id('brush')
	const settings = id('settings')

	const resetTime = id('reset-time')
	const animate = id('animate-time')

	const clearBoard = id('clear-board')
	const randomizeBoard = id('randomize-board')

	const brushPatterns = id('patterns')

	const boardWidth = id('board-width')
	const boardHeight = id('board-height')

	const patternModeAdd = id('pattern-mode-add')
	const patternModeRemove = id('pattern-mode-remove')
	const patternModeInvert = id('pattern-mode-invert')

	const loadSVG = id('load-svg')
	const saveSVG = id('save-svg')

	const speed = id('speed')
	const transition = id('transition')
	const grid = id('grid-view')

	const life = id('life-view')
	const neighbours = id('neighbour-view')
	const activity = id('activity-view')

	const surviveRules = id('survive-rules')
	const reviveRules = id('revive-rules')

	const zoomSensitivity = id('sensitivity')
	const generation = id('generation-value')

	let mouseIsHoveringCanvas = false
	let hasCustomContent = false


	// souce: https://stackoverflow.com/questions/3944122/detect-left-mouse-button-press
	function isLeftButton(event){
		if('buttons' in event) return event.buttons === 1
		else if ('which' in event) return event.which === 1
		else return event.button === 1
	}


	// disable default context menu on right click
	document.addEventListener('contextmenu', e => {
		e.preventDefault()
		return false
	})


	// create an array containing the rules for our game
	// the array has 9 elements, whith each index representing a neighbour count
	function getRules(type){
		const rules = new Uint8Array(9)
		for(let neighbours = 0; neighbours < 9; neighbours++) {
			const checkbox = id(type + '-' + neighbours)
			rules[neighbours] = checkbox.checked? 255 : 0
		}
		return rules
	}


	// read the view and update the model manually
	// (which would not be necessary if changing values via JS
	// would trigger 'change'-event-listeners)

	// updating the rules for our game
	function updateSurviveRules(){
		board.setSurviveRule(getRules('survive'))
	}
	// changing the rules makes the current generation our initial generation
	// {passive: true}  can have better performance
	// but can only be used when e.preventDefault() is not called
	surviveRules.addEventListener('click', updateSurviveRules, {passive: true})
	updateSurviveRules() // do it once for initialization


	function updateReviveRules(){
		board.setReviveRule(getRules('revive'))
	}
	reviveRules.addEventListener('click', updateReviveRules, {passive: true})
	updateReviveRules()


	function setBoardDimensions(width, height){
		boardWidth.value = width
		boardHeight.value = height
		updateBoardSize()
	}



	// the painter will write its state to the window.session,
	// so that reloading the page won't erase our celldata.
	// when the page is opened for the first time, we paint a jet onto the board
	if(!painter.restoreSession(setBoardDimensions)){
		updateBoardSize()
		painter.brush = defaultBrushes.jet
		painter.paint({x: board.getWidth() / 2, y: board.getHeight() / 2})
		painter.brush = defaultBrushes.dot
	}




	// 'download' the current board as SVG file
	// TODO serialization logic should not be inside the painter, but the board
	function saveAsSVG(){
		// source https://stackoverflow.com/questions/38477972/javascript-save-svg-element-to-file-on-disk
		const svg =  painter.saveToSVGString('#224','#f86').replace(/></g, '>\n\r<')
		const href = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svg)

		Create.element({
			tagName: 'a', target: '_blank', href:href,
			download: 'game-of-life-board.svg'
		})
		.dispatchEvent(new MouseEvent('click', {
			view: window, bubbles: false, cancelable: true
		}))
	}
	saveSVG.addEventListener('click', saveAsSVG)

	// 'upload' an svg file to the board
	// TODO serialization logic should not be in the painter, but the board
	loadSVG.addEventListener('click', e => {
		if(e.target.files && e.target.files.length){
			const reader = new FileReader()
			reader.onload = e => {
				if(e.target.readyState === 2){
					if(e.target.error) alert('Error while reading file')

					else painter.loadFromSVGString(
						e.target.result, setBoardDimensions
					)
				}
			}
			reader.readAsText(e.target.files[0])
		}
	})
	function loadFromSVG(){
		loadSVG.dispatchEvent(new MouseEvent('click', {
			view: window, bubbles: false, cancelable: true
		}))
	}

	// keep track of if the mouse is hovering the canvas
	canvas.addEventListener('mouseleave', e => {
		mouseIsHoveringCanvas = false
		boardView.requestRender()
	}, {passive: true})
	canvas.addEventListener('mouseenter', e => {
		mouseIsHoveringCanvas = true
		boardView.requestRender()
	}, {passive: true})


	const losePaintedDataWarning = 'Warning: You will lose all your painted data.'

	// reset the board and display a warning if the user has painted something
	clearBoard.addEventListener('click', e => {
		if(!hasCustomContent || confirm(losePaintedDataWarning)){
			hasCustomContent = false
			boardView.requestRender()
			painter.clear()
		}
	}, {passive: true})

	// fill the board randomly and display a warning if the user has painted something
	randomizeBoard.addEventListener('click', e => {
		if(!hasCustomContent || confirm(losePaintedDataWarning)){
			hasCustomContent = false
			boardView.requestRender()
			painter.randomize()
		}
	}, {passive: true})


	// update the board cell resolution according to the UI values
	function updateBoardSize(){
		board.setDimensions(boardWidth.value, boardHeight.value)
		boardView.onBoardResized()
		painter.onBoardResized()
		painterPreview.onBoardResized()
		boardView.requestRender()
	}
	boardWidth.addEventListener('change', updateBoardSize, {passive: true})
	boardHeight.addEventListener('change', updateBoardSize, {passive: true})
	updateBoardSize()


	// keep the canvas fullscreen at all times
	// otherwise, it will look blurry and
	// and mouse events will not contain any meaningfull coordinates
	function onCanvasResize(){
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight
		boardView.onCanvasResized(canvas)
		painterPreview.onCanvasResized(canvas)
	}
	window.addEventListener('resize', onCanvasResize, {passive: true})
	onCanvasResize() // trigger once to initialize


	// disable the reset-button if there is nothing to reset
	let resetEnabled = false
	function updateResetEnabled(){
		resetEnabled = (board.generation !== 0)
		if(resetEnabled) resetTime.parentElement.classList.remove('disabled-option')
		else resetTime.parentElement.classList.add('disabled-option')
	}
	updateResetEnabled()


	function resetBoardTime(){
		if(resetEnabled){
			painter.writePaintingToBoard()
			boardView.requestRender()
			updateResetEnabled()
		}
	}
	resetTime.addEventListener('click', resetBoardTime, {passive: true})


	// delegate events to camera / motion detector
	function stopDraggingMotion(){
		viewMotionDetector.endMove()
		setPaintingCursor(paint.checked)
	}
	canvas.addEventListener('mouseup', stopDraggingMotion, {passive: true})
	canvas.addEventListener('mouseleave', stopDraggingMotion, {passive: true})
	canvas.addEventListener('mousemove', event => { // TODO clamp to borders
		viewMotionDetector.onMouseMove(event)
	}, {passive: true})
	document.addEventListener('wheel', e => {
		if(mouseIsHoveringCanvas){
			viewMotionDetector.onScroll(e)
			e.preventDefault()
		}
	})

	// TODO touchstart->detector.startMove

	// touchpad support
	canvas.addEventListener('touchmove', event => { // TODO clamp to borders
		if(event.targetTouches.length == 2)
			viewMotionDetector.onMouseMove(event)
	}, {passive: true})


	// update brush preview position, if in paint mode
	canvas.addEventListener('mousemove', event => {
		if(paint.checked){
			painterPreview.requestRender()
			painterPreview.setBrushPreviewCellPosition(
				boardView.getCellInBoard({
					x: event.clientX, y: event.clientY
				})
			)
		}
	}, {passive: true})


	// paint cells if in paint mode, otherwise move the view
	canvas.addEventListener('mousedown', event => {
		let cellPainted = false

		if(paint.checked && isLeftButton(event)){
			cellPainted = painter.paint(
				boardView.getCellInBoard({
					x: event.clientX,
					y: event.clientY
				})
			)
		}

		boardView.requestRender()
		updateResetEnabled()

		if(!cellPainted) {
			viewMotionDetector.startMove(event)
			setPaintingCursor(false)
		}
		else hasCustomContent = true

	}, {passive: true})


	function updateTransition(){
		boardView.setUseTransition(transition.checked)
	}
	transition.addEventListener('click', updateTransition, {passive: true})
	updateTransition()


	function updateAnimationSpeed(){
		boardView.setGenerationsPerSecond(speed.value)
	}
	speed.addEventListener('change', updateAnimationSpeed, {passive: true})
	updateAnimationSpeed()


	function updateZoomSensitivity(){
		viewMotionDetector.scaleSensitivity = 0.003 * zoomSensitivity.value
	}
	zoomSensitivity.addEventListener('change', updateZoomSensitivity, {passive: true})
	updateZoomSensitivity()


	// if enabled, this increments the generation continuously over time
	// which is controlled by the play/pause button
	function updateAnimateGenerations(){
		boardView.setAnimateGenerations(animate.checked)
		updateResetEnabled()
	}
	function setAnimateGenerations(enabled){
		animate.checked = enabled
		updateAnimateGenerations()
	}
	animate.addEventListener('click', updateAnimateGenerations, {passive: true})
	updateAnimateGenerations()


	// stop animation, when switching tabs or minimizing window
	window.addEventListener('blur', e => setAnimateGenerations(false), {passive: true})


	// the view mode is either life, activity, or cluster
	function updateViewMode(){
		boardView.setActivityMode(activity.checked)
		boardView.setNeighboursMode(neighbours.checked)
	}
	function setViewMode(mode){
		mode.checked = true
		updateViewMode()
	}
	life.addEventListener('click', updateViewMode, {passive: true})
	neighbours.addEventListener('click', updateViewMode, {passive: true})
	activity.addEventListener('click', updateViewMode, {passive: true})
	updateViewMode()


	// checkerboard overlay enabling / disabling
	function updateGrid(){
		boardView.setUseGrid(grid.checked)
		boardView.requestRender()
	}
	function setGrid(enabled){
		grid.checked = enabled
		updateGrid()
	}
	grid.addEventListener('click', updateGrid, {passive: true})
	updateGrid()


	// single generation increment
	function incrementGeneration(){
		setAnimateGenerations(false)
		boardView.incrementGeneration()
		updateResetEnabled()
	}
	increment.addEventListener('click', incrementGeneration, {passive: true})


	// reset camera to full-screen-board
	function resetViewToInitial(){
		viewMotionDetector.reset()
	}
	resetView.addEventListener('click', resetViewToInitial, {passive: true})
	resetViewToInitial()


	// show or hide settings, depending on toolbar checkbox
	function updateShowSettings(){
		settings.classList[showSettings.checked? 'remove' : 'add']('hidden')
	}
	showSettings.addEventListener('click', updateShowSettings, {passive: true})
	updateShowSettings()


	// brush mode settings (invert, add, remove)
	function updatePaintCellMode(){
		if(patternModeAdd.checked)
			painter.brushSettings.mode = CellPainter.MODE.ADD

		if(patternModeRemove.checked)
			painter.brushSettings.mode = CellPainter.MODE.REMOVE

		if(patternModeInvert.checked)
			painter.brushSettings.mode = CellPainter.MODE.INVERT
	}
	function setPaintCellMode(mode){
		mode.checked = true // this will uncheck the other modes
		updatePaintCellMode()
	}
	patternModeAdd.addEventListener('click', updatePaintCellMode, {passive: true})
	patternModeRemove.addEventListener('click', updatePaintCellMode, {passive: true})
	patternModeInvert.addEventListener('click', updatePaintCellMode, {passive: true})
	setPaintCellMode(patternModeInvert)


	// set cursor to 'grab' (if not painting) or to custom (if painting)
	function setPaintingCursor(painting){
		canvas.classList.add(painting? 'brush-cursor' : 'move-cursor')
		canvas.classList.remove(painting? 'move-cursor' : 'brush-cursor')
	}


	// enter / exit paint mode
	// if entering, switch to default view
	// generate brush dom if not already generated
	function updatePaintMode(){
		boardView.requestRender()
		if(paint.checked) {
			setViewMode(life)
			setPaintCellMode(patternModeInvert)
			if(brushPatterns.children.length == 0)
				generateBrushPatterns()
		}
		setPaintingCursor(paint.checked)
		paintSettings.classList[paint.checked? 'remove' : 'add']('hidden')
	}
	function setPaintMode(enabled){
		paint.checked = enabled
		updatePaintMode()
	}
	paint.addEventListener('click', updatePaintMode, {passive: true})
	updatePaintMode()


	// generate dom for the paintbrush selection
	function generateBrushPatterns(){
		function createBrushPatternUI(brush){
			const checkBox = Create.element({
				tagName: 'input', type: 'radio', className: 'hidden',
				name: 'pattern', checked: (brush === painter.brush)
			})

			const svgThumb = Create.patternThumbnail(brush)

			const tooltip = Create.element({
				tagName: 'p', className: 'tooltip aside',
				children: [
					Create.element({
						tagName: 'b', innerHTML: brush.name
					}),
					Create.element({
						tagName: 'span', className:"info",
						innerHTML: brush.category + '<br>(for Conway Rules 2-3/3)'
					})
				]
			})

			const patternLabel = Create.element({
				tagName: 'label',
				children: [ checkBox, svgThumb, tooltip ]
			})

			function updateBrush(){
				// if selected, set this brush as the current brush
				if(checkBox.checked){
					painter.brush = brush
					painterPreview.setBrushPreview(brush)
					painterPreview.requestRender()
				}
			}

			patternLabel.addEventListener('click', updateBrush)
			updateBrush()


			return patternLabel
		}

		for(let brush in defaultBrushes)
			brushPatterns.appendChild(createBrushPatternUI(defaultBrushes[brush]))
	}


	// just a static keyname-integer map,
	// because some old browsers like chrome 61 or firefox 52
	// still use hardcoded integer-codes instead of named constants in 2017
	const keyCodes = {
		space: 32, tab: 9, escape: 27,
		one: 49, two: 50, three: 51,
		c: 67, b: 66, f: 70, s: 83, o: 79
	}

	// declare key-bound actions
	const shortcuts = {
		[keyCodes.tab]: e => setPaintMode(!paint.checked),	// toggle paint mode with tab

		// use numbers for view mode
		[keyCodes.one]: e => setViewMode(life),
		[keyCodes.two]: e => setViewMode(activity),
		[keyCodes.three]: e => setViewMode(neighbours),

		[keyCodes.c]: e => setGrid(!grid.checked),	// toggle grid with c
		[keyCodes.f]: resetViewToInitial,	// reset view to full-board with f

		// toggle animation with space
		[keyCodes.space]: e => setAnimateGenerations(!animate.checked),

		// stop animation and jump back to beginning with escape
		[keyCodes.escape]: e => {
			resetBoardTime()
			setAnimateGenerations(false)
		},

		// if control pressed, ...
		control: {
			// process single generation with ctrl-space
			[keyCodes.space]: incrementGeneration,

			[keyCodes.s]: saveAsSVG,	// save with ctl-s
			[keyCodes.o]: loadFromSVG // open with ctl-o
		}
	}

	// shortcut triggering
	window.addEventListener('keydown', e => {
		// do not override textbox keydown
		if(e.target.tagName.toLowerCase() !== 'input'){
			const keys = e.ctrlKey? shortcuts.control : shortcuts
			const action = keys[e.which]
			if(action){
				action(e)
				e.preventDefault()
			}
		}
	})

	function updateCurrentGeneration(){
		generation.innerHTML = board.generation.toString()
	}



	// update and render the board every frame, ~30 times per second
	function update(){
		updateResetEnabled() // update reset-button visibility
		updateCurrentGeneration()

		// try updating the board view
		// if that fails, stop animating (probably bad performance)
		if(!boardView.update())
			setAnimateGenerations(false)

		// render only if rendering was requested
		if(boardView.renderRequested || (
			paint.checked && painterPreview.renderRequested
		)){
			// render the cells and the grid
			boardView.render()

			// render the brush preview, if in paint mode
			if(paint.checked && mouseIsHoveringCanvas)
				painterPreview.render()
		}

		requestAnimationFrame(update) // update every frame
	}

	// update once
	update()

}
