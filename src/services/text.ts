import axios from "axios"
import { log } from "./logger"

/**
 * A service for text manipulation and text utilities.
 */
class TextService {
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
}

export default TextService
