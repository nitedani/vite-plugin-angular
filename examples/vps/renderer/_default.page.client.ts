import 'zone.js/dist/zone.js';
import type { PageContextBuiltInClient } from 'vite-plugin-ssr/client/router';
import { reflectComponentType } from '@angular/core';
import { ApplicationRef, NgZone, createComponent } from '@angular/core';
import { createApplication } from '@angular/platform-browser';

export { render };

export const clientRouting = true;

async function render(pageContext: PageContextBuiltInClient & any) {
  const { Page, pageProps } = pageContext;

  const container = document.getElementById('page-view')!;
  createApplication().then((appRef: ApplicationRef) => {
    const zone = appRef.injector.get(NgZone);
    zone.run(() => {
      const componentRef = createComponent(Page, {
        environmentInjector: appRef.injector,
        hostElement: container,
      });

      const mirror = reflectComponentType(Page);

      if (pageProps && mirror) {
        for (const [key, value] of Object.entries(pageProps)) {
          if (
            mirror.inputs.some(
              ({ templateName, propName }) =>
                templateName === key || propName === key
            )
          ) {
            componentRef.setInput(key, value);
          }
        }

        if (
          mirror.inputs.some(
            ({ templateName, propName }) =>
              templateName === 'pageProps' || propName === 'pageProps'
          )
        ) {
          componentRef.setInput('pageProps', pageProps);
        }
      }

      appRef.attachView(componentRef.hostView);
    });
  });
}
