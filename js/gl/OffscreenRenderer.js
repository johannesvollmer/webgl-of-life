// enable rendering to a texture
// this is used to compute the neighbour count and increment the generation
// like a simple image editing convolution
function OffscreenRenderer(){
	const id = gl.createFramebuffer()

	this.bindWithTargetTexture = (targetTexture, subRenderer) => {
		if(targetTexture.getWidth() === 0 || targetTexture.getHeight() === 0)
			throw new Error("OffscreenRenderer::bindWithTargetTexture { Texture has no size }")

		const originalViewport = gl.getParameter(gl.VIEWPORT)

		gl.bindFramebuffer(gl.FRAMEBUFFER, id) 	// prepare off screen buffer for rendering
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture.getID(), 0)
		gl.viewport(0, 0, targetTexture.getWidth(), targetTexture.getHeight())

		subRenderer()

		gl.bindFramebuffer(gl.FRAMEBUFFER, null) // rebind to default frame buffer (the buffer used for displaying with the canvas)
		gl.viewport(originalViewport[0], originalViewport[1], originalViewport[2], originalViewport[3]) // reset to previous resolution
	}

	this.readRGBAPixelsFromTexture = (targetTexture, data) => {
		this.bindWithTargetTexture(targetTexture, () => {
			gl.readPixels(
				0, 0, targetTexture.getWidth(), targetTexture.getHeight(),
				gl.RGBA, gl.UNSIGNED_BYTE, data // only rgba suported by webgl
			)
		})
	}
}
