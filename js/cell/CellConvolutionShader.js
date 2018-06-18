
// creates the shader which increments the generation
// reads the current generation from the cell texture
// and outputs the new generation (not including neighbour count)
function createCellConvolutionShader(){
	const convolutionMaterial = new Material(`
			precision highp float;

			// the 4 fullscreen quad vertices
			attribute vec2 vertex;

			// output which cell to pick for that fragment.
			// will be each cell once
			varying vec2 cellTextureCoordinate;


			void main(){
				// vertices are [-1,1], text coords are [0,1]
				cellTextureCoordinate = vertex * 0.5 + 0.5;

				gl_Position = vec4(vertex, 0.0, 1.0);
			}
		`, `




			precision highp float;

			// which cell to pick
			varying vec2 cellTextureCoordinate;

			// the current generation
			uniform sampler2D cellTexture;

			// how much we must go right/left to get the next pixel inside a [0,1] texture space
			uniform vec2 pixelScaling;

			// contains 0 if a cell dies, and 1 if it will live
			uniform sampler2D reviveRule, surviveRule;


			float neighbours(vec2 coordinate){
				return texture2D(cellTexture, coordinate).g;
			}

			// returns the new cell value based on the neighbour count
			float rule(sampler2D rule, float neighbours){
				return texture2D(rule, vec2(neighbours, 0.5)).r;
			}

			float alive(vec2 coordinate){
				return texture2D(cellTexture, coordinate).r;
			}

			float willLive(float alive, vec2 coordinate){
				return alive > 0.5
				?	rule(surviveRule, neighbours(coordinate))
				:	rule(reviveRule, neighbours(coordinate));
			}


			void main(){
				float alive = alive(cellTextureCoordinate);
				gl_FragColor = vec4(
					willLive(alive, cellTextureCoordinate), 		// store new alive state in red channel
					0.0, 																				// we don't know the new neighbour count yet
					alive, 																			// store previous alive state in blue channel
					1.0
				);
			}
	`)

	convolutionMaterial.bindProperties({
		vertex: 		{ storage: 'attrib' },
		pixelScaling: 	{ storage: 'uniform', type: '2fv', value: [ 0.01, 0.01 ] },
		cellTexture: 	{ storage: 'uniform', type: '1i', value: /*index*/ 0 }, // gl texture uniforms are indices, thus type is '1integer'
		reviveRule: 	{ storage: 'uniform', type: '1i', value: /*index*/ 1 },
		surviveRule: 	{ storage: 'uniform', type: '1i', value: /*index*/ 2 }
	})

	return convolutionMaterial
}
