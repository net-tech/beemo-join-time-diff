import { log } from "./logger"
import { logDomains, timeDifferenceResult } from "../types/master"
import cliProgress from "cli-progress"
import axios from "axios"

class TimeService {

	/**
	 * Gets text from a URL.
	 * @param url The URL to get the text from.
	 * @returns The text from the URL.
	 */
	public static getText(url: string) {
		log.debug(`Getting text from ${url}.`)
		return new Promise((resolve, reject) => {
			axios
				.get(url)
				.then((response) => {
					log.debug(`Got text from ${url}.`)
					resolve(response.data)
				})
				.catch((error) => {
					log.error(error, `Error getting text from ${url}.`)
					reject(error)
				})
		})
	}

	public static async timeDifference(
		url: string
	): Promise<timeDifferenceResult> {

		const domain = url.split("/")[2]
		if (!logDomains.includes(domain)) {
			log.fatal(`URL domain ${domain} is not supported. Supported domains are: ${logDomains.join(", ")}.`)
			process.exit(1)
		}

		const text = await this.getText(url)
			.then((text) => text as string)
			.catch((error) => {
				log.fatal(error, "Error getting text from URL.")
				process.exit(1)
			})

		log.debug("Got text from URL.")

		const times = text.match(/\d\d:\d\d:\d\d\.\d\d\d-\d\d\d\d/g)
		const zeros: number[] = []
		const diffs: number[] = []

		if (!times) {
			log.fatal("No times found in text.")
			process.exit(1)
		}

		const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
		bar1.start(times.length, 0)
		
		const dates: Date[] = []
		for (let i = 0; i < times.length; i++) {
			bar1.increment()
			const date = new Date(
				Date.parse(
					`${new Intl.DateTimeFormat("en-CA", {
						timeZone: "America/Los_Angeles",
					}).format(Date.now())}T${times[i].replace(/(\d\d)(\d\d)$/, "$1:$2")}`
				)
			)
			dates.push(date)
		}

		for (let i = 1; i < dates.length; i++) {
			bar1.update(i + 1)
			const diff = dates[i].getTime() - dates[i - 1].getTime()
			diffs.push(diff)
			if (diff === 0) {
				zeros.push(i)
			}
		}

		const zerosList =
			zeros.length > 10
				? `${zeros.slice(0, 10).join(", ")} and ${zeros.length - 10} more`
				: zeros.join(", ")
		const chance = zeros.length / diffs.length
		const average = diffs.reduce((a, b) => a + b) / diffs.length

		bar1.stop()

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
		}
	}
}

export default TimeService
