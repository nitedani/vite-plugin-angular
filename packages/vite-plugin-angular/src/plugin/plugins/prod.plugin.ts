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
import { Plugin, PluginContainer, ViteDevServer } from 'vite';
import { ResolvedVitePluginAngularOptions } from '../../plugin/plugin-options.js';
import {
  StyleUrlsResolver,
  TemplateUrlsResolver,
} from './component.resolver.js';
import { augmentHostWithResources } from './host.js';
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
  let viteServer: ViteDevServer | undefined;
  let cssPlugin: Plugin | undefined;
  let styleTransform: PluginContainer['transform'] | undefined;
  const styleResolver = new StyleUrlsResolver();
  const templateResolver = new TemplateUrlsResolver();

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
      apply(config, env) {
        return env.command === 'build' || !options.swc;
      },
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
      apply(config, env) {
        return env.command === 'build' || !options.swc;
      },
      async transform(code, id) {
        if (options.swc && !isBuild) {
          return;
        }

        if (id.includes('node_modules')) {
          return;
        }

        if (!isBuild) {
          for (const urlSet of [
            ...templateResolver.resolve(code, id),
            ...styleResolver.resolve(code, id),
          ]) {
            // `urlSet` is a string where a relative path is joined with an
            // absolute path using the `|` symbol.
            // For example: `./app.component.html|/home/projects/analog/src/app/app.component.html`.
            const [, absoluteFileUrl] = urlSet.split('|');
            this.addWatchFile(absoluteFileUrl);
          }
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
      configureServer(server) {
        viteServer = server;
      },

      async buildStart({ plugins }) {
        if (Array.isArray(plugins)) {
          cssPlugin = plugins.find(plugin => plugin.name === 'vite:css');
        }
        styleTransform = isBuild
          ? (cssPlugin!.transform as PluginContainer['transform'])
          : viteServer!.pluginContainer.transform;

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
        if (!options.swc || isBuild) {
          augmentHostWithResources(host, styleTransform, {
            inlineStylesExtension: 'scss',
          });
        }
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
        return ctx.modules;
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
