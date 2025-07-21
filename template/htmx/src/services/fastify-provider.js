import { ok } from 'node:assert';

export default class FastifyProvider {
  /** @type {import('fastify').FastifyInstance | undefined} */
  #fastify;
  /** @type {import('fastify').FastifyRequest | undefined} */
  #request;
  /** @type {import('fastify').FastifyReply | undefined} */
  #reply;

  /**
   * This method is called by the DI container to register the Fastify instance
   *
   * @param {import('fastify').FastifyInstance} fastify
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  register(fastify, request, reply) {
    this.#fastify = fastify;
    this.#request = request;
    this.#reply = reply;
  }

  /**
   * @returns {import('fastify').FastifyInstance}
   */
  get fastify() {
    ok(this.#fastify);
    return this.#fastify;
  }

  /**
   * @returns {import('fastify').FastifyRequest}
   */
  get request() {
    ok(this.#request);
    return this.#request;
  }

  /**
   * @returns {import('fastify').FastifyReply}
   */
  get reply() {
    ok(this.#reply);
    return this.#reply;
  }

  get isHtmx() {
    if (!this.#request) {
      return false;
    }
    return FastifyProvider.isHtmx(this.#request);
  }

  get traceCode() {
    return this.#request?.id ?? undefined;
  }

  /**
   * @param {import('fastify').FastifyRequest} request
   */
  static isHtmx(request) {
    return request.headers['hx-request'] === 'true';
  }
}
