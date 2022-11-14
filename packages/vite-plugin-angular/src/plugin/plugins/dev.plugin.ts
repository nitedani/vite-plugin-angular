import { Plugin } from 'vite';
import { swcTransform } from '../swc/transform.js';

const hmrCode = `
import {
  createInputTransfer,
  createNewHosts,
  removeNgStyles,
} from '@nitedani/vite-plugin-angular/hmr';
let __appRef;
const __bootstrapApplication = (...args) => {
  removeNgStyles();
  return bootstrapApplication(...args).then((appRef) => {
    __appRef = appRef;
    return appRef;
  });
};
if (import.meta.hot) {
  //@ts-ignore
  import.meta.hot.accept(() => {
    //@ts-ignore
    const store = import.meta.hot.data.store;
    if (!store) return;
    if ('restoreInputValues' in store) {
      store.restoreInputValues();
    }
    __appRef.tick();
    store.disposeOldHosts();
    delete store.disposeOldHosts;
    delete store.state;
    delete store.restoreInputValues;
  });
  //@ts-ignore
  import.meta.hot.dispose(() => {
    const cmpLocation = __appRef.components.map(
      (cmp) => cmp.location.nativeElement
    );
    const store = {};
    //@ts-ignore
    store.disposeOldHosts = createNewHosts(cmpLocation);
    //@ts-ignore
    store.restoreInputValues = createInputTransfer();
    //@ts-ignore
    import.meta.hot.data.store = store;
  });
}
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
