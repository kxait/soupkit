import * as inquirer from '@inquirer/prompts';
import * as process from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as prettier from 'prettier';

/**
 * @typedef {'page'|'htmx fragment'|'api'} RouteType
 * @typedef {'get'|'post'|'put'|'delete'|'patch'} HttpMethod
 */

/**
 * route path to fs location logic:
 * - simple routes like GET /index or POST /test/data will be
 *   in their respective files like src/routes/index.get.js and src/routes/test/data.post.js
 * - routes with params like GET /user/:id will be in src/routes/user/[id].get.js
 * - routes with params in folder name like GET /user/:id/edit will be in src/routes/user/[id]/edit.get.js
 * - routes ending with a slash will create a `index.method.jsx` file
 */

const routesPaths = path.join(import.meta.dirname, '../src/routes');

async function run() {
  const routePath = await inquirer.input({
    message: 'Enter route path (e.g. /users/:id/edit)',
    required: true,
    validate: validateRoutePath,
  });

  const method = await inquirer.select({
    message: 'Select HTTP method',
    choices: ['get', 'post', 'put', 'delete', 'patch'],
    default: 'get',
  });

  const routeType = await inquirer.select({
    message: 'Select route type',
    choices: ['page', 'htmx fragment', 'api'],
    default: 'page',
  });

  const authenticated =
    (await inquirer.select({
      message: 'Is route authenticated?',
      choices: ['yes', 'no'],
      default: 'yes',
    })) === 'yes';

  const segments = parseRoutePath(routePath);

  const fsPath = routePathSegmentsToFsPath(routeType, segments, method);

  const output = (() => {
    switch (routeType) {
      case 'api':
        return apiTemplate(routePath, method, authenticated);
      case 'htmx fragment':
        return fragmentTemplate(routePath, method, authenticated);
      case 'page':
        return pageTemplate(routePath, method, authenticated);
    }
    throw 'unreachable';
  })();

  await ensurePathDirsExist(path.join(routesPaths, fsPath));

  const prettierConfig = await prettier.resolveConfig(routesPaths);
  const formatted = await prettier.format(output, {
    ...prettierConfig,
    parser: 'babel',
  });

  await fs.promises.writeFile(path.join(routesPaths, fsPath), formatted);
  console.log(`>>> Created src/routes/${fsPath} for route ${routePath}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * @param {string} routePath
 * @param {HttpMethod} method
 * @param {boolean} authenticated
 */
function pageTemplate(routePath, method, authenticated) {
  return `
import React from "react";
import ReactDOMServer from "react-dom/server";
${
  authenticated
    ? `import verifyLogin from '@middleware/verify-login';
`
    : ``
}

import { di } from '@services/container';

const Page = () => <div>${routePath}</div>;

/**
 * @param {import('fastify').FastifyInstance} fa
 */
export default function (fa) {
  fa.${method}(
    "${routePath}",
    ${authenticated ? '{ preHandler: verifyLogin },' : ''}
    /**
     * @param {import('fastify').FastifyRequest} request
     * @param {import('fastify').FastifyReply} reply
     */
    async (request, reply) => {
      const htmlString = ReactDOMServer.renderToString(<Page />);

      reply.type("text/html; charset=utf-8");
      return htmlString;
    },
  );
  
  fa.log.info('> Added route ${method.toUpperCase()} ${routePath}');
}`;
}

/**
 * @param {string} routePath
 * @param {HttpMethod} method
 * @param {boolean} authenticated
 */
function apiTemplate(routePath, method, authenticated) {
  return `
${
  authenticated
    ? `import verifyLogin from '@middleware/verify-login';
`
    : ``
}

import { di } from '@services/container';

/**
 * @param {import('fastify').FastifyInstance} fa
 */
export default function (fa) {
  fa.${method}(
    "/api${routePath}",
    ${authenticated ? '{ preHandler: verifyLogin },' : ''}
    /**
     * @param {import('fastify').FastifyRequest} request
     * @param {import('fastify').FastifyReply} reply
     */
    async (request, reply) => {
      reply.type("application/json");
      return { data: "Hello world!" };
    },
  );
  
  fa.log.info('> Added API route ${method.toUpperCase()} /api${routePath}');
}`;
}

/**
 * @param {string} routePath
 * @param {HttpMethod} method
 * @param {boolean} authenticated
 */
function fragmentTemplate(routePath, method, authenticated) {
  return `
import React from "react";
import ReactDOMServer from "react-dom/server";
import verifyIsHtmx from '@middleware/verify-is-htmx';
${
  authenticated
    ? `import verifyLogin from '@middleware/verify-login';
`
    : ``
}
import { di } from '@services/container';

const Fragment = () => <div>${routePath}</div>;

/**
 * @param {import('fastify').FastifyInstance} fa
 */
export default function (fa) {
  fa.${method}(
    "${routePath}.hx",
    { preHandler: [verifyIsHtmx${authenticated ? ', verifyLogin' : ''}] },
    /**
     * @param {import('fastify').FastifyRequest} request
     * @param {import('fastify').FastifyReply} reply
     */
    async (request, reply) => {
      const htmlString = ReactDOMServer.renderToString(<Fragment />);

      reply.type("text/html; charset=utf-8");
      return htmlString;
    },
  );
  
  fa.log.info('> Added fragment ${method.toUpperCase()} ${routePath}.hx');
}`;
}

/**
 * @typedef {object} RoutePathSegment
 * @property {string} name
 * @property {'fragment'|'param'} type
 */

/**
 * @param {string} routePath
 * @returns {RoutePathSegment[]}
 */
function parseRoutePath(routePath) {
  const parts = routePath.split('/');

  /**
   * @type {RoutePathSegment[]}
   */
  const resultParts = [];

  for (const i in parts) {
    const part = parts[i];

    if (part === '') {
      // perhaps an index route? e.g. `/` or `/users/` instead of `/users`
      // should create a `index.get.jsx` file
      // @ts-ignore
      const isLastSegment = i == parts.length - 1;
      if (isLastSegment) {
        resultParts.push({
          name: 'index',
          type: 'fragment',
        });
      }
      continue;
    }

    if (part.startsWith(':')) {
      resultParts.push({
        name: part.slice(1),
        type: 'param',
      });
    } else {
      resultParts.push({
        name: part,
        type: 'fragment',
      });
    }
  }

  return resultParts;
}

/**
 * @param {string} routePath
 */
function validateRoutePath(routePath) {
  const segmentRe = /^[:]?[-a-zA-Z0-9]+$/;
  const parts = routePath.split('/');

  if (!routePath.startsWith('/')) {
    return `Route path "${routePath}" must start with "/"`;
  }

  for (const i in parts) {
    const segment = parts[i];
    if (segment === '') {
      // perhaps an index route
      // @ts-ignore
      if (i == parts.length - 1 || i == 0) {
        continue;
      } else {
        console.log(parts.length - 1, i, parts);
        return `Route path "${routePath}" contains empty segment`;
      }
    }
    if (!segment.match(segmentRe)) {
      return `Route path "${routePath}" contains invalid segment "${segment}"`;
    }
  }

  return true;
}

/**
 * @param {RouteType} routeType
 * @param {RoutePathSegment[]} segments
 * @param {HttpMethod} httpMethod
 */
function routePathSegmentsToFsPath(routeType, segments, httpMethod) {
  const resultSegments = segments.map((segment, i) => {
    const fsName = (() => {
      if (segment.type === 'param') {
        return `[${segment.name}]`;
      }

      return segment.name;
    })();

    if (i === segments.length - 1) {
      if (routeType === 'api') {
        return `${fsName}.${httpMethod}.js`;
      }
      if (routeType === 'htmx fragment') {
        return `${fsName}.hx.${httpMethod}.jsx`;
      }
      return `${fsName}.${httpMethod}.jsx`;
    }
    return `${fsName}`;
  });

  if (routeType === 'htmx fragment') {
    return ['hx', ...resultSegments].join('/');
  }

  if (routeType === 'api') {
    return ['api', ...resultSegments].join('/');
  }

  return resultSegments.join('/');
}

/**
 * @param {string} fsPath
 */
async function ensurePathDirsExist(fsPath) {
  const dirname = path.dirname(fsPath);
  if (!fs.existsSync(dirname)) {
    await fs.promises.mkdir(dirname, { recursive: true });
  }
}
