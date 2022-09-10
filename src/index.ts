import { AngularVitePluginOptions } from './plugin-options';
import { Plugin } from 'vite';
import { transform, plugins, Program } from '@swc/core';
import {
  AngularComponents,
  AngularImportCompilerComponents,
  AngularInjector,
  AngularSwapPlatformDynamic,
} from './swc';
import { defu } from 'defu';
import { join } from 'path';

export function vpa(options?: AngularVitePluginOptions): Plugin {
  let isProduction = false;
  const fileExtensionRE = /\.[^/\s?]+$/;
  return {
    name: 'vite-plugin-angular',
    enforce: 'pre',
    config() {
      return {
        resolve: {
          preserveSymlinks: true,
          alias: [
            {
              find: /~/,
              replacement: join(__dirname, 'node_modules') + '/',
            },
          ],
        },
        esbuild: false,
        build: {
          rollupOptions: {
            output: {
              manualChunks: {
                vendor: [
                  '@angular/core',
                  '@angular/common',
                  '@angular/platform-browser',
                  '@angular/platform-browser-dynamic',
                  'zone.js/dist/zone',
                ],
              },
            },
          },
        },
      };
    },
    configResolved(config) {
      isProduction = config.isProduction;
    },
    transform: (code, id) => {
      if (id.includes('node_modules')) {
        return code;
      }

      const [filepath, querystring = ''] = id.split('?');
      const [extension = ''] =
        querystring.match(fileExtensionRE) ||
        filepath.match(fileExtensionRE) ||
        [];

      if (id.includes('node_modules')) {
        return code;
      }

      if (!/\.(js|ts|tsx|jsx?)$/.test(extension)) {
        return;
      }

      return transform(
        code,
        // @ts-ignore
        defu(options?.swc ?? {}, {
          sourceMaps: !isProduction,
          jsc: {
            target: options?.target ?? 'es2020',
            parser: {
              syntax: 'typescript',
              tsx: false,
              decorators: true,
              dynamicImport: true,
            },
            transform: {
              decoratorMetadata: true,
              legacyDecorator: true,
            },
            minify: {
              compress: isProduction
                ? {
                    unused: true,
                    dead_code: true,
                  }
                : false,
              ecma: '2016',
              module: true,
              mangle: isProduction,
            },
          },
          minify: isProduction,
          module: {
            type: 'es6',
            lazy: true,
          },
          plugin: plugins([
            (m: Program) => {
              const angularComponentPlugin = new AngularComponents({
                sourceUrl: id,
              });
              return angularComponentPlugin.visitProgram(m);
            },
            (m: Program) => {
              const angularInjectorPlugin = new AngularInjector();
              return angularInjectorPlugin.visitProgram(m);
            },
            (m: Program) => {
              return new AngularImportCompilerComponents().visitProgram(m);
            },
            ...(isProduction
              ? [
                  (m: Program) =>
                    new AngularSwapPlatformDynamic().visitProgram(m),
                ]
              : []),
          ]),
        })
      ).then((res) => {
        return {
          code: res.code,
          map: res.map,
        };
      });
    },
  };
}
