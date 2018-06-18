
// create the shader which is use to display the current cell generation
function createCellRenderingShader(isFancy){
	const cellMaterial = new Material(`
			precision highp float;

			// input the 4 quad vertices
			attribute vec2 vertex;

			// view scale and offset
			uniform float scale;
			uniform vec2 offset;

			// canvas aspect
			uniform float aspect;

			// required for rectangle aspect
			uniform vec2 textureSize;

			// output the texture coordinate for the fragment shader
			varying vec2 cellCoordinate;


			void main(){
				// which cell to sample
				cellCoordinate = vertex * 0.5 + 0.5;

				// where to render the board
				vec2 rectangleAspect = vec2(1.0, aspect * textureSize.y / textureSize.x);
				gl_Position = vec4(vertex * rectangleAspect * scale + offset, 0.0, 1.0);
			}
	`, `


			precision highp float;

			// computed per pixel which cell to sample
			varying vec2 cellCoordinate;

			// the cell data
			// red channel: is the cell alive? 0 or 255
			// blue channel: was alive last frame? 0 or 255
			// green channel: count of neighbours (0 -> 0, 1 -> 8)
			uniform sampler2D cellTexture;

			// colors for cells
			uniform sampler2D gradient;
			uniform vec4 aliveColor, deadColor;

			// blending between the last two generations
			uniform float transition;

			// 1 for none, greater than 1 for a visible grid
			uniform float gridMultiplier;

			// cell modes
			uniform bool neighboursMode, activityMode;

			// used for grid calculations
			uniform vec2 textureSize;



			vec4 gradient1D(sampler2D gradient, float t) {
				return texture2D(gradient, vec2(t, 0.5));
			}

			bool isEven(int integer){
				return (integer / 2) * 2 == integer;
			}

			bool checker(vec2 coord){
				coord *= textureSize;
				return isEven(int(coord.x)) != isEven(int(coord.y));
			}


			float activity(vec4 cell){
				if(cell.r == cell.b) return 0.0; // nothing changed
				if(cell.r > cell.b) return 0.85 + 0.15 * cell.g; // cell was born
				else return 0.35 + 0.15 * cell.g; // cell died
			}

			float neighbours(vec4 cell){
				return cell.g * cell.g;
			}

			float life(vec4 cell){
				return mix(cell.b, cell.r, transition);
			}


			void main(){
				vec4 cell = texture2D(cellTexture, cellCoordinate);

				if(neighboursMode) gl_FragColor = gradient1D(gradient, neighbours(cell));
				else if(activityMode)	gl_FragColor = gradient1D(gradient, activity(cell));
				else gl_FragColor = mix(deadColor, aliveColor, life(cell));

				if(gridMultiplier != 1.0)
					if(checker(cellCoordinate))
						gl_FragColor *= gridMultiplier;
			}
	`)

	cellMaterial.bindProperties({
		vertex: 		{ storage: 'attrib' },
		offset: 		{ storage: 'uniform', type: '2fv', value: [0, 0] },
		scale: 			{ storage: 'uniform', type: '1f', value: 1 },
		aspect: 		{ storage: 'uniform', type: '1f', value: 1 },

		// contains the actual cell information, with each pixel being one cell
		cellTexture: 	{ storage: 'uniform', type: '1i', value: /*index*/ 0 }, // gl texture uniforms are indices, thus type is '1integer'


		// should we display if a cell was born or killed?
		activityMode: 	{ storage: 'uniform', type: '1i', value: 0 }, // integer -> boolean

		// should we display not just alive/dead?
		neighboursMode: { storage: 'uniform', type: '1i', value: 0 }, // integer -> boolean

		// specify some colors for visualization
		gradient: 		{ storage: 'uniform', type: '1i', value: /*index*/ 1 },
		aliveColor: 	{ storage: 'uniform', type: '4fv', value: [1, 1, 1, 1] },
		deadColor: 		{ storage: 'uniform', type: '4fv', value: [0, 0, 0, 1] },

		// size of the board. needed for checker rendering and aspect correction
		textureSize: 	{ storage: 'uniform', type: '2fv', value: [100, 100] },

		// how strong the grid should be visible
		gridMultiplier: { storage: 'uniform', type: '1f', value: 1 },

		// how far to blend between the last two generations
		transition: 	{ storage: 'uniform', type: '1f', value: 1 },
	})

	return cellMaterial

}
