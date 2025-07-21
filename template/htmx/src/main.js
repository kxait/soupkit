import fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import faStatic from '@fastify/static';
import formBody from '@fastify/formbody';
import cookie from '@fastify/cookie';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import process from 'process';
import path from 'path';

import { addLayouting } from './layout';
import { registerDiScope } from './services/container';
import { registerErrorHandler } from '@middleware/error-handler';
import routes from 'routes';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const envToLogger = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
      },
    },
    production: true,
  },
};

const fa = fastify({
  logger: envToLogger[process.env.NODE_ENV] ?? true,
});

fa.register(sensible);
fa.register(cors);
fa.register(faStatic, {
  root: path.join(import.meta.dirname, '../public'),
  maxAge: 60 * 60 * 24,
  immutable: true,
  etag: true,
});
fa.register(formBody);
fa.register(cookie, { hook: 'onRequest', secret: '$guid' });

fa.setSerializerCompiler(serializerCompiler);
fa.setValidatorCompiler(validatorCompiler);

routes(fa);
addLayouting(fa);
registerDiScope(fa);
registerErrorHandler(fa);

fa.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fa.log.error(err);
    process.exit(1);
  }

  console.log(`$name server listening on ${address}`);
});
