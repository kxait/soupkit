export default class Logger {
  /** @type {import('#services/fastify-provider').default} */
  #fastifyProvider;
  constructor({ fastify }) {
    this.#fastifyProvider = fastify;
  }

  get log() {
    return this.#fastifyProvider.fastify.log;
  }
}
