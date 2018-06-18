
// creates a shader which counts the neighbours of each cell/pixel
function createNeighbourShader(){
	const cacheMaterial = new Material(`
			precision highp float;

			// the 4 quad vertices
			attribute vec2 vertex;

			// output which cell to sample
			// (each cell of the texture once)
			varying vec2 cellTextureCoordinate;

			void main(){
				cellTextureCoordinate = vertex * 0.5 + 0.5;
				gl_Position = vec4(vertex, 0.0, 1.0);
			}
		`, `



			precision highp float;

			// which cell to sample from the texture
			varying vec2 cellTextureCoordinate;

			// the original cell data
			uniform sampler2D cellTexture;

			// how much we must go right/left to get the next pixel inside a [0,1] texture space
			uniform vec2 pixelScaling;



			// texture wrap mode 'repeat' is not supported in webgl, hence this manual way
			vec4 repeatedTexture2D(sampler2D texture, vec2 coordinate){
				coordinate.x = coordinate.x - float(int(coordinate.x)); // x % 1, repeat values greater than one
				coordinate.y = coordinate.y - float(int(coordinate.y)); // repeat values greater than one
				if(coordinate.x < 0.0) coordinate.x += 1.0;
				if(coordinate.y < 0.0) coordinate.y += 1.0;
				return texture2D(texture, coordinate);
			}

			float alive(vec2 coordinate){
				return repeatedTexture2D(cellTexture, coordinate).r;
			}

			// this function returns the number of living neighbours
			// for the coordinate, considering 8 surrounding cells
			// pixel scaling contains the distance between two pixels
			float countNeighbours(vec2 coord){
				float x = pixelScaling.x;
				float y = pixelScaling.y;

				return
					+ alive(coord + vec2(x, 0)) 		// right middle
					+ alive(coord - vec2(x, 0)) 		// left middle
					+ alive(coord + vec2(0, y)) 		// top middle
					+ alive(coord - vec2(0, y)) 		// bottom middle
					+ alive(coord + vec2(+x, -y)) 	//  right bottom
					+ alive(coord + vec2(-x, +y)) 	//  left top
					+ alive(coord + pixelScaling)		// top right
					+ alive(coord - pixelScaling);	// bottom left
			}

			void main(){
				gl_FragColor = texture2D(cellTexture, cellTextureCoordinate); // do not change anything,
				gl_FragColor.g = countNeighbours(cellTextureCoordinate) / 8.0; // except writing the neighbour count
			}
	`)

	cacheMaterial.bindProperties({
		vertex: 		{ storage: 'attrib' },
		pixelScaling: 	{ storage: 'uniform', type: '2fv', value: [ 0.01, 0.01 ] },
		cellTexture: 	{ storage: 'uniform', type: '1i', value: /*index*/ 0 }, // gl texture uniforms are indices, thus type is '1integer'
	})

	return cacheMaterial
}
