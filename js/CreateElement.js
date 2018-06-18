// utility to create dom elements using only a single expression.
// otherwise, one would have to use multiple statements

window.Create = {

	// the argument 'props' will be modified as a side effect of this call
	svgElement: props => {
		const element = document.createElementNS('http://www.w3.org/2000/svg', props.tagName)

		if(props.children) for(let child of props.children)
			element.appendChild(child)

		// don't use delete if you don't know what you're doing
		delete props.children // prevent future iteration of these values
		delete props.tagName // tag name is already specified in element construction

		for(let propName in props)
			element.setAttributeNS(null, propName, props[propName].toString())

		return element
	},

	// the argument 'props' will be modified as a side effect of this call
	element: props => {
		const element = document.createElement(props.tagName)

		if(props.children) for(let child of props.children)
			element.appendChild(child)

			// don't use delete if you don't know what you're doing
		delete props.children // prevent future iteration of these values
		delete props.tagName // tag name is already specified in element construction

		for(let propName in props)
			element[propName] = props[propName]

		return element
	}
}
