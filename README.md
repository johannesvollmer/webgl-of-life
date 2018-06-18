# webgl-of-life
Conway's Game of Life Website, implemented using WebGL.

# About
This project simulates Conway's Game of Life, a popular cellular automaton, as a website. The idea was to (ab)use OpenGL's hardware parrallelization to simulate the cells faster than a browser could with javascript.  The cell-board is stored as a texture2d, which is rendered to a second texture, producing the new generation of cells.

# Features
- paint cells onto the board
- specify the rules of the game
- export/import svg image

__Note: This project has been created locally, and has not been designed to be hosted on a real server (yet).__
This project has been testet in __Firefox__ 52.8.1 (64-bit) and __Google Chrome__ 67.0.3396.87 (Official Build) (64-bit) on Linux/Debian.
