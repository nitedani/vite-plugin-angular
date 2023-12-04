import { JsMinifyOptions, plugins, Program, transform } from '@swc/core';
import { AngularComponents, AngularInjector } from './index.js';

const fileExtensionRE = /\.[^/\s?]+$/;

export const swcTransform = async ({ code, id }) => {
  if (id.includes('node_modules')) {
    return;
  }

  const [filepath, querystring = ''] = id.split('?');
  const [extension = ''] =
    querystring.match(fileExtensionRE) || filepath.match(fileExtensionRE) || [];

  if (!/\.(js|ts|tsx|jsx?)$/.test(extension)) {
    return;
  }

  return transform(code, {
    sourceMaps: true,
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
    },
    minify: false,
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
    ]),
  });
};
