import { AngularVitePluginOptions as VitePluginAngularOptions } from './plugin-options';
import { Plugin, UserConfig } from 'vite';
import { transform, plugins, Program, minify } from '@swc/core';
import {
  AngularComponents,
  AngularImportCompilerComponents,
  AngularInjector,
  AngularSwapPlatformDynamic,
} from './swc';
import { defu } from 'defu';
import { join } from 'path';
import { cwd } from 'process';
import { JsMinifyOptions } from '@swc/core/types';

export function angular(options?: VitePluginAngularOptions): Plugin {
  let isProduction = false;
  let isSsr = false;
  const fileExtensionRE = /\.[^/\s?]+$/;
  return {
    name: 'vite-plugin-angular',
    enforce: 'pre',
    config(userConfig) {
      isSsr = !!userConfig.build?.ssr;
      const config: UserConfig = {
        ssr: {
          external: ['reflect-metadata'],
        },
        resolve: {
          preserveSymlinks: true,
          alias: [
            {
              find: /~/,
              replacement: join(cwd(), 'node_modules') + '/',
            },
          ],
        },
        esbuild: false,
        build: {
          outDir: isSsr ? 'dist/server' : 'dist/client',
          rollupOptions: {
            output: {
              manualChunks: isSsr
                ? undefined
                : (id) => {
                    if (
                      ['zone.js', '@angular/compiler', 'tslib'].some((p) =>
                        id.includes(p)
                      )
                    ) {
                      return 'runtime0';
                    }

                    if (
                      [
                        '@angular/core',
                        '@angular/common',
                        '@angular/platform-browser',
                        '@angular/animations',
                        'rxjs',
                      ].some((p) => id.includes(p))
                    ) {
                      return 'runtime1';
                    }

                    if (id.includes('node_modules')) {
                      console.log(id, 'asdsadassdsad');

                      return 'vendor';
                    }
                    return null;
                  },
            },
          },
        },
      };

      return config;
    },
    configResolved(config) {
      isProduction = config.isProduction;
    },
    transform: (code, id) => {
      const minifyOptions: JsMinifyOptions = {
        compress: !isSsr && isProduction,
        mangle: !isSsr && isProduction,
        ecma: '2020',
        module: true,
        format: {
          comments: false,
        },
      };

      if (id.includes('node_modules')) {
        return minify(code, minifyOptions);
      }

      const [filepath, querystring = ''] = id.split('?');
      const [extension = ''] =
        querystring.match(fileExtensionRE) ||
        filepath.match(fileExtensionRE) ||
        [];

      if (!/\.(js|ts|tsx|jsx?)$/.test(extension)) {
        return;
      }

      return transform(
        code,
        // @ts-ignore
        defu(options?.swc ?? {}, {
          sourceMaps: !isProduction,
          jsc: {
            target: 'es2020',
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
            minify: minifyOptions,
          },
          minify: !isSsr && isProduction,
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
      );
    },
  };
}
