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
  pageContext,
  providers,
  ...componentParameters
}: {
  page: Type<T>;
  layout?: Type<U>;
  pageContext?: any;
  providers?: Array<Provider | ImportedNgModuleProviders>;
} & Pick<Component, 'imports' | 'selector'>) => {
  componentParameters.imports ??= [];
  componentParameters.selector ??= 'app-root';

  //@ts-ignore
  DefaultWrapper.ɵcmp.selectors = [[componentParameters.selector]];
  //@ts-ignore
  DefaultWrapper.ɵcmp.dependencies = componentParameters.imports;
  //TODO: check if anything else needs to be set

  const appRef = await createApplication({ providers: providers || [] });
  const zone = appRef.injector.get(NgZone);

  zone.run(() => {
    const compRef = createComponent(DefaultWrapper, {
      environmentInjector: appRef.injector,
      hostElement: document.querySelector(componentParameters.selector!)!,
    });

    mountPage({
      page,
      compRef,
      pageProps: pageContext?.pageProps,
      layout,
    });

    appRef.attachView(compRef.hostView);
  });
  return appRef;
};
