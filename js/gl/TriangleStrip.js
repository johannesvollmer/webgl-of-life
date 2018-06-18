
// wraps a webgl vertex buffer designed to contain an array of float triangles
function TriangleStrip(coordinatesPerVertex, data = null){

	const id = gl.createBuffer()
	let length = 0

	this.bind = () => {
		gl.bindBuffer(gl.ARRAY_BUFFER, id)
	}

	this.setData = data => {
		this.bind()
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
		length = data.length / coordinatesPerVertex
	}

	// 'bind with benefits'
	this.use = attribLocation => {
		gl.enableVertexAttribArray(attribLocation)

		this.bind()
		gl.vertexAttribPointer(attribLocation, coordinatesPerVertex, gl.FLOAT, false, 0, 0)
	}

	// draw this triangle buffer to the renderbuffer
	this.draw = attribLocation => {
		this.use(attribLocation)
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, length)
	}

	if(data)
		this.setData(data)
}

// 2d quad which covers the full rendering area of opengl [-1,1]
TriangleStrip.getFullQuad = () => {
	if(!TriangleStrip.QUAD2D)
		return TriangleStrip.QUAD2D = new TriangleStrip(2, new Float32Array([
			+1,+1,  -1,+1,  +1,-1,  -1,-1
		]))

	else return TriangleStrip.QUAD2D
}
