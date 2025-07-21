import process from 'node:process';
import { generateRoutes } from './route-generator.mjs';

const arg = process.argv[2];

if (!arg) {
  console.error('Usage: node generate-routes.mjs <path>');
  process.exit(1);
}

generateRoutes(arg);
