import { join } from 'path';
import { ResolvedVitePluginAngularOptions } from '../../plugin/plugin-options.js';
import { Plugin } from 'vite';

const virtualModuleId = 'virtual:vite-plugin-angular';
const resolvedVirtualModuleId = '\0' + virtualModuleId;
let root = '';
export const CommonPlugin = (
  options: ResolvedVitePluginAngularOptions,
): Plugin => {
  return {
    name: 'vite-plugin-angular-common',
    enforce: 'pre',
    config(config, env) {
      const outDir = config.build?.outDir ?? 'dist';
      return {
        ssr: {
          external: ['reflect-metadata', 'xhr2'],
          noExternal: [
            /@nitedani\/vite-plugin-angular/,
            /@nitedani\/vite-plugin-ssr-adapter/,
            /@nitedani\/angular-renderer-core/,
            /@nitedani\/angular-renderer-express/,
            /@nitedani\/angular-renderer-nestjs/,
            /@angular\/platform/,
          ],
        },
        build: {
          outDir: env.isSsrBuild
            ? join(outDir, 'server')
            : join(outDir, 'client'),
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
                  '@nitedani/angular-renderer-core',
                  '@nitedani/vite-plugin-angular/client',
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
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `
export const projectRoot = "${root}"
export const swc = ${options.swc}
`;
      }
    },
  };
};
