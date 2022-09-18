import 'zone.js/dist/zone.js';
import {
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
  container,
  providers,
}: {
  page: Type<T>;
  layout?: Type<U>;
  pageProps: any;
  container: Element;
  providers?: Array<Provider | ImportedNgModuleProviders>;
}) => {
  const appRef = await createApplication({ providers: providers || [] });
  const zone = appRef.injector.get(NgZone);
  zone.run(() => {
    const compRef = createComponent(DefaultWrapper, {
      environmentInjector: appRef.injector,
      hostElement: container,
    });

    if (page || layout) {
      mountPage({
        page,
        compRef,
        pageProps,
        layout,
      });
    }

    appRef.attachView(compRef.hostView);
  });
  return appRef;
};
