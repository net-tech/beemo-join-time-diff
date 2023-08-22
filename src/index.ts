import prompts from "prompts"
import cliProgress from "cli-progress"
import prettyMs from "pretty-ms"

export const LOG_DOMAINS = ["logs.beemo.gg", "archive.ayu.dev"]

const response = await prompts(
		{
			type: "text",
			name: "url",
			message:
				"Please enter the link of the raid log:",
			validate: (url) => {
				const domain = url.split("/")[2]
				if (!LOG_DOMAINS.includes(domain)) {
					return `Supported domains: ${LOG_DOMAINS.join(", ")}.`
				}
				return true
			}
		},
		{
			onCancel: () => {
				process.exit(0)
			},
		}
	)

console.info(`Starting time difference calculation for ${response.url}.`)

const text = await fetch(response.url, {
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

const joinDates = text.match(/\d\d:\d\d:\d\d\.\d\d\d(\+|\-)\d\d\d\d/gmi)

// The day month and year is at the top of the log
const logDate = text.match(/\d\d\d\d\/\d\d\/\d\d/gm)?.[0] ?? "1970/01/01"
const [year, month, day] = logDate.split("/")

if (!joinDates || !logDate) {
	console.error("No dates found in text.")
	process.exit(1)
}

const parsedDates: Date[] = []
const joinDifference: number[] = []
const zeroDiffIndexes: number[] = []

const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)

progressBar.start(joinDates.length, 0)

for (let i = 0; i < joinDates.length; i++) {
	progressBar.increment()
	const date = new Date(`${year}-${month}-${day}T${joinDates[i]}`)
	// We always want the time in UTC-0, if the join date ends with 0700, we want to add 7 hours to the time to get UTC-0.
	if (joinDates[i].endsWith("-0700")) {
		date.setUTCHours(date.getUTCHours() + 7)
	}
	parsedDates.push(date)

	// Calculate the difference between the current and previous join time
	if (i === 0) continue

	const diff = parsedDates[i].getTime() - parsedDates[i - 1].getTime()
	joinDifference.push(diff)
	if (diff === 0) {
		zeroDiffIndexes.push(i)
	}
}

const zeroDiffOcc = zeroDiffIndexes.length / joinDifference.length

const averageJoinDiff = joinDifference.reduce((a, b) => a + b) / joinDifference.length

progressBar.stop()

console.info(
`\nAnalyzed ${joinDates.length} joins. Average difference between join times is ${prettyMs(averageJoinDiff)}. ${zeroDiffIndexes.length > 0 ? `\n\n${zeroDiffIndexes.length} joins out of ${joinDifference.length} happened at the same time (${zeroDiffOcc.toPrecision(2)}% of all)` : ""}`)
