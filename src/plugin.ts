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

        let cc = await usePluginConfig(analogPlugin, userConfig, env);
        if (!isBuild) {
          cc.esbuild = false;
        }
        return mergeConfig(cc, {
          ssr: {
            external: ['reflect-metadata'],
          },
          build: {
            outDir: isSsrBuild ? 'dist/server' : 'dist/client',
          },
          resolve: {
            alias: [
              {
                find: /~/,
                replacement: join(cwd(), 'node_modules') + '/',
              },
            ],
          },
        });
      },
      configureServer(server) {
        if (!isSsrBuild) {
          return usePluginConfigureServer({ plugin: analogPlugin, server });
        }
      },
      buildStart(options) {
        return usePluginBuildStart({
          plugin: analogPlugin,
          options,
        });
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
        const isComponent = code.includes('@Component');

        // We need to compile the component templates using @analogjs/vite-plugin-angular
        // TODO: is this check working with third-party angular components?
        if (isComponent) {
          return usePluginTransform({
            plugin: analogPlugin,
            code,
            id,
            ctx: this,
          });
        }

        // Run everything else through SWC
        // On the server, we need decorator metadata,
        // @analogjs/vite-plugin-angular uses esbuild, but esbuild doesn't support decorator metadata
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
