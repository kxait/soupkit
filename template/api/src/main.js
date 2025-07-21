import { registerDiScope } from '#services/container';
import fastifyAutoload from '@fastify/autoload';
import fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import path from 'path';

import process from 'process';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

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

fa.register(fastifyAutoload, {
  dir: path.join(import.meta.dirname, 'routes'),
  options: { prefix: '/' },
});

fa.setSerializerCompiler(serializerCompiler);
fa.setValidatorCompiler(validatorCompiler);

registerDiScope(fa);

fa.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fa.log.error(err);
    process.exit(1);
  }

  console.log(`$name server listening on ${address}`);
});
