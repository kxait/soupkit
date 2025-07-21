#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import * as prompts from '@inquirer/prompts';
import { copyTemplateDir } from './copy-template-dir.js';
import { v4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const projectName = await prompts.input({
    message: 'Project name:',
    default: 'my-app',
  });

  const type = await prompts.select({
    message: 'Project type:',
    choices: [{ value: 'htmx' }, { value: 'api' }],
  });

  const srcDir = type === 'htmx' ? 'template/htmx' : 'template/api';

  const targetDir = path.resolve(process.cwd(), projectName);
  const templateDir = path.resolve(__dirname, `../${srcDir}`);

  await copyTemplateDir(templateDir, targetDir, {
    name: projectName,
    guid: v4(),
  });

  console.log(`✅ Project "${projectName}" created in ${targetDir}!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
