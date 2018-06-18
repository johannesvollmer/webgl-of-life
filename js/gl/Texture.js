// enables us to use arbitrary array-like data inside a webgl shader
// will be used for rules, colorgradients, cell data, and more
function Texture2D(format = gl.RGB, filter = gl.LINEAR){

	const id = gl.createTexture()
	let width = 0
	let height = 0

	this.getWidth = () => width
	this.getHeight = () => height
	this.getID = () => id

	this.bind = () => {
		gl.bindTexture(gl.TEXTURE_2D, id)
	}

	this.unbind = () => {
		gl.bindTexture(gl.TEXTURE_2D, null)
	}

	this.bindAsInputTo = unit => {
		gl.activeTexture(gl.TEXTURE0 + unit)
		this.bind()
	}

	// replace resolution and content
	this.setData = (dataWidth, dataHeight, data) => {
		width = dataWidth
		height = dataHeight
		this.updateData(data)
	}

	// replace content without modifying the resolution
	this.updateData = data => {
		if(data){
			const dataSize = data.length
			const textureSize = width * height
			if(
				   (format === gl.LUMINANCE 	&& dataSize !== textureSize)
				|| (format === gl.RGB 			&& dataSize !== textureSize * 3)
				|| (format === gl.RGBA 			&& dataSize !== textureSize * 4)
			)	throw new Error("Texture2D::setData { data.length != texture.size }")
		}


		this.bind()
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1) // one byte at once
		gl.pixelStorei(gl.PACK_ALIGNMENT, 1) // one byte at once
		gl.texImage2D(
			gl.TEXTURE_2D,
			0, // mip map level
			format,
			width,
			height,
			0, // border size in px
			format,
			gl.UNSIGNED_BYTE, // pixel value type
			data 	// actual content (uint8array, or image element, or canvas element, or imagebitmap)
		)
	}

	// control if opengl should display smooth or blocky textures
	this.setFilterMode = mode => {
		this.bind()
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mode)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mode)
	}

	// repeat or clamp the texture? repeat is not supported in webgl 1.0
	this.setWrap = wrap => {
		this.bind()
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap)
	}

	this.setFilterMode(filter)
	this.setWrap(gl.CLAMP_TO_EDGE) // the only one allowed in webGL
}
