import { Plugin } from 'vite';

export const HmrPlugin: Plugin = {
  name: 'vite-plugin-angular-hmr',
  enforce: 'pre',
  apply(config, env) {
    const isDev = env.command === 'serve';
    return isDev;
  },
  config(config, env) {
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
    return code;
  },
};

export const hmrCode = `
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
