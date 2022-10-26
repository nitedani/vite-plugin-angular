import { Plugin } from 'vite';
import { DirImporterPlugin } from './node/dir-importer.js';
import { AngularVitePluginOptions as VitePluginAngularOptions } from './plugin-options.js';
import { CommonPlugin } from './plugins/config.js';
import { DevelopmentPlugin } from './plugins/dev.plugin.js';
import { ProductionPlugin } from './plugins/prod.plugin.js';

export function angular(options?: VitePluginAngularOptions): Plugin[] {
  return [
    CommonPlugin,
    DirImporterPlugin,
    DevelopmentPlugin,
    ...ProductionPlugin(),
  ];
}
