import 'zone.js/dist/zone.js';
import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client/router';
import {
  ImportedNgModuleProviders,
  Provider,
  reflectComponentType,
  Type,
} from '@angular/core';
import { ApplicationRef, NgZone, createComponent } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { WrapperPage } from './wrapper.page';

export { render };

export const clientRouting = true;

const hydratePage = <T, U>({
  page,
  wrapperPage,
  pageProps,
  container,
  providers,
}: {
  page: Type<T>;
  wrapperPage: Type<U>;
  pageProps: any;
  container: Element;
  providers?: Array<Provider | ImportedNgModuleProviders>;
}) => {
  createApplication({ providers }).then((appRef: ApplicationRef) => {
    const zone = appRef.injector.get(NgZone);
    zone.run(() => {
      const componentRef = createComponent(wrapperPage, {
        environmentInjector: appRef.injector,
        hostElement: container,
      });

      const mirror = reflectComponentType(wrapperPage);

      if ((pageProps || page) && mirror) {
        for (const i of mirror.inputs) {
          if (pageProps) {
            if (i.propName in pageProps || i.templateName in pageProps) {
              componentRef.setInput(i.propName, pageProps[i.propName]);
            }
            if (i.propName === 'pageProps' || i.templateName === 'pageProps') {
              componentRef.setInput('pageProps', pageProps);
            }
          }
          if (page) {
            if (i.propName === 'page' || i.templateName === 'page') {
              componentRef.setInput('page', page);
            }
          }
        }
      }

      appRef.attachView(componentRef.hostView);
    });
  });
};

async function render(pageContext: PageContextBuiltInClient & any) {
  const { Page, pageProps } = pageContext;

  const container = document.getElementById('page-view')!;
  hydratePage({
    page: Page,
    wrapperPage: WrapperPage,
    pageProps,
    container,
  });
}
