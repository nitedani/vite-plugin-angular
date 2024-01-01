export { BuildPlugin };

import angularApplicationPreset from '@angular-devkit/build-angular/src/tools/babel/presets/application.js';
import { CompilerPluginOptions } from '@angular-devkit/build-angular/src/tools/esbuild/angular/compiler-plugin.js';
import { JavaScriptTransformer } from '@angular-devkit/build-angular/src/tools/esbuild/javascript-transformer.js';
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
import {
  DepOptimizationConfig,
  normalizePath,
  Plugin,
  PluginContainer,
} from 'vite';
import { assert } from '../../utils/assert.js';
import { BuildOptimizerPlugin } from './buildOptimizerPlugin.js';
import { getGlobalConfig } from './configPlugin.js';

interface EmitFileResult {
  code: string;
  map?: string;
  dependencies: readonly string[];
  hash?: Uint8Array;
}
type FileEmitter = (file: string) => Promise<EmitFileResult | undefined>;

const BuildPlugin = (): Plugin[] => {
  let tsconfigPath = '';

  let rootNames: string[] = [];
  let compilerOptions: any = {};
  let host: ts.CompilerHost;
  let fileEmitter: FileEmitter | undefined;
  let cssPlugin: Plugin | undefined;

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
        return env.command === 'build';
      },
      config(_userConfig, env) {
        const { root, workspaceRoot } = getGlobalConfig();
        assert(root);
        assert(workspaceRoot);

        //TODO: users may name it tsconfig.app.json(angular cli convention)
        // add wrong usage message -> rename it to tsconfig.json
        tsconfigPath = join(root, 'tsconfig.json');
        return {
          optimizeDeps: {
            include: ['rxjs/operators', 'rxjs'],
            exclude: ['@angular/platform-server'],
            esbuildOptions: {
              plugins: [
                createCompilerPlugin({
                  tsconfig: tsconfigPath,
                  sourcemap: false,
                  advancedOptimizations: true,
                  incremental: true,
                }),
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
        return env.command === 'build';
      },
      async transform(code, id) {
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
      async buildStart({ plugins }) {
        const { options: tsCompilerOptions, rootNames: rn } = readConfiguration(
          tsconfigPath,
          {
            compilationMode: 'full',
            suppressOutputPathCheck: true,
            outDir: undefined,
            inlineSourceMap: false,
            inlineSources: false,
            declaration: false,
            declarationMap: false,
            allowEmptyCodegenFiles: false,
            annotationsAs: 'decorators',
            enableResourceInlining: false,
            supportTestBed: false,
          },
        );

        rootNames = rn;
        compilerOptions = tsCompilerOptions;
        host = ts.createIncrementalCompilerHost(compilerOptions);

        if (Array.isArray(plugins)) {
          cssPlugin = plugins.find(plugin => plugin.name === 'vite:css');
        }
        augmentHostWithResources(
          host,
          cssPlugin!.transform as PluginContainer['transform'],
          {
            inlineStylesExtension: 'scss',
          },
        );

        const msg = await buildAndAnalyze();
        if (msg) {
          console.log(msg);
          process.exit(1);
        }
      },
    },
    BuildOptimizerPlugin,
  ];
};

function createFileEmitter(
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

function augmentHostWithResources(
  host: ts.CompilerHost,
  transform: (
    code: string,
    id: string,
    options?: { ssr?: boolean },
  ) => ReturnType<any> | null,
  options: {
    inlineStylesExtension?: string;
  } = {},
) {
  const resourceHost = host as CompilerHost;

  resourceHost.readResource = function (fileName: string) {
    const filePath = normalizePath(fileName);

    const content = this.readFile(filePath);
    if (content === undefined) {
      throw new Error('Unable to locate component resource: ' + fileName);
    }

    return content;
  };

  resourceHost.transformResource = async function (data, context) {
    // Only style resources are supported currently
    if (context.type !== 'style') {
      return null;
    }

    if (options.inlineStylesExtension) {
      // Resource file only exists for external stylesheets
      const filename =
        context.resourceFile ??
        `${context.containingFile.replace(
          /\.ts$/,
          `.${options?.inlineStylesExtension}`,
        )}`;

      let stylesheetResult;

      try {
        stylesheetResult = await transform(data, `${filename}?direct`);
      } catch (e) {
        console.error(`${e}`);
      }

      return { content: stylesheetResult?.code || '' };
    }

    return null;
  };
}

type EsbuildOptions = NonNullable<DepOptimizationConfig['esbuildOptions']>;
type EsbuildPlugin = NonNullable<EsbuildOptions['plugins']>[number];
function createCompilerPlugin(
  pluginOptions: CompilerPluginOptions,
): EsbuildPlugin {
  const javascriptTransformer = new JavaScriptTransformer(pluginOptions, 1);

  return {
    name: 'vite-plugin-angular-deps-optimizer',
    async setup(build) {
      build.onLoad({ filter: /\.[cm]?js$/ }, async args => {
        const contents = await javascriptTransformer.transformFile(args.path);

        return {
          contents,
          loader: 'js',
        };
      });

      build.onEnd(() => javascriptTransformer.close());
    },
  };
}
