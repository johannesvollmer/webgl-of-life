
// compiles a vertex and fragment shader and
// keeps a copy of all the shader variables
// and updates the shader variables when calling 'use'
function Material(vertexSource, fragmentSource) {
	const id = gl.createProgram()
	this.properties = {}

	gl.attachShader(id, compileSource(fragmentSource, gl.FRAGMENT_SHADER))
	gl.attachShader(id, compileSource(vertexSource, gl.VERTEX_SHADER))
	gl.linkProgram(id)

	if (!gl.getProgramParameter(id, gl.LINK_STATUS))
		console.log('GL Link Error: ' + gl.getProgramInfoLog(id))

	function compileSource(source, type) {
		const shader = gl.createShader(type)
		gl.shaderSource(shader, source)
		gl.compileShader(shader)

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
			console.log('GL Shader Error: ' + gl.getShaderInfoLog(shader))

		return shader
	}

	// 'bind with benefits'
	// loads all variables to the gpu
	this.use = () => {
		gl.useProgram(id)

		// upload all uniforms to the GPU
		for (let propName in this.properties) {
			const property = this.properties[propName]
			if (property.storage === "uniform" && property.value !== undefined)
				gl['uniform' + property.type](property.location, property.value) // gl.uniform2fv() or similar
		}
	}

	// record all uniform and attribute locations and save them in this.properties
	// these properties will be updated on 'use'
	this.bindProperties = properties => {
		for (let propName in properties) {
			const property = properties[propName]
			const getterName = 'get' + capitalize(property.storage) + 'Location' // gl.getUniformLocation(program, id), gl.getAttribLocation(program, id), or similar
			property.location = gl[getterName](id, propName)
			this.properties[propName] = property
		}
	}

	function capitalize(word){
		return word.charAt(0).toUpperCase() + word.substring(1)
	}
}
