import { Plugin } from 'vite';
import { swcTransform } from '../swc/transform.js';

export const DevelopmentPlugin = (config, env): Plugin[] => {
  return [
    {
      name: 'vite-plugin-angular-dev',
      enforce: 'pre',
      apply: 'serve',
      config(_userConfig, env) {
        return {
          esbuild: false,
        };
      },
      configureServer(server) {
        return;
      },
      buildStart(options) {
        return;
      },
      handleHotUpdate(ctx) {
        return;
      },
      configResolved(config) {},
      transform(code, id) {
        // Run everything else through SWC
        // On the server, we need decorator metadata,
        // @analogjs/vite-plugin-angular uses esbuild, but esbuild doesn't support decorator metadata
        return swcTransform({
          code,
          id,
          isSsr: false,
          isProduction: false,
        });
      },
    },
  ];
};
