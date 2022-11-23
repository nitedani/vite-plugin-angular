import {
  JsMinifyOptions,
  minify,
  plugins,
  Program,
  transform,
} from '@swc/core';

import { AngularComponents, AngularInjector } from './index.js';
const fileExtensionRE = /\.[^/\s?]+$/;
const JS_EXT_REGEX = /\.[cm]?js[^x]?\??/;
const JS_TS_EXT_REGEX = /\.[cm]?[tj]s[^x]?\??/;
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
    if (isProduction && JS_EXT_REGEX.test(id)) {
      return minify(code, minifyOptions);
    }
    return;
  }

  if (!JS_TS_EXT_REGEX.test(id)) {
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
    // plugin: plugins([
    //   (m: Program) => {
    //     const angularComponentPlugin = new AngularComponents({
    //       sourceUrl: id,
    //     });
    //     return angularComponentPlugin.visitProgram(m);
    //   },
    //   (m: Program) => {
    //     const angularInjectorPlugin = new AngularInjector();
    //     return angularInjectorPlugin.visitProgram(m);
    //   },
    //   // (m: Program) => {
    //   //   return new AngularImportCompilerComponents().visitProgram(m);
    //   // },
    //   // ...(isProduction
    //   //   ? [
    //   //       (m: Program) =>
    //   //         new AngularSwapPlatformDynamic().visitProgram(m),
    //   //     ]
    //   //   : []),
    // ]),
  });
};
