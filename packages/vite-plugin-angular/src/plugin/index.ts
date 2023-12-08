import { Plugin } from 'vite';
import { DirImporterPlugin } from './node/dir-importer.js';
import { VitePluginAngularOptions } from './plugin-options.js';
import { CommonPlugin } from './plugins/config.js';
import { DevelopmentPlugin } from './plugins/dev.plugin.js';
import { ProductionPlugin } from './plugins/prod.plugin.js';
import defu from 'defu';

export function angular(options?: VitePluginAngularOptions): Plugin[] {
  const resolvedOptions = defu(options, {
    swc: true,
  });
  const plugins = [
    ...CommonPlugin(resolvedOptions),
    DirImporterPlugin,
    DevelopmentPlugin(resolvedOptions),
    ...ProductionPlugin(resolvedOptions),
  ];

  return plugins;
}
