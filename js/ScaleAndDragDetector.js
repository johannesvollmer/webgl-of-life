// consumes mouse events to keep track of
// how far we zoomed in and panned the view

function ScaleAndDragDetector(canvas, onChanged){

	this.scaleSensitivity = 0.3

	// keep track of the zoom and pan
	let offset = { x:0, y:0 }
	let scale = 1

	// keep track of the absolute scrolled distance
	// and the last mouse position (for delta computations)
	let absoluteScrollY
	let lastMouse = null


	function notifyOnChanged(){
		onChanged({
			offset: {
				x: offset.x,
				y: offset.y
			},
			scale: scale
		})
	}

	// restart all state
	this.reset = () => {
		offset.x = offset.y = 0
		absoluteScrollY = 0
		this.onScroll()
	}

	// must be called from external places, probably from inside an event handler
	this.onScroll = (event = { deltaY: 0, clientX: 0, clientY: 0, ignoreMouseTarget: true }) => {
		const deltaY = event.wheelDelta? // tested on linux debian 64 bit
		 	event.wheelDelta / 120 // for chrome 60.0.3112.78
			: - event.deltaY / 3 // and for firefox 52.2.0


		const newAbsoluteScrollY = absoluteScrollY + deltaY * this.scaleSensitivity // linear offset
		const newScale = Math.pow(Math.E, newAbsoluteScrollY) // natural scale (when zoomed close, zooming will be slower). Will never be less than zero

		// clamp min and max allowed zoom
		if(newScale < 100 && newScale > 0.01){

			// translate the camera, so that zooming moves towards the mouse instead of the top left board corner
			if(!event.ignoreMouseTarget){
				const targetX = + (2 * event.clientX / canvas.width - 1)
				const targetY = - (2 * event.clientY / canvas.height - 1)
				const deltaScale = newScale / scale

				offset.x = (offset.x - targetX) * deltaScale + targetX
				offset.y = (offset.y - targetY) * deltaScale + targetY
			}

			scale = newScale
			absoluteScrollY = newAbsoluteScrollY
			notifyOnChanged()
		}
	}

	this.onMouseMove = event => {
		if(lastMouse){
			const newMouse = { x: event.clientX, y: event.clientY }
			offset.x += 2 * (newMouse.x - lastMouse.x) / canvas.width // TODO use movementX?
			offset.y -= 2 * (newMouse.y - lastMouse.y) / canvas.height
			lastMouse = newMouse
			notifyOnChanged()
		}
	}

	this.startMove = event => {
		lastMouse = { x: event.clientX, y: event.clientY }
	}

	this.endMove = () => {
		lastMouse = null
	}

	// initialize by triggering once
	this.reset()

}
