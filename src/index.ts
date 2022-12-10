import prompt from "prompt"
import { log } from "./services/logger"
import TimeService from "./services/time"
import { DurationFormatter } from "@sapphire/time-utilities"

const schema = {
	properties: {
		url: {
			description: "Enter the Beemo raid result url",
			hidden: false,
			required: true,
		},
	},
}

prompt.start()

prompt.get(schema, (err: any, result: { url: string }) => {
	try {
		if (err) {
			if (err.message === "canceled") {
				log.info("Exiting.")
				return
			}

			log.fatal(err, "Error getting input.")
			return
		}

		const url = result.url

		log.info(`Starting time difference calculation for ${url}.`)

		TimeService.timeDifference(url)
			.then((result) => {
				const zerosString =
					result.zeros.count > 0
						? `\n\n${result.zeros.count} times out of ${result.joinCount} were 0ms apart. (This happened ${result.zeros.chanceRounded}% of the time in this raid)\n\nThese are the indexes of the 0ms apart times: ${result.zeros.indexListString}.`
						: ""

				const averageTime = new DurationFormatter().format(parseInt(result.averageTime.averageRounded))

				log.info(
					`Detected ${result.joinCount} joins. Average difference between join times rounded is ${averageTime} (${result.averageTime.averageRaw}ms).${zerosString}\n\nTook ${result.timeTaken}.`
				)
			})
			.catch((error) => {
				log.fatal(error, "Error getting time difference.")
			})
	} catch (error) {
		log.fatal(error, "Error getting input.")
	}
})
