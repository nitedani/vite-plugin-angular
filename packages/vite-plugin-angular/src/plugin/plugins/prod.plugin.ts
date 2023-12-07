import angularApplicationPreset from '@angular-devkit/build-angular/src/tools/babel/presets/application.js';
import { createCompilerPlugin } from '@angular-devkit/build-angular/src/tools/esbuild/angular/compiler-plugin.js';
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
import ts from 'typescript';
import { Plugin } from 'vite';
import { ResolvedVitePluginAngularOptions } from '../../plugin/plugin-options.js';
import { OptimizerPlugin } from './optimizer.plugin.js';

interface EmitFileResult {
  code: string;
  map?: string;
  dependencies: readonly string[];
  hash?: Uint8Array;
}
type FileEmitter = (file: string) => Promise<EmitFileResult | undefined>;

export const ProductionPlugin = (
  options: ResolvedVitePluginAngularOptions,
): Plugin[] => {
  let root = '';
  let tsconfigPath = '';
  let workspaceRoot = '';
  let isBuild = false;

  let rootNames: string[] = [];
  let compilerOptions: any = {};
  let host: ts.CompilerHost;
  let fileEmitter: FileEmitter | undefined;

  async function buildAndAnalyze() {
    const angularProgram: NgtscProgram = new NgtscProgram(
      rootNames,
      compilerOptions,
      host as CompilerHost,
    );

    const angularCompiler = angularProgram.compiler;
    const typeScriptProgram = angularProgram.getTsProgram();
    const builder = ts.createAbstractBuilder(typeScriptProgram, host);
    await angularCompiler.analyzeAsync();
    const diagnostics = angularCompiler.getDiagnostics();

    const msg = ts.formatDiagnosticsWithColorAndContext(diagnostics, host);
    if (msg) {
      return msg;
    }

    fileEmitter = createFileEmitter(
      builder,
      mergeTransformers(angularCompiler.prepareEmit().transformers, {
        before: [replaceBootstrap(() => builder.getProgram().getTypeChecker())],
      }),
      () => [],
    );
  }

  return [
    {
      name: 'vite-plugin-angular-prod-post',
      enforce: 'post',
      config(_userConfig, env) {
        root = globalThis.__vite_plugin_angular.root;
        workspaceRoot = globalThis.__vite_plugin_angular.workspaceRoot;
        tsconfigPath = join(root, 'tsconfig.json');
        isBuild = env.command === 'build';
        if (options.swc && !isBuild) {
          return;
        }
        return {
          optimizeDeps: {
            esbuildOptions: {
              plugins: [
                createCompilerPlugin(
                  {
                    tsconfig: tsconfigPath,
                    sourcemap: false,
                    advancedOptimizations: true,
                    incremental: true,
                  },
                  {
                    workspaceRoot,
                    // browsers: ['safari 15'],
                    outputNames: {
                      bundles: '[name]',
                      media: '',
                    },
                    sourcemap: false,
                    optimization: true,
                    target: ['es2020'],
                    inlineStyleLanguage: 'scss',
                  },
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
    },
    {
      name: 'vite-plugin-angular-prod',
      enforce: 'pre',
      async transform(code, id) {
        if (options.swc && !isBuild) {
          return;
        }

        if (id.includes('node_modules')) {
          return;
        }

        if (/\.[cm]?tsx?$/.test(id)) {
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
          },
        );
        rootNames = rn;
        compilerOptions = tsCompilerOptions;
        host = ts.createIncrementalCompilerHost(compilerOptions);
        const msg = await buildAndAnalyze();
        if (msg) {
          console.log(msg);
          if (isBuild) {
            process.exit(1);
          }
        }
      },
      async handleHotUpdate(ctx) {
        const msg = await buildAndAnalyze();
        if (msg) {
          console.log(msg);
          return [];
        }
      },
    },
    OptimizerPlugin(options),
  ];
};

export function createFileEmitter(
  program: ts.BuilderProgram,
  transformers: ts.CustomTransformers = {},
  onAfterEmit?: (sourceFile: ts.SourceFile) => void,
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
      transformers,
    );

    onAfterEmit?.(sourceFile);

    return { code, dependencies: [] };
  };
}
