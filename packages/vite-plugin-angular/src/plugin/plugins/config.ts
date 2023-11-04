import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';
import { Plugin } from 'vite';

// a hack to support ~ angular scss imports
const findNodeModules = () => {
  const candidates = [
    join(cwd(), '..', '..', '..', 'node_modules', '@angular'),
    join(cwd(), '..', '..', 'node_modules', '@angular'),
    join(cwd(), '..', 'node_modules', '@angular'),
    join(cwd(), 'node_modules', '@angular'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isDirectory()) {
      return candidate.replace('@angular', '');
    }
  }
};

const nodeModulesDir = findNodeModules()!;

const virtualModuleId = 'virtual:vite-plugin-angular';
const resolvedVirtualModuleId = '\0' + virtualModuleId;
let root = '';
export const CommonPlugin: Plugin = {
  name: 'vite-plugin-angular-common',
  enforce: 'pre',
  config(config, env) {
    const outDir = config.build?.outDir ?? 'dist';
    return {
      ssr: {
        external: ['reflect-metadata', 'xhr2'],
        noExternal: [
          /@nitedani\/vite-plugin-angular/,
          /@nitedani\/vite-plugin-ssr-adapter/,
          /@nitedani\/angular-renderer-core/,
          /@nitedani\/angular-renderer-express/,
          /@nitedani\/angular-renderer-nestjs/,
        ],
      },
      build: {
        outDir: env.ssrBuild ? join(outDir, 'server') : join(outDir, 'client'),
        rollupOptions: {
          external: ['xhr2'],
          output: {
            manualChunks: id => {
              const runtime1 = [
                '@nitedani/angular-renderer-core',
                '@nitedani/vite-plugin-angular/client',
                // '@angular',
                // 'zone.js',
              ];
              if (runtime1.some(s => id.includes(s))) {
                return 'runtime1';
              }
            },
          },
        },
      },
      optimizeDeps: {
        exclude: ['@angular/compiler'],
      },
      resolve: {
        alias: [
          {
            find: /~/,
            //@ts-ignore
            replacement: nodeModulesDir,
          },
        ],
      },
    };
  },
  configResolved(config) {
    root = config.root;
  },
  resolveId(id) {
    if (id === virtualModuleId) {
      return resolvedVirtualModuleId;
    }
  },
  load(id) {
    if (id === resolvedVirtualModuleId) {
      return `export const projectRoot = "${root}"`;
    }
  },
};
