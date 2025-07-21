import { di } from '#services/container';

/**
 * @param {import('fastify').FastifyInstance} fa
 */
export default function (fa) {
  fa.get(
    '/',
    /**
     * @param {import('fastify').FastifyRequest} req
     * @param {import('fastify').FastifyReply} rep
     */
    (req, rep) => {
      const dateProvider = di.get('dateProvider');
      rep.send(dateProvider.now);
    },
  );

  fa.log.info('> Added route GET /');
}
