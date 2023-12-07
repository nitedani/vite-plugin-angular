import { join, resolve } from 'path';
import { ResolvedVitePluginAngularOptions } from '../../plugin/plugin-options.js';
import { Plugin, normalizePath, searchForWorkspaceRoot } from 'vite';
import { cwd } from 'process';

globalThis.__vite_plugin_angular = {};

export const CommonPlugin = (
  options: ResolvedVitePluginAngularOptions,
): Plugin[] => {
  globalThis.__vite_plugin_angular.swc = options.swc;

  return [
    {
      name: 'vite-plugin-angular-common-post',
      config(config, env) {
        const resolvedRoot = normalizePath(
          config.root ? resolve(config.root) : cwd(),
        );
        globalThis.__vite_plugin_angular.root = resolvedRoot;
        globalThis.__vite_plugin_angular.workspaceRoot =
          searchForWorkspaceRoot(resolvedRoot);
      },
    },
    {
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
    },
  ];
};
