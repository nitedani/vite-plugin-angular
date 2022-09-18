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
import { ConfigEnv, normalizePath, Plugin, UserConfig } from 'vite';
import { swcTransform } from '../swc/transform.js';
import { OptimizerPlugin } from './optimizer.plugin.js';

interface EmitFileResult {
  code: string;
  map?: string;
  dependencies: readonly string[];
  hash?: Uint8Array;
}
type FileEmitter = (file: string) => Promise<EmitFileResult | undefined>;

export const ProductionPlugin = (
  config: UserConfig,
  env: ConfigEnv
): Plugin[] => {
  const tsconfigPath = join(cwd(), 'tsconfig.json');
  const workspaceRoot = cwd();

  let rootNames: string[] = [];
  let compilerOptions: any = {};
  let host: ts.CompilerHost;
  let fileEmitter: FileEmitter | undefined;

  async function buildAndAnalyze() {
    const angularProgram: NgtscProgram = new NgtscProgram(
      rootNames,
      compilerOptions,
      host as CompilerHost
    );
    const angularCompiler = angularProgram.compiler;
    const typeScriptProgram = angularProgram.getTsProgram();
    const builder = ts.createAbstractBuilder(typeScriptProgram, host);
    await angularCompiler.analyzeAsync();
    const diagnostics = angularCompiler.getDiagnostics();

    const msg = ts.formatDiagnosticsWithColorAndContext(diagnostics, host);
    if (msg) {
      console.log(msg);
      process.exit(1);
    }

    fileEmitter = createFileEmitter(
      builder,
      mergeTransformers(angularCompiler.prepareEmit().transformers, {
        before: [replaceBootstrap(() => builder.getProgram().getTypeChecker())],
      }),
      () => []
    );
  }

  return [
    {
      name: 'vite-plugin-angular-prod',
      enforce: 'pre',
      apply: 'build',
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
        await buildAndAnalyze();
      },
      async transform(code, id) {
        const _id = normalizePath(id);
        const _check = normalizePath(join(cwd(), 'server'));
        // const _check2 = normalizePath(join(cwd(), 'renderer'));
        const isServerAsset = _id.includes(_check);
        const isComponent = () =>
          code.includes('@NgModule') || code.includes('@Component');

        if (isServerAsset && !isComponent()) {
          return swcTransform({
            code,
            id,
            isSsr: env.ssrBuild,
            isProduction: true,
          });
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
    },
    ...(!env.ssrBuild ? [OptimizerPlugin()] : []),
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
