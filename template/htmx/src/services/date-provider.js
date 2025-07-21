export default class DateProvider {
  /** @type {import('@services/logger').default} */
  #logger;

  /**
   * @param {Object} opts
   * @param {import('@services/logger').default} opts.logger
   */
  constructor({ logger }) {
    this.#logger = logger;
  }

  get now() {
    const now = new Date();
    this.#logger.log.info(
      `DateProvider: The current date is ${now.toISOString()}`,
    );
    return now;
  }
}
