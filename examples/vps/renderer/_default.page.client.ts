import 'zone.js/dist/zone.js';
import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client/router';
import { reflectComponentType } from '@angular/core';
import { ApplicationRef, NgZone, createComponent } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { WrapperPage } from './wrapper.page';

export { render };

export const clientRouting = true;

async function render(pageContext: PageContextBuiltInClient & any) {
  const { Page, pageProps } = pageContext;

  const container = document.getElementById('page-view')!;
  createApplication().then((appRef: ApplicationRef) => {
    const zone = appRef.injector.get(NgZone);
    zone.run(() => {
      const componentRef = createComponent(WrapperPage, {
        environmentInjector: appRef.injector,
        hostElement: container,
      });

      const mirror = reflectComponentType(WrapperPage);

      if ((pageProps || Page) && mirror) {
        for (const i of mirror.inputs) {
          if (pageProps) {
            if (i.propName in pageProps || i.templateName in pageProps) {
              componentRef.setInput(i.propName, pageProps[i.propName]);
            }
            if (i.propName === 'pageProps' || i.templateName === 'pageProps') {
              componentRef.setInput('pageProps', pageProps);
            }
          }
          if (Page) {
            if (i.propName === 'page' || i.templateName === 'page') {
              componentRef.setInput('page', Page);
            }
          }
        }
      }

      appRef.attachView(componentRef.hostView);
    });
  });
}
