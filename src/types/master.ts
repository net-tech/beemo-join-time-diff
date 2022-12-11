const logDomains = ["logs.beemo.gg", "archive.ayu.dev"]

interface averageTime {
	averageRaw: number
	averageRounded: string
}

interface zeros {
	count: number
	chanceRounded: string
	indexListString: string
	indexArray: number[]
}

interface timeDifferenceResult {
	averageTime: averageTime
	zeros: zeros
	joinCount: number
}

export { logDomains, timeDifferenceResult }