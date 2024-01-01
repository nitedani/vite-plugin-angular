export { ConfigPlugin, getGlobalConfig };

import { resolve } from 'path';
import { cwd } from 'process';
import { getGlobalObject } from '../../utils/getGlobalObject.js';
import { Plugin, normalizePath, searchForWorkspaceRoot } from 'vite';

const globalObject = getGlobalObject('angularConfigPlugin.ts', {
  root: undefined as string | undefined,
  workspaceRoot: undefined as string | undefined,
});

function getGlobalConfig() {
  return globalObject;
}

const ConfigPlugin: Plugin[] = [
  {
    // the resolved config.root would be available only in configResolved
    // config.root is relative here
    // make the resolved root available globally, so it can be used in other config hooks
    name: 'vite-plugin-angular-config-post',
    enforce: 'post',
    config(config, env) {
      const configResolvedRoot = normalizePath(
        config.root ? resolve(config.root) : cwd(),
      );
      globalObject.root = configResolvedRoot;
      globalObject.workspaceRoot = searchForWorkspaceRoot(configResolvedRoot);
    },
  },
  {
    name: 'vite-plugin-angular-config',
    enforce: 'pre',
    config() {
      return {
        ssr: {
          external: ['reflect-metadata', 'xhr2'],
          noExternal: [
            /@vikejs\/vite-plugin-angular/,
            /@vikejs\/angular-renderer-core/,
            /vike-adapter-.*/,
            /@angular\/platform/,
          ],
        },
        build: {
          rollupOptions: {
            onwarn: log => {
              if (
                /__PURE__|'this' keyword is equivalent to 'undefined'/.test(
                  log.message,
                )
              )
                return;
              console.error(log.message);
            },
            external: ['xhr2'],
            output: {
              manualChunks: id => {
                const runtime1 = [
                  '@vikejs/angular-renderer-core',
                  '@vikejs/vite-plugin-angular/client',
                  // '@angular',
                  // 'zone.js',
                ];
                if (runtime1.some(s => id.includes(s))) {
                  return 'runtime1';
                }
              },
            },
          },
        },
        optimizeDeps: {
          exclude: ['@angular/compiler'],
        },
      };
    },
  },
];
