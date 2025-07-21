import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { di } from '@services/container';

/**
 * @param {{ data: string }} data
 */
const Page = ({ data }) => <div>{data}</div>;

/**
 * @param {import('fastify').FastifyInstance} fa
 */
export default function (fa) {
  fa.get(
    '/',

    /**
     * @param {import('fastify').FastifyRequest} request
     * @param {import('fastify').FastifyReply} reply
     */
    async (request, reply) => {
      /**
       * @type {import('@services/date-provider').default}
       */
      const dateProvider = di.get('dateProvider');
      const now = dateProvider.now;

      const htmlString = ReactDOMServer.renderToString(
        <Page data={now.toISOString()} />,
      );

      reply.type('text/html; charset=utf-8');
      return htmlString;
    },
  );

  fa.log.info('> Added route GET /');
}
