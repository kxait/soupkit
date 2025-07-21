import path from 'node:path';
import { glob } from 'glob';
import * as fs from 'node:fs';
import * as prettier from 'prettier';

// e.g. "../src/routes"
/**
 * @param {string} p - path
 */
export async function generateRoutes(p) {
  const dirname = import.meta.dirname;
  const routes = path.join(dirname, p);

  const files = glob
    // get all js and jsx recursively
    .sync(`${routes}/**/*.js*`)
    // remove the prepending path
    .map((file) => file.replace(routes, ''))
    .filter((file) => file !== '/index.js')
    // remove the extension
    .map((file) => file.replace(/\.[^/.]+$/, ''))
    // prepend a dot
    .map((file) => `.${file}`);

  const output = fileTemplate(files);

  const indexPath = path.join(routes, 'index.js');

  const prettierConfig = await prettier.resolveConfig(indexPath);
  const formatted = await prettier.format(output, {
    ...prettierConfig,
    parser: 'babel',
  });

  await fs.promises.writeFile(indexPath, formatted);

  console.log('>>> Generated routes:');
  console.log(files);
}

/**
 * @param {string[]} paths
 */
function fileTemplate(paths) {
  const imports = paths
    .map((path, i) => `import _${i} from "${path}";`)
    .join('\n');

  const execs = paths.map((path, i) => `_${i}(fastify); // ${path}`).join('\n');

  return `${imports}

/**
 * @param {import('fastify').FastifyInstance} fastify
 */
export default function (fastify) {
  ${execs}
}
`;
}
