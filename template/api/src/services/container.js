import DIContainer from '#lib/di-container';

import FastifyProvider from './fastify-provider.js';
import Logger from './logger.js';
import DateProvider from './date-provider.js';

const di = new DIContainer();

di.registerAll({
  fastify: {
    lifecycle: 'scoped',
    cls: FastifyProvider,
  },
  logger: {
    lifecycle: 'scoped',
    dependencies: ['fastify'],
    cls: Logger,
  },
  dateProvider: {
    lifecycle: 'transient',
    dependencies: ['logger'],
    cls: DateProvider,
  },
});

/**
 * @param {import('fastify').FastifyInstance} fa
 */
function registerDiScope(fa) {
  fa.addHook(
    'onRequest',
    /**
     * @param {import('fastify').FastifyRequest} request
     * @param {import('fastify').FastifyReply} reply
     */
    async (request, reply) => {
      di.beginScope();

      /**
       * @type {import('#services/fastify-provider').default}
       */
      const fastifyProvider = di.get('fastify');
      fastifyProvider.register(fa, request, reply);

      reply.header('X-Trace-Id', fastifyProvider.traceCode);
    },
  );
}

export { di, registerDiScope };
