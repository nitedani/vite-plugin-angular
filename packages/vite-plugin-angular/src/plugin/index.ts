import { Plugin } from 'vite';
import { DirImporterPlugin } from './node/dir-importer.js';
import { AngularVitePluginOptions as VitePluginAngularOptions } from './plugin-options.js';
import { CommonPlugin } from './plugins/config.js';
import {
  usePluginBuildStart,
  usePluginConfig,
  usePluginTransform,
} from './utils.js';

export function angular(options?: VitePluginAngularOptions): Plugin[] {
  let plugin: Plugin[] | undefined;
  let isBuild = false;
  return [
    CommonPlugin(),
    DirImporterPlugin,
    {
      name: 'vite-plugin-angular',
      enforce: 'pre',
      async config(_config, env) {
        //@ts-ignore
        const { buildSteps, ...config } = _config;
        isBuild = env.command === 'build';

        if (isBuild && !env.ssrBuild) {
          // ProductionPlugin compiles the code with the Angular AOT compiler(ngtsc) and bundles with esbuild/babel
          // Collects diagnostics from the angular compiler(type-checking). It exits if there are any errors.
          const { ProductionPlugin } = await import('./plugins/prod.plugin.js');
          plugin = ProductionPlugin(config, env);
        } else {
          // DevelopmentPlugin uses SWC and injects "@angular/compiler" into the code for JIT compilation
          // always use DevelopmentPlugin for ssr build, because server code requires decorator metadata from swc
          // no type-checking for now
          // TODO: add typechecking
          const { DevelopmentPlugin } = await import('./plugins/dev.plugin.js');
          plugin = DevelopmentPlugin(config, env);
        }
        return usePluginConfig(plugin, config, env);
      },
      transform(code, id) {
        return usePluginTransform({ plugin, code, id, ctx: this });
      },
      buildStart(options) {
        return usePluginBuildStart({ plugin, options });
      },
    },
  ];
}
