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
	timeTaken: string
}

export { timeDifferenceResult }
