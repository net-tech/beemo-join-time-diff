import prettyMs from "pretty-ms"

export const LOG_DOMAINS = ["logs.beemo.gg", "archive.ayu.dev"]

const url = process.argv.find((arg) => arg.startsWith("http"))

if (!url) {
	console.error("No URL provided.")
	process.exit(1)
} else if (!LOG_DOMAINS.some((domain) => url.includes(domain))) {
	console.error("Invalid log URL. Beemo logs use the logs.beemo.gg or archive.ayu.dev domains.")
	process.exit(1)
}

console.info("Analysis in progress...")

const text = await fetch(url, {
	method: "GET",
	headers: {
		"Content-Type": "text/plain",
		"User-Agent": "Beemo Log Analyzer (https://github.com/net-tech/beemo-time-diff)"
	}
})
	.then((response) => response.text())
	.then((text) => text)
	.catch((error) => {
		console.error(error, "Error getting text from URL.")
		process.exit(1)
	})

const joinDates = text.match(/\d\d:\d\d:\d\d\.\d\d\d[+,-]\d\d\d\d/gmi)

const logDate = text.match(/\d\d\d\d\/\d\d\/\d\d/gm)?.[0].replaceAll("/", "-") ?? "1970-01-01"

if (!joinDates || !logDate) {
	console.error("No dates found in text.")
	process.exit(1)
}

const parsedDates: Date[] = []
const joinDifference: number[] = []
const zeroDiffIndexes: number[] = []

for await (const [i] of joinDates.entries()) {
	const date = new Date(`${logDate}T${joinDates[i]}`)
	// We always want the time in UTC-0, if the join date ends with 0700, we want to add 7 hours to the time to get UTC-0.
	if (joinDates[i].endsWith("-0700")) {
		date.setUTCHours(date.getUTCHours() + 7)
	}
	parsedDates.push(date)

	if (i === 0) continue

	const diff = parsedDates[i].getTime() - parsedDates[i - 1].getTime()
	joinDifference.push(diff)
	if (diff === 0) {
		zeroDiffIndexes.push(i)
	}
}

const zeroDiffOcc = zeroDiffIndexes.length / joinDifference.length

const averageJoinDiff = joinDifference.reduce((a, b) => a + b) / joinDifference.length

console.info(
	`\nAnalyzed ${joinDates.length} joins. Average difference between join times is ${prettyMs(averageJoinDiff)}. ${zeroDiffIndexes.length > 0 ? `\n\n${zeroDiffIndexes.length} joins out of ${joinDifference.length} happened at the same time (${zeroDiffOcc.toPrecision(2)}% of all)` : ""}`)
