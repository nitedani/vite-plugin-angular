import { stat } from 'fs/promises';
import { relative, resolve } from 'path';
import { cwd } from 'process';
import { normalizePath, Plugin } from 'vite';

// Workaround for Node.js [ERR_UNSUPPORTED_DIR_IMPORT]
export const DirImporterPlugin: Plugin = {
  name: 'vite-plugin-angular/dir-importer',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (!importer || !options.ssr) {
      return;
    }
    try {
      const packageName = normalizePath(relative(cwd(), source));
      const relativePath = resolve(cwd(), 'node_modules', source);
      const stats = await stat(relativePath);
      if (stats.isDirectory()) {
        const lastPathSegment = source.split('/').pop();
        const candidates = [
          'index.js',
          'index.mjs',
          lastPathSegment + '.js',
          lastPathSegment + '.mjs',
        ];

        for (const candidate of candidates) {
          try {
            const stats = await stat(resolve(relativePath, candidate));
            if (stats.isFile()) {
              return this.resolve(`${packageName}/${candidate}`, importer, {
                ...options,
                skipSelf: true,
              });
            }
          } catch {}
        }
      }
    } catch {}
  },
  config() {
    return {
      ssr: {
        noExternal: /apollo-angular/,
      },
    };
  },
};
