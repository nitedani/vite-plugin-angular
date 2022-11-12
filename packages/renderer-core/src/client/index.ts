import 'zone.js/dist/zone.js';
import {
  APP_BOOTSTRAP_LISTENER,
  Component,
  createComponent,
  enableProdMode,
  importProvidersFrom,
  NgZone,
  Provider,
  Type,
} from '@angular/core';
import { BrowserModule, createApplication } from '@angular/platform-browser';
import { mountPage } from '../shared/mountPage.js';
import { DefaultWrapper } from '../shared/angular/wrapper.js';

if (import.meta.env.PROD) {
  enableProdMode();
}

export const renderPage = async <T, U>({
  page,
  layout,
  pageContext,
  providers = [],
  imports = [],
  ...componentParameters
}: {
  page: Type<T>;
  layout?: Type<U>;
  pageContext?: any;
} & Pick<Component, 'imports' | 'selector' | 'providers'>) => {
  const appId = 'server-app';
  componentParameters.selector ??= 'app-root';
  //@ts-ignore
  DefaultWrapper.ɵcmp.selectors = [[componentParameters.selector]];

  const extraProviders: Provider[] = [];
  if (pageContext) {
    extraProviders.push({
      provide: 'pageContext',
      useValue: new Proxy(pageContext, {
        get: (target, prop) => {
          if (prop === 'ngOnDestroy') {
            return null;
          }
          return target[prop];
        },
      }),
    });
  }

  const appRef = await createApplication({
    providers: [
      ...providers,
      ...extraProviders,
      importProvidersFrom(
        imports,
        BrowserModule.withServerTransition({ appId })
      ),
    ],
  });

  const zone = appRef.injector.get(NgZone);

  return zone.run(() => {
    const compRef = createComponent(DefaultWrapper, {
      environmentInjector: appRef.injector,
      hostElement: document.querySelector(componentParameters.selector!)!,
    });

    mountPage({
      page,
      compRef,
      pageProps: pageContext?.pageProps,
      layout,
      appRef,
    });

    appRef.attachView(compRef.hostView);
    appRef.tick();
    appRef.components.push(compRef);
    const listeners = appRef.injector.get(APP_BOOTSTRAP_LISTENER, []);
    listeners.forEach(listener => listener(compRef));

    return appRef;
  });
};
