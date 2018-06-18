// this timer contains a task, which will be executed at a speific rate.
// each time when 'update' is called, the task will be executed
// as many times as necessary to provide the desired update-rate

function Timer(action){
	const millisPerSecond = 1000
	let lastActionTime = 0 // last known time point where a generation was incremented
	this.desiredDeltaMillis = 100

	this.setActionsPerSecond = frequency => {
		const deltaSeconds = 1 / frequency
		this.desiredDeltaMillis = millisPerSecond * deltaSeconds
	}

	this.update = () => {
		const now = performance.now()
		while(lastActionTime < now){
			lastActionTime += this.desiredDeltaMillis
			action()
		}
		const millisUntilNext = lastActionTime - now
		return 1 - millisUntilNext / this.desiredDeltaMillis
	}

	this.reset = () => {
		lastActionTime = performance.now()
	}

	this.reset()
}
