// create some default pattern brushes
window.getDefaultPatterns = () => {
	return {
		dot: new CellPainter.Brush("1-Block", "Ending", 1, 1, [true]),
		block: new CellPainter.Brush("9-Block", "Later Flipping", 3, 3, [
				true, true, true,
				true, true, true,
				true, true, true
		]),
		bar: new CellPainter.Brush("3-Bar", "Flipping", 3, 1, [true, true, true]),
		jet: new CellPainter.Brush("5-Jet", "Moving", 3, 3, [
				true, true, true,
				false, false, true,
				false, true, false
		]),
		largejet: new CellPainter.Brush("13-Jet", "Moving", 7, 5, [
				false, true, true, true, true, true, true,
				true, false, false, false, false, false, true,
				false, false, false, false, false, false, true,
				true, false, false, false, false, true, false,
				false, false, true, true, false, false, false,
		]),
		circle: new CellPainter.Brush("4-Circle", "Staying", 3, 3, [
				false, true, false,
				true, false, true,
				false, true, false
		]),
		zero: new CellPainter.Brush("6-Circle", "Staying", 3, 4, [
				false, true, false,
				true, false, true,
				true, false, true,
				false, true, false
		]),
		cross: new CellPainter.Brush("6-Cross", "Flipping", 4, 4, [
				false, false, true, false,
				true, true, false, false,
				false, false, true, true,
				false, true, false, false,
		]),
	}
}
