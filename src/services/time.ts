import { Stopwatch } from "@sapphire/stopwatch"
import TextService from "./text"
import { log } from "./logger"
import { timeDifferenceResult } from "../types/time"
import { logDomains } from "../types/general"

class TimeService {
	public static async timeDifference(
		url: string
	): Promise<timeDifferenceResult> {

		const domain = url.split("/")[2]
		if (!logDomains.includes(domain)) {
			log.fatal(`URL domain ${domain} is not supported. Supported domains are: ${logDomains.join(", ")}.`)
			process.exit(1)
		}

		const text = await TextService.getText(url)
			.then((text) => text as string)
			.catch((error) => {
				log.fatal(error, "Error getting text from URL.")
				process.exit(1)
			})

		log.debug("Got text from URL.")

		const time = new Stopwatch()

		const times = text.match(/\d\d:\d\d:\d\d\.\d\d\d-\d\d\d\d/g)
		const zeros: number[] = []
		const diffs: number[] = []

		if (!times) {
			log.fatal("No times found in text.")
			process.exit(1)
		}

		const dates = times.map(
			(time) =>
				new Date(
					Date.parse(
						`${new Intl.DateTimeFormat("en-CA", {
							timeZone: "America/Los_Angeles",
						}).format(Date.now())}T${time.replace(/(\d\d)(\d\d)$/, "$1:$2")}`
					)
				)
		)

		for (let i = 1; i < dates.length; i++) {
			const diff = dates[i].getTime() - dates[i - 1].getTime()
			diffs.push(diff)
			if (diff === 0) {
				zeros.push(i)
			}
			log.debug(
				`Difference between join time of ID ${times[i]} and ID ${
					times[i - 1]
				} is ${diff}ms.`
			)
		}

		const zerosList =
			zeros.length > 10
				? `${zeros.slice(0, 10).join(", ")} and ${zeros.length - 10} more`
				: zeros.join(", ")
		const chance = zeros.length / diffs.length
		const average = diffs.reduce((a, b) => a + b) / diffs.length
		time.stop()

		return {
			averageTime: {
				averageRaw: average,
				averageRounded: average.toFixed(2),
			},
			zeros: {
				count: zeros.length,
				chanceRounded: chance.toFixed(2),
				indexListString: zerosList,
				indexArray: zeros,
			},
			joinCount: diffs.length,
			timeTaken: time.toString(),
		}
	}
}

export default TimeService
