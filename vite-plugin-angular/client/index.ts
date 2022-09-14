import 'zone.js/dist/zone.js';
import {
  createComponent,
  enableProdMode,
  ImportedNgModuleProviders,
  NgZone,
  Provider,
  reflectComponentType,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { mountPage } from '../shared/mountPage.js';
if (import.meta.env.PROD) {
  enableProdMode();
}
interface WrapperPage<T> {
  page: ViewContainerRef;
}

export const renderPage = async <T, U extends WrapperPage<T>>({
  page,
  wrapperPage,
  pageProps,
  container,
  providers,
}: {
  page: Type<T>;
  wrapperPage?: Type<U>;
  pageProps: any;
  container: Element;
  providers?: Array<Provider | ImportedNgModuleProviders>;
}) => {
  const rootPage = wrapperPage || page;
  const appRef = await createApplication({ providers: providers || [] });
  const zone = appRef.injector.get(NgZone);
  zone.run(() => {
    //@ts-ignore
    const compRef = createComponent(rootPage, {
      environmentInjector: appRef.injector,
      hostElement: container,
    });

    if (page && wrapperPage) {
      const instance = compRef.instance as unknown as U;
      const containerRef = instance.page;

      mountPage({
        page,
        containerRef,
        pageProps,
      });
    }

    //@ts-ignore
    const mirror = reflectComponentType(rootPage);
    if ((pageProps || page) && mirror) {
      for (const i of mirror.inputs) {
        if (pageProps) {
          if (i.propName in pageProps || i.templateName in pageProps) {
            compRef.setInput(i.propName, pageProps[i.propName]);
          }
          if (i.propName === 'pageProps' || i.templateName === 'pageProps') {
            compRef.setInput('pageProps', pageProps);
          }
        }
        if (page && wrapperPage) {
          if (i.propName === 'page' || i.templateName === 'page') {
            compRef.setInput('page', page);
          }
        }
      }
    }

    appRef.attachView(compRef.hostView);
  });
  return appRef;
};
