import 'zone.js/dist/zone.js';
import {
  APP_BOOTSTRAP_LISTENER,
  Component,
  createComponent,
  enableProdMode,
  EnvironmentProviders,
  importProvidersFrom,
  ImportProvidersSource,
  NgZone,
  Provider,
  Type,
} from '@angular/core';
import {
  createApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { mountPage } from '../shared/mountPage.js';
import { DefaultWrapper } from '../shared/angular/wrapper.js';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HttpHandler,
  HttpRequest,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';

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
  providers?: (Provider | EnvironmentProviders)[];
  imports?: ImportProvidersSource;
} & Pick<Component, 'selector'>) => {
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

  extraProviders.push({
    provide: HTTP_INTERCEPTORS,
    useFactory: () => ({
      intercept(req: HttpRequest<any>, next: HttpHandler) {
        // check if the request is for the server
        if (req.url.startsWith('/')) {
          // if so, call the server
          return next.handle(
            req.clone({
              url: `${window.location.origin}${req.url}`,
            }),
          );
        }
        return next.handle(req);
      },
    }),
    multi: true,
  });

  const appRef = await createApplication({
    providers: [
      ...providers,
      ...extraProviders,
      provideHttpClient(withInterceptorsFromDi()),
      provideClientHydration(),
      importProvidersFrom(imports),
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
