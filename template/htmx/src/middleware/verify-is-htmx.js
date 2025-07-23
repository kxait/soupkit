const { di } = require('@services/container');

/**
 * @type {import('fastify').preHandlerHookHandler}
 */
export default function verifyIsHtmx(_, reply, done) {
  /**
   * @type {import('@services/fastify-provider').default}
   */
  const fastifyProvider = di.get('fastify');
  if (!fastifyProvider.isHtmx) {
    reply.status(400);
    reply.type('text/html');
    reply.send('Not htmx');
    return;
  }

  done();
}
