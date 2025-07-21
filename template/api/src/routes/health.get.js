/**
 * @param {import('fastify').FastifyInstance} fa
 * @param {import('fastify').FastifyPluginOptions} opts
 */
export default async function (fa, opts) {
  fa.get(
    '/health',
    /**
     * @param {import('fastify').FastifyRequest} req
     * @param {import('fastify').FastifyReply} rep
     */
    (req, rep) => {
      rep.send('OK');
    },
  );

  fa.log.info('> Added route GET /health');
}
