import { di } from '@services/container';
import FastifyProvider from '@services/fastify-provider';

/**
 * @param {import('fastify').FastifyInstance} fa
 */
export function registerErrorHandler(fa) {
  fa.setErrorHandler((error, request, reply) => {
    /** @type {import('@services/fastify-provider').default} */
    const fastifyProvider = di.get('fastify');

    const traceCode = fastifyProvider.traceCode;

    fa.log.error(`Error handler, trace code: ${traceCode}`);
    fa.log.error(error);

    if (error instanceof LogOutError) {
      fa.log.warn(
        'Error was LogOutError, clearing access token & redirecting to /',
      );
      reply.clearCookie('accessToken');
      reply.header('HX-Redirect', '/');
      reply.redirect('/');
      return;
    }

    reply.status(error.statusCode || 500);
    reply.type('text/html');

    /**
     * @type {import('@services/error-page-factory-service').default}
     */
    const errorPageFactory = di.get('errorPageFactory');

    const isHtmx = FastifyProvider.isHtmx(request);
    if (isHtmx) {
      const errorHtmxFragment = errorPageFactory.getErrorHtmxFragment(
        error.statusCode || 500,
        traceCode,
      );
      reply.send(errorHtmxFragment);
      return;
    }

    const message =
      STATUS_CODE_TO_MESSAGE[error.statusCode] || DEFAULT_STATUS_CODE_MESSAGE;
    const errorPage = errorPageFactory.getErrorPage(
      error.statusCode || 500,
      message,
      traceCode,
    );

    return errorPage;
  });
}

const STATUS_CODE_TO_MESSAGE = {
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  405: 'Method not allowed',
  406: 'Not acceptable',
  415: 'Unsupported media type',
  500: 'Internal server error',
  501: 'Not implemented',
  502: 'Bad gateway',
  503: 'Service unavailable',
};

const DEFAULT_STATUS_CODE_MESSAGE = 'An error occurred';

export class LogOutError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.statusCode = 401;
  }
}
