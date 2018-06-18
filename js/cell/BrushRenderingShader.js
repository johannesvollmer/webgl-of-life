
// create the shader used to display the brush preview
function createBrushRenderingShader(){
	const brushMaterial = new Material(`
			precision highp float;

			// the 4 quad vertices
			attribute vec2 vertex;

			// view modification
			uniform float scale;
			uniform float aspect;
			uniform vec2 offset;

			// where to display brush
			uniform vec2 boardSize, brushSize, brushOffset;

			// which cell to pick out of the brush texture
			varying vec2 cellCoordinate;

			void main(){
				cellCoordinate = vertex * 0.5 + 0.5;
				vec2 normalizedOffset = 2.0 * (brushOffset + 0.5) / boardSize - 1.0;
				vec2 normalizedVertex = vertex * brushSize / boardSize;
				vec2 inBoard = normalizedVertex + normalizedOffset;
				vec2 rectangleAspect = vec2(1.0, aspect * boardSize.y / boardSize.x);
				gl_Position = vec4(inBoard * rectangleAspect * scale + offset, 0.0, 1.0);
			}
	`, `


			precision highp float;

			// which cell to pick
			varying vec2 cellCoordinate;

			// the brush data
			uniform sampler2D brushTexture;
			uniform vec2 brushSize;

			void main(){
				vec4 brushCell = texture2D(brushTexture, cellCoordinate);
				if(brushCell.r > 0.5) gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5);
				else discard; // do not display anything where no cell would be modified
			}
	`)

	brushMaterial.bindProperties({
		vertex: 		{ storage: 'attrib' },
		offset: 		{ storage: 'uniform', type: '2fv', value: [0, 0] },
		scale: 			{ storage: 'uniform', type: '1f', value: 1 },
		aspect: 		{ storage: 'uniform', type: '1f', value: 1 },
		brushTexture:	{ storage: 'uniform', type: '1i', value: 0 },
		boardSize:		{ storage: 'uniform', type: '2fv', value: [1,1] },
		brushSize:		{ storage: 'uniform', type: '2fv', value: [1,1] },
		brushOffset:	{ storage: 'uniform', type: '2fv', value: [0,0] },
	})

	return brushMaterial
}
