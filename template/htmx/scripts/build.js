import esbuild from 'esbuild';
import process from 'node:process';
import { generateRoutes } from './route-generator.mjs';

const timer = new Date();

const isDev = process.env.NODE_ENV === 'development';

/**
 * @param {boolean} isDev
 */
(async (isDev) => {
  if (!isDev) {
    await generateRoutes('../src/routes');
  }

  await esbuild.build({
    entryPoints: ['src/main.js'],
    outdir: 'dist',
    bundle: true,
    platform: 'node',
    packages: 'external',
    target: 'node22',
    format: 'esm',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    sourcemap: 'both',
    loader: { '.js': 'jsx' },
  });
})(isDev)
  .then(() => {
    // @ts-ignore
    const timeTakenToFinish = new Date() - timer;
    console.log(`>>> Build successful in ${timeTakenToFinish}ms`);
  })
  .catch((e) => {
    console.error('>>> Build failed', e);
    process.exit(1);
  });
