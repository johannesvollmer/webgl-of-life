# webgl-of-life
Conway's [Game of Life Website](https://johannesvollmer.github.io/webgl-of-life/), implemented using WebGL.


# About
This project simulates Conway's Game of Life, a popular cellular automaton, as a website. The idea was to (ab)use OpenGL's hardware parrallelization to simulate the cells faster than a browser could with javascript.  The cell-board is stored as a texture2d, which is rendered to a second texture, producing the new generation of cells.

# Features
- paint cells onto the board
- specify the rules of the game
- export/import svg image

# Installing And Running

This project requires no installation.
To start the game, simply open the file called `index.html`, or visit __[the online version](https://johannesvollmer.github.io/webgl-of-life/)__, in the latest Mozilla Firefox or Google Chrome.

This project has been testet in __Firefox__ 52.8.1 (64-bit) and __Google Chrome__ 67.0.3396.87 (Official Build) (64-bit) on Linux/Debian.




## Troubleshooting

1.  It may happen that drawing on the board will not have any visible effect.
    There are several possible reasons for this:
    - Painting with the pattern-mode 'remove' will not add any cells
      to the board, but only remove cells.
      You can change the pattern mode on the left side.
      Alternatively, exit and re-enter the paint mode to reset the pattern-mode.
    - Painting while viewing any other cell-mode than 'life'
      may prevent seeing the result of your brush.
      You can change the cell-mode on the right side.
      Alternatively, exit and re-enter the paint mode to reset the cell-mode.
    - When painting while in play-mode, painting a single cell will
      probably have not effect because it will die instantly.
1.  This website requires JavaScript and WebGL to do anything interesting,
    but a warning will appear if any of that is not available.
