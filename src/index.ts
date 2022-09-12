import analog from '@analogjs/vite-plugin-angular';
import { join } from 'path';
import { cwd } from 'process';
import { mergeConfig, normalizePath, Plugin, UserConfig } from 'vite';
import { swcTransform } from './build';
import { AngularVitePluginOptions as VitePluginAngularOptions } from './plugin-options';
import {
  usePluginBuildStart,
  usePluginConfig,
  usePluginConfigureServer,
  usePluginHandleHotUpdate,
  usePluginTransform,
} from './utils';

export function angular(options?: VitePluginAngularOptions): Plugin[] {
  let isProduction = false;
  let isSsrBuild = false;

  const analogPlugin = analog({
    tsconfig: join(cwd(), 'tsconfig.json'),
    workspaceRoot: cwd(),
  });

  return [
    {
      name: 'vite-plugin-angular',
      enforce: 'pre',
      async config(_userConfig, env) {
        const isBuild = env.command === 'build';
        isSsrBuild = !!_userConfig.build?.ssr;
        const { buildSteps, ...rest } = _userConfig as any;
        const userConfig = rest as UserConfig;

        if (!isSsrBuild) {
          let cc = await usePluginConfig(analogPlugin, userConfig, env);
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
          });
        }

        return {
          ssr: {
            external: ['reflect-metadata'],
          },
          resolve: {
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
          },
        } as UserConfig;
      },
      configureServer(server) {
        if (!isSsrBuild) {
          return usePluginConfigureServer({ plugin: analogPlugin, server });
        }
      },
      buildStart(options) {
        if (!isSsrBuild) {
          return usePluginBuildStart({
            plugin: analogPlugin,
            options,
          });
        }
      },
      handleHotUpdate(ctx) {
        return usePluginHandleHotUpdate({
          plugin: analogPlugin,
          ctx,
        });
      },
      configResolved(config) {
        isProduction = config.isProduction;
      },
      transform(code, id) {
        const _id = normalizePath(id);
        const _check = normalizePath(join(cwd(), 'server'));
        const isServerAsset = _id.includes(_check);

        // Let the client-side code be handled by the @analogjs/vite-plugin-angular plugin
        if (!isSsrBuild && !isServerAsset) {
          return usePluginTransform({
            plugin: analogPlugin,
            code,
            id,
            ctx: this,
          });
        }

        // On the server, we need decorator metadata, so use swc
        return swcTransform({
          code,
          id,
          isSsr: isSsrBuild,
          isProduction,
        });
      },
    },
  ];
}
