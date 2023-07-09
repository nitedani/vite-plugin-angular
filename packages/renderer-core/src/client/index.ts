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
import { LayoutComponent, mountPage } from '../shared/mountPage.js';
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
let hydrated = false;
export const renderPage = async <T, U>({
  page,
  layout,
  pageContext,
  providers = [],
  imports = [],
  selector,
}: {
  page: Type<T>;
  layout?: Type<LayoutComponent<U>>;
  pageContext?: any;
  providers?: (Provider | EnvironmentProviders)[];
  imports?: ImportProvidersSource;
} & Pick<Component, 'selector'>) => {
  const rootComponent = layout ?? page;
  selector ??= 'app-root';
  //@ts-ignore
  rootComponent.ɵcmp.selectors = [[selector]];

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
      ...(hydrated ? [] : [provideClientHydration()]),
      importProvidersFrom(imports),
    ],
  });
  hydrated = true;
  const zone = appRef.injector.get(NgZone);

  return zone.run(() => {
    const compRef = createComponent<LayoutComponent<U> | T>(rootComponent, {
      environmentInjector: appRef.injector,
      hostElement: document.querySelector(selector!)!,
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
