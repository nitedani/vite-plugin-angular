import analog from '@analogjs/vite-plugin-angular';
import { join } from '@angular/compiler-cli';
import { cwd } from 'process';
import { mergeConfig, normalizePath, Plugin, UserConfig } from 'vite';
import { swcTransform } from './swc/transform.js';
import {
  usePluginBuildStart,
  usePluginConfig,
  usePluginConfigureServer,
  usePluginHandleHotUpdate,
  usePluginTransform,
} from './utils.js';

export const ProductionPlugin = (): Plugin => {
  //@ts-ignore
  const analogPlugin = analog.default({
    tsconfig: join(cwd(), 'tsconfig.json'),
    workspaceRoot: cwd(),
  });

  let isSsrBuild = false;
  return {
    name: 'vite-plugin-angular-prod',
    enforce: 'pre',
    apply: 'build',
    async config(_userConfig, env) {
      isSsrBuild = !!_userConfig.build?.ssr;
      const { buildSteps, ...rest } = _userConfig as any;
      const userConfig = rest as UserConfig;

      let cc = await usePluginConfig(analogPlugin, userConfig, env);

      return mergeConfig(cc, {
        ssr: {
          external: ['reflect-metadata', 'xhr2'],
          noExternal: [/@nitedani\/vite-plugin-angular/],
        },
        // optimizeDeps: false,
        build: {
          outDir: isSsrBuild ? 'dist/server' : 'dist/client',
          rollupOptions: {
            external: ['xhr2'],
          },
        },
        resolve: {
          alias: [
            {
              find: /~/,
              replacement: join(cwd(), 'node_modules') + '/',
            },
          ],
        },
      } as UserConfig);
    },
    configureServer(server) {
      return;
      return usePluginConfigureServer({ plugin: analogPlugin, server });
    },
    buildStart(options) {
      return usePluginBuildStart({
        plugin: analogPlugin,
        options,
      });
    },
    handleHotUpdate(ctx) {
      return;
      return usePluginHandleHotUpdate({
        plugin: analogPlugin,
        ctx,
      });
    },
    configResolved(config) {},
    transform(code, id) {
      const _id = normalizePath(id);
      const _check = normalizePath(join(cwd(), 'server'));
      const _check2 = normalizePath(join(cwd(), 'renderer'));
      const isServerAsset = _id.includes(_check) || _id.includes(_check2);
      const isComponent = () =>
        code.includes('@NgModule') || code.includes('@Component');

      // Only use in production build, for smaller bundle size
      // Don't use in dev, because it slows down the build
      if ((!isSsrBuild && !isServerAsset) || isComponent()) {
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
        isProduction: true,
      });
    },
  };
};
