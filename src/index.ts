import analog from '@analogjs/vite-plugin-angular';
import { minify, plugins, Program, transform } from '@swc/core';
import { JsMinifyOptions } from '@swc/core/types';
import { defu } from 'defu';
import { join } from 'path';
import { cwd } from 'process';
import { mergeConfig, Plugin, UserConfig } from 'vite';
import { AngularVitePluginOptions as VitePluginAngularOptions } from './plugin-options';
import { AngularComponents, AngularInjector } from './swc';

const normalizePath = (path: string) => path.replace(/\\/g, '/');

export function angular(options?: VitePluginAngularOptions): Plugin[] {
  let isProduction = false;
  let isSsr = false;
  const fileExtensionRE = /\.[^/\s?]+$/;
  const analogPlugin = analog({
    tsconfig: join(cwd(), 'tsconfig.json'),
    workspaceRoot: cwd(),
  });

  return [
    {
      name: 'vite-plugin-angular',
      enforce: 'pre',
      async config(_userConfig, env) {
        console.log('command', env.command);

        const isBuild = env.command === 'build';

        isSsr = !!_userConfig.build?.ssr;
        const { buildSteps, ...rest } = _userConfig as any;
        const userConfig = rest as UserConfig;

        if (!isSsr) {
          let cc = userConfig;
          for (const p of analogPlugin) {
            if (p.config) {
              //@ts-ignore
              const ret = await p.config(cc, env);
              if (ret) {
                cc = mergeConfig(cc, ret);
              }
            }
          }
          if (!isBuild) {
            cc.esbuild = false;
          }
          return mergeConfig(cc, {
            ssr: {
              external: ['reflect-metadata'],
            },
            build: {
              outDir: 'dist/client',
            },
            resolve: {
              mainFields: ['module'],
            },
          });
        } else {
          return {
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
              outDir: 'dist/server',
              // rollupOptions: {
              //   output: {
              //     manualChunks: isSsr
              //       ? undefined
              //       : id => {
              //           if (
              //             ['zone.js', '@angular/compiler', 'tslib'].some(p =>
              //               id.includes(p)
              //             )
              //           ) {
              //             return 'runtime0';
              //           }

              //           if (
              //             [
              //               '@angular/core',
              //               '@angular/common',
              //               '@angular/platform-browser',
              //               '@angular/animations',
              //               'rxjs',
              //             ].some(p => id.includes(p))
              //           ) {
              //             return 'runtime1';
              //           }

              //           if (id.includes('node_modules')) {
              //             return 'vendor';
              //           }
              //           return null;
              //         },
              //   },
              // },
            },
          } as UserConfig;
        }
      },
      configureServer(server) {
        if (!isSsr) {
          for (const p of analogPlugin) {
            if (p.configureServer) {
              //@ts-ignore
              p.configureServer(server);
            }
          }
        }
      },
      async buildStart(options) {
        if (!isSsr) {
          for (const p of analogPlugin) {
            if (p.buildStart) {
              //@ts-ignore
              await p.buildStart(options);
            }
          }
        }
      },
      async handleHotUpdate(ctx) {
        const mods: any[] = [];
        if (!isSsr) {
          for (const p of analogPlugin) {
            if (p.handleHotUpdate) {
              //@ts-ignore
              const result = await p.handleHotUpdate(ctx);
              if (Array.isArray(result)) {
                mods.push(...result);
              }
            }
          }
        }
        return mods;
      },
      configResolved(config) {
        isProduction = config.isProduction;
      },
      async transform(code, id) {
        const _id = normalizePath(id);
        const _check = normalizePath(join(cwd(), 'server'));
        const isServerAsset = _id.includes(_check);

        // Only handle server-side code,
        // let the client-side code be handled by the @analogjs/vite-plugin-angular plugin
        if (!isSsr && !isServerAsset) {
          let cc = { code };
          let prev = cc;
          for (const p of analogPlugin) {
            if (p.transform) {
              prev = cc;
              //@ts-ignore
              cc = await p.transform.call(this, cc.code, id);
              cc ??= prev;
            }
          }
          return cc;
        }
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
              // (m: Program) => {
              //   return new AngularImportCompilerComponents().visitProgram(m);
              // },
              // ...(isProduction
              //   ? [
              //       (m: Program) =>
              //         new AngularSwapPlatformDynamic().visitProgram(m),
              //     ]
              //   : []),
            ]),
          })
        );
      },
    },
  ];
}
