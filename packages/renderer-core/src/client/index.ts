import 'zone.js/dist/zone.js';
import {
  Component,
  createComponent,
  enableProdMode,
  ImportedNgModuleProviders,
  NgZone,
  Provider,
  Type,
} from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { mountPage } from '../shared/mountPage.js';
import { DefaultWrapper } from '../shared/angular/wrapper.js';
if (import.meta.env.PROD) {
  enableProdMode();
}

export const renderPage = async <T, U>({
  page,
  layout,
  pageProps,
  providers,
  ...componentParameters
}: {
  page: Type<T>;
  layout?: Type<U>;
  pageProps?: any;
  providers?: Array<Provider | ImportedNgModuleProviders>;
} & Pick<Component, 'imports' | 'selector'>) => {
  componentParameters.selector ??= 'app-root';
  let wrapper = DefaultWrapper;
  if (import.meta.env.PROD) {
    //@ts-ignore
    wrapper.ɵcmp.selectors = [[componentParameters.selector]];
    //@ts-ignore
    wrapper.ɵcmp.dependencies = componentParameters.imports;
    //TODO: check if anything else needs to be set
  } else {
    // wrapper.ɵcmp would be undefined in JIT mode
    const { getWrapper } = await import('../shared/angular/wrapper.dev.js');
    wrapper = getWrapper(componentParameters);
  }

  const appRef = await createApplication({ providers: providers || [] });
  const zone = appRef.injector.get(NgZone);

  zone.run(() => {
    const compRef = createComponent(wrapper, {
      environmentInjector: appRef.injector,
      hostElement: document.getElementById(componentParameters.selector!)!,
    });

    mountPage({
      page,
      compRef,
      pageProps,
      layout,
    });

    appRef.attachView(compRef.hostView);
  });
  return appRef;
};
