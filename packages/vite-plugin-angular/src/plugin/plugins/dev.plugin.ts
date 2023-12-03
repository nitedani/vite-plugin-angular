import { Plugin } from 'vite';
import { swcTransform } from '../swc/transform.js';
import { readFile } from 'fs/promises';

type BootstrapFnName = 'bootstrapApplication' | 'renderPage';
const hmrCode = (bootstrapFnName: BootstrapFnName) => `
import {
  createInputTransfer,
  createNewHosts,
  removeNgStyles,
} from '@nitedani/vite-plugin-angular/hmr';

// @ts-ignore
const __${bootstrapFnName} = async (...args) => {
  removeNgStyles();
  // @ts-ignore
  return ${bootstrapFnName}(...args).then((appRef) => {
    if (import.meta.hot) {
      import.meta.hot.accept();
      import.meta.hot.dispose(() => {
        const cmpLocation = appRef.components.map(
          (cmp) => cmp.location.nativeElement
        );

        //@ts-ignore
        import.meta.hot.data.store = {
          disposeOldHosts: createNewHosts(cmpLocation),
          restoreInputValues: createInputTransfer(),
        };
      });

      const store = import.meta.hot.data.store;
      if (store) {
        store.disposeOldHosts();
        store.restoreInputValues();
        appRef.tick();
        delete import.meta.hot.data.store;
      }
    }
    return appRef;
  });
};
`;

export const DevelopmentPlugin: Plugin = {
  name: 'vite-plugin-angular-dev',
  enforce: 'pre',
  apply(config, env) {
    const isBuild = env.command === 'build';
    return !isBuild;
  },
  config(_userConfig, env) {
    return {
      esbuild: false,
    };
  },
  transformIndexHtml(html) {
    const compilerScript = `<script type="module" src="/@angular/compiler"></script>`;
    return html.replace('</head>', `${compilerScript}</head>`);
  },
  async load(id) {
    if (id === '/@angular/compiler') {
      const resolved = await this.resolve('@angular/compiler');
      if (!resolved) {
        return null;
      }
      const code = await readFile(resolved.id.split('?')[0], 'utf-8');
      return code;
    }
    return null;
  },
  transform(code, id) {
    //TODO: do this better
    const isEntry = id.endsWith('main.ts');

    if (isEntry) {
      let bootstrapFnName: BootstrapFnName | undefined = undefined;
      code = code.replace('bootstrapApplication(', match => {
        bootstrapFnName = 'bootstrapApplication';
        return '__bootstrapApplication(';
      });

      // Won't work because vavite(I think) reloads the page anyway
      // code = code.replace('renderPage(', match => {
      //   bootstrapFnName = 'renderPage';
      //   return '__renderPage(';
      // });

      if (bootstrapFnName) {
        code = hmrCode(bootstrapFnName) + code;
      }
    }

    return swcTransform({
      code,
      id,
    });
  },
};
