import { Plugin } from 'vite';
import { swcTransform } from '../swc/transform.js';

const hmrCode = `
import {
  createInputTransfer,
  createNewHosts,
  removeNgStyles,
} from '@nitedani/vite-plugin-angular/hmr';

// @ts-ignore
const __bootstrapApplication = async (...args) => {
  removeNgStyles();
  // @ts-ignore
  return bootstrapApplication(...args).then((appRef) => {
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
    const isSsrBuild = env.ssrBuild === true;
    return !isBuild || isSsrBuild;
  },
  config(_userConfig, env) {
    return {
      esbuild: false,
    };
  },
  resolveId(id) {
    if (id === '/@angular/compiler') {
      return this.resolve('@angular/compiler');
    }
  },
  transformIndexHtml(html) {
    const compilerScript = `<script type="module" src="/@angular/compiler"></script>`;
    return html.replace('</head>', `${compilerScript}</head>`);
  },
  transform(code, id) {
    //TODO: do this better
    const isEntry = id.endsWith('main.ts');

    if (isEntry) {
      let t = 0;
      let found = false;
      code = code.replace(/bootstrapApplication/g, match => {
        if (++t === 2) {
          found = true;
          return '__bootstrapApplication';
        }
        return match;
      });
      if (found) {
        code = hmrCode + code;
      }
    }
    // Run everything else through SWC
    // On the server, we need decorator metadata,
    // @analogjs/vite-plugin-angular uses esbuild, but esbuild doesn't support decorator metadata
    return swcTransform({
      code,
      id,
      isSsr: false,
      isProduction: false,
    });
  },
};
