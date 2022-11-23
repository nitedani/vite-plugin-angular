import angularApplicationPreset from '@angular-devkit/build-angular/src/babel/presets/application.js';
import { createCompilerPlugin } from '@angular-devkit/build-angular/src/builders/browser-esbuild/compiler-plugin.js';
import {
  CompilerHost,
  join,
  NgtscProgram,
  readConfiguration,
} from '@angular/compiler-cli';
import { transformAsync } from '@babel/core';
import {
  mergeTransformers,
  replaceBootstrap,
} from '@ngtools/webpack/src/ivy/transformation.js';
import { cwd } from 'process';
import ts from 'typescript';
import { ModuleNode, Plugin, ViteDevServer } from 'vite';
import { OptimizerPlugin } from './optimizer.plugin.js';
import { replaceResources } from '@ngtools/webpack/src/transformers/replace_resources.js';
import {
  augmentProgramWithVersioning,
  augmentHostWithCaching,
} from '@ngtools/webpack/src/ivy/host.js';
import { SourceFileCache } from '@ngtools/webpack/src/ivy/cache.js';

import { dirname, resolve } from 'path';
import { swcTransform } from '../swc/transform.js';
let sourceFileCache = new SourceFileCache();
let isTest = process.env['NODE_ENV'] === 'test' || !!process.env['VITEST'];
const styleUrlsRE = /styleUrls\s*:\s*\[([^\[]*?)\]/;
const templateUrlRE = /\s*templateUrl\s*:\s*["|']*?["|'].*/;

export function hasStyleUrls(code: string) {
  return styleUrlsRE.test(code);
}

export function resolveStyleUrls(code: string, id: string) {
  const styleUrlsGroup = styleUrlsRE.exec(code);

  if (Array.isArray(styleUrlsGroup) && styleUrlsGroup[0]) {
    const styleUrls = styleUrlsGroup[0].replace(
      /(styleUrls|\:|\s|\[|\]|"|')/g,
      ''
    );
    const styleUrlPaths = styleUrls?.split(',') || [];

    return styleUrlPaths.map(styleUrlPath =>
      resolve(dirname(id), styleUrlPath)
    );
  }

  return [];
}

export function hasTemplateUrl(code: string) {
  return templateUrlRE.test(code);
}

export function resolveTemplateUrl(code: string, id: string) {
  const templateUrlGroup = templateUrlRE.exec(code);

  let templateUrlPath = '';
  if (Array.isArray(templateUrlGroup) && templateUrlGroup[0]) {
    const resolvedTemplatePath = templateUrlGroup![0].replace(
      /templateUrl|\s|'|"|\:|,/g,
      ''
    );
    templateUrlPath = resolve(dirname(id), resolvedTemplatePath);
  }

  return templateUrlPath;
}
const TS_EXT_REGEX = /\.[cm]?ts[^x]?\??/;
interface EmitFileResult {
  code: string;
  map?: string;
  dependencies: readonly string[];
  hash?: Uint8Array;
}
type FileEmitter = (file: string) => Promise<EmitFileResult | undefined>;

export const ProductionPlugin = (): Plugin[] => {
  const tsconfigPath = join(cwd(), 'tsconfig.json');
  const workspaceRoot = cwd();
  let viteServer: ViteDevServer;
  let rootNames: string[] = [];
  let compilerOptions: any = {};
  let host: ts.CompilerHost;
  let fileEmitter: FileEmitter | undefined;
  let isSsrBuild = false;
  let isDev = false;
  let isBuild = false;
  async function buildAndAnalyze() {
    const angularProgram: NgtscProgram = new NgtscProgram(
      rootNames,
      compilerOptions,
      host as CompilerHost
    );
    const angularCompiler = angularProgram.compiler;
    const typeScriptProgram = angularProgram.getTsProgram();
    const builder = ts.createAbstractBuilder(typeScriptProgram, host);

    const analyze = async () => {
      await angularCompiler.analyzeAsync();
      const diagnostics = angularCompiler.getDiagnostics();

      const msg = ts.formatDiagnosticsWithColorAndContext(diagnostics, host);
      if (msg) {
        console.log(msg);
        if (!isDev) {
          process.exit(1);
        }
      }
    };

    const promise = analyze();
    if (!isDev) {
      await promise;
    }

    fileEmitter = createFileEmitter(
      builder,
      angularCompiler.prepareEmit().transformers,
      () => []
    );
  }

  return [
    {
      name: 'vite-plugin-angular-prod',
      enforce: 'pre',
      apply(config, env) {
        isBuild = env.command === 'build';
        isDev = env.command === 'serve';
        const isSsrBuild = env.ssrBuild;
        return isDev || (isBuild && !isSsrBuild);
      },
      configureServer(server) {
        viteServer = server;
      },
      config(_userConfig, env) {
        return {
          optimizeDeps: {
            esbuildOptions: {
              plugins: [
                createCompilerPlugin(
                  {
                    tsconfig: tsconfigPath,
                    sourcemap: false,
                    advancedOptimizations: true,
                  },
                  {
                    workspaceRoot,
                    sourcemap: false,
                    optimization: true,
                  }
                ),
              ],
              define: {
                ngDevMode: 'false',
                ngJitMode: 'false',
                ngI18nClosureMode: 'false',
              },
            },
          },
        };
      },
      async handleHotUpdate(ctx) {
        if (TS_EXT_REGEX.test(ctx.file)) {
          sourceFileCache.invalidate(ctx.file.replace(/\?(.*)/, ''));
          await buildAndAnalyze();
        }

        if (/\.(html|htm|css|less|sass|scss)$/.test(ctx.file)) {
          /**
           * Check to see if this was a direct request
           * for an external resource (styles, html).
           */
          const isDirect = ctx.modules.find(
            mod => ctx.file === mod.file && mod.id?.includes('?direct')
          );

          if (isDirect) {
            return ctx.modules;
          }

          let mods: ModuleNode[] = [];
          ctx.modules.forEach(mod => {
            mod.importers.forEach(imp => {
              imp.id && sourceFileCache.invalidate(imp.id);
              ctx.server.moduleGraph.invalidateModule(imp);
              mods.push(imp);
            });
          });

          await buildAndAnalyze();
          return mods;
        }

        return ctx.modules;
      },

      async buildStart(options) {
        const { options: tsCompilerOptions, rootNames: rn } = readConfiguration(
          tsconfigPath,
          {
            enableIvy: true,
            compilationMode: 'full',
            noEmitOnError: false,
            suppressOutputPathCheck: true,
            outDir: undefined,
            inlineSources: false,
            inlineSourceMap: false,
            sourceMap: false,
            mapRoot: undefined,
            sourceRoot: undefined,
            declaration: false,
            declarationMap: false,
            allowEmptyCodegenFiles: false,
            annotationsAs: 'decorators',
            enableResourceInlining: false,
          }
        );
        rootNames = rn;
        compilerOptions = tsCompilerOptions;
        host = ts.createIncrementalCompilerHost(compilerOptions);
        augmentHostWithCaching(host, sourceFileCache);
        await buildAndAnalyze();
      },
      async transform(code, id) {
        if (
          id.includes('node_modules') ||
          //TODO: why is this needed? vite-plugin-ssr throws an error if this is not here
          // debug and remove this if possible
          code.includes('@nitedani/vite-plugin-angular/client')
        ) {
          return;
        }

        const isAngularSource =
          (code.includes('@Injectable') ||
            code.includes('@Component') ||
            code.includes('@NgModule')) &&
          code.includes('@angular/core');

        if (!isAngularSource) {
          return swcTransform({
            code,
            id,
            isSsr: isSsrBuild,
            isProduction: isBuild,
          });
        }

        if (TS_EXT_REGEX.test(id)) {
          if (id.includes('.ts?')) {
            // Strip the query string off the ID
            // in case of a dynamically loaded file
            id = id.replace(/\?(.*)/, '');
          }
          if (isTest) {
            const tsMod = viteServer.moduleGraph.getModuleById(id);
            if (tsMod) {
              sourceFileCache.invalidate(id);
              await buildAndAnalyze();
            }
          }

          if (isDev) {
            if (hasTemplateUrl(code)) {
              const templateUrl = resolveTemplateUrl(code, id);

              if (templateUrl) {
                this.addWatchFile(templateUrl);
              }
            }

            if (hasStyleUrls(code)) {
              const styleUrls = resolveStyleUrls(code, id);

              styleUrls.forEach(styleUrl => {
                this.addWatchFile(styleUrl);
              });
            }
          }

          const result = await fileEmitter!(id);
          const data = result?.code ?? '';
          const forceAsyncTransformation =
            /for\s+await\s*\(|async\s+function\s*\*/.test(data);
          const babelResult = await transformAsync(data, {
            filename: id,
            inputSourceMap: false,
            sourceMaps: false,
            compact: false,
            configFile: false,
            babelrc: false,
            browserslistConfigFile: false,
            plugins: [],
            presets: [
              [
                angularApplicationPreset,
                {
                  forceAsyncTransformation,
                  optimize: {},
                },
              ],
            ],
          });

          return {
            code: babelResult?.code ?? '',
            map: babelResult?.map,
          };
        }

        return undefined;
      },
    },
    OptimizerPlugin,
  ];
};

export function createFileEmitter(
  program: ts.BuilderProgram,
  transformers: ts.CustomTransformers = {},
  onAfterEmit?: (sourceFile: ts.SourceFile) => void
): FileEmitter {
  return async (file: string) => {
    const sourceFile = program.getSourceFile(file);
    if (!sourceFile) {
      return undefined;
    }

    let code: string = '';
    program.emit(
      sourceFile,
      (filename, data) => {
        if (/\.[cm]?js$/.test(filename)) {
          if (data) {
            code = data;
          }
        }
      },
      undefined /* cancellationToken */,
      undefined /* emitOnlyDtsFiles */,
      transformers
    );

    onAfterEmit?.(sourceFile);

    return { code, dependencies: [] };
  };
}
