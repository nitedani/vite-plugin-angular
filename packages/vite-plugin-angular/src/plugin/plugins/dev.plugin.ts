import { Plugin } from 'vite';
import { swcTransform } from '../swc/transform.js';

export const DevelopmentPlugin: Plugin = {
  name: 'vite-plugin-angular-dev',
  enforce: 'pre',
  apply(config, env) {
    const isBuild = env.command === 'build';
    const isSsrBuild = env.ssrBuild === true;
    return !isBuild || isSsrBuild;
  },
  config(_userConfig, env) {
    return {
      esbuild: false,
    };
  },
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
};
