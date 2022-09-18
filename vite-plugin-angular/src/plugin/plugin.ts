import { Plugin } from 'vite';
import { DevelopmentPlugin } from './dev.plugin.js';
import { DirImporterPlugin } from './node/dir-importer.js';
import { AngularVitePluginOptions as VitePluginAngularOptions } from './plugin-options.js';
import { ProductionPlugin } from './prod.plugin.js';

export function angular(options?: VitePluginAngularOptions): Plugin[] {
  return [DirImporterPlugin, DevelopmentPlugin(), ProductionPlugin()];
}
