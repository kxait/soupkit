import DIContainer from '@lib/di-container';

import FastifyProvider from './fastify-provider';
import Logger from './logger';
import DateProvider from './date-provider';
import ErrorPageFactoryService from './error-page-factory-service';

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
    lifecycle: 'scoped',
    dependencies: ['logger'],
    cls: DateProvider,
  },
});

di.registerAll({
  errorPageFactory: {
    lifecycle: 'transient',
    cls: ErrorPageFactoryService,
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
       * @type {import('@services/fastify-provider').default}
       */
      const fastifyProvider = di.get('fastify');
      fastifyProvider.register(fa, request, reply);

      reply.header('X-Trace-Id', fastifyProvider.traceCode);
    },
  );
}

export { di, registerDiScope };
