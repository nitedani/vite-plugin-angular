import {
  JsMinifyOptions,
  minify,
  plugins,
  Program,
  transform,
} from '@swc/core';

import { AngularComponents, AngularInjector } from './swc/index';
const fileExtensionRE = /\.[^/\s?]+$/;

export const swcTransform = async ({ code, id, isSsr, isProduction }) => {
  const minifyOptions: JsMinifyOptions = {
    compress: !isSsr && isProduction,
    mangle: !isSsr && isProduction,
    ecma: '2020',
    module: true,
    format: {
      comments: false,
    },
  };

  if (id.includes('node_modules')) {
    return minify(code, minifyOptions);
  }

  const [filepath, querystring = ''] = id.split('?');
  const [extension = ''] =
    querystring.match(fileExtensionRE) || filepath.match(fileExtensionRE) || [];

  if (!/\.(js|ts|tsx|jsx?)$/.test(extension)) {
    return;
  }

  return transform(code, {
    sourceMaps: !isProduction,
    jsc: {
      target: 'es2020',
      parser: {
        syntax: 'typescript',
        tsx: false,
        decorators: true,
        dynamicImport: true,
      },
      transform: {
        decoratorMetadata: true,
        legacyDecorator: true,
      },
      minify: minifyOptions,
    },
    minify: !isSsr && isProduction,
    plugin: plugins([
      (m: Program) => {
        const angularComponentPlugin = new AngularComponents({
          sourceUrl: id,
        });
        return angularComponentPlugin.visitProgram(m);
      },
      (m: Program) => {
        const angularInjectorPlugin = new AngularInjector();
        return angularInjectorPlugin.visitProgram(m);
      },
      // (m: Program) => {
      //   return new AngularImportCompilerComponents().visitProgram(m);
      // },
      // ...(isProduction
      //   ? [
      //       (m: Program) =>
      //         new AngularSwapPlatformDynamic().visitProgram(m),
      //     ]
      //   : []),
    ]),
  });
};
