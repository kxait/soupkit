import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';

/**
 * Copy a template directory recursively, replacing $tags in file contents.
 *
 * @param {string} srcDir - Absolute path to the source template directory
 * @param {string} destDir - Absolute path to the destination directory
 * @param {Object} variables - Object with template keys (e.g., { name: 'MyApp' })
 */
export async function copyTemplateDir(srcDir, destDir, variables = {}) {
  const gitignoreEntries = await getGitignoreEntries();
  const entries = await fg(['**/*'], {
    cwd: srcDir,
    dot: true,
    onlyFiles: false,
    //ignore: gitignoreEntries,
    followSymbolicLinks: true,
  });

  // i cant get the fucking ignore option to work in fast-glob
  // goddamn idiotic truckload of shit
  const entriesFiltered = entries.filter((entry) => {
    return !gitignoreEntries.some((gitignoreEntry) => {
      return entry.includes(gitignoreEntry);
    });
  });

  for (const entry of entriesFiltered) {
    const srcPath = path.join(srcDir, entry);
    const destPath = path.join(destDir, entry);
    const stats = await fs.stat(srcPath);

    if (stats.isDirectory()) {
      await fs.ensureDir(destPath);
    } else {
      const content = await fs.readFile(srcPath, 'utf8');

      if (typeof content !== 'string') {
        throw new Error('The code is wrong');
      }

      const processed = content.replace(
        /\$(\w+)/g,
        (_, key) => variables[key] || `$${key}`,
      );
      await fs.outputFile(destPath, processed);
    }
  }
}

async function getGitignoreEntries() {
  const gitignorePath = path.join(import.meta.dirname, '../.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    return [];
  }
  const content = await fs.readFile(gitignorePath, 'utf8');

  if (typeof content !== 'string') {
    throw new Error('The code is wrong');
  }

  return content.split('\n').filter((line) => line.trim() !== '');
}
