import '@angular/compiler';
import '@angular/platform-server/init';
import 'zone.js/node';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HttpHandler,
  HttpRequest,
  HTTP_INTERCEPTORS,
  withFetch,
} from '@angular/common/http';
import {
  APP_BOOTSTRAP_LISTENER,
  ApplicationRef,
  Component,
  enableProdMode,
  importProvidersFrom,
  ImportProvidersSource,
  InjectionToken,
  NgZone,
  Provider,
  Type,
} from '@angular/core';
import {
  provideServerRendering,
  renderApplication,
} from '@angular/platform-server';
import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { LayoutComponent, mountPage } from '../shared/mountPage.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { filter, firstValueFrom } from 'rxjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (import.meta.env.PROD) {
  enableProdMode();
}

export const SSR_PAGE_PROPS = new InjectionToken<{
  pageProps: Record<string, unknown>;
  page: Type<{}> | null;
  layout: Type<{}> | null;
}>('@vikejs/vite-plugin-angular/ssr-props', {
  factory() {
    return {
      pageProps: {},
      page: null,
      layout: null,
    };
  },
});

export const SSR_PAGE_PROPS_HOOK_PROVIDER: Provider = {
  provide: APP_BOOTSTRAP_LISTENER,
  useFactory: (
    appRef: ApplicationRef,
    {
      page,
      layout,
    }: {
      page: Type<{}>;
      layout?: Type<LayoutComponent<{}>>;
    },
  ) => {
    let done = false;
    return async () => {
      if (done) {
        return;
      }
      done = true;

      const compRef = appRef.components[0];
      const zone = appRef.injector.get(NgZone);
      await zone.run(async () => {
        mountPage({
          page,
          compRef,
          layout,
        });

        await firstValueFrom(
          appRef.isStable.pipe(filter(isStable => isStable)),
        );

        appRef.tick();
      });
    };
  },
  deps: [ApplicationRef, SSR_PAGE_PROPS],
  multi: true,
};

export interface RenderToStringOptions<T = any, U = any>
  extends Pick<Component, 'selector'> {
  imports?: ImportProvidersSource;
  providers?: Provider[];
  page: Type<T>;
  layout?: Type<U>;
  pageContext?: { pageProps?: any; req?: any; res?: any; urlOriginal?: string };
  document?: string;
  serverUrl?: string;
  root?: string;
  url?: string;
}

export const renderToString = async <T, U>({
  page,
  layout,
  pageContext,
  providers = [],
  imports = [],
  document,
  serverUrl,
  root,
  selector,
  url,
}: RenderToStringOptions<T, U>) => {
  const rootComponent = layout ?? page;
  selector ??= 'app-root';
  //@ts-ignore
  rootComponent.ɵcmp.selectors = [[selector]];
  document ??= `<${selector}></${selector}>`;
  root ??= join(__dirname, '..', 'client');
  const urlOriginal = url ?? pageContext?.urlOriginal;

  if (!serverUrl && pageContext?.req) {
    serverUrl = `${pageContext.req.protocol}://${pageContext.req.get('host')}`;
  }

  const extraProviders: Provider[] = [];

  if (serverUrl) {
    extraProviders.push({
      provide: HTTP_INTERCEPTORS,
      useFactory: () => ({
        intercept(req: HttpRequest<any>, next: HttpHandler) {
          // check if the request is for the server
          if (
            serverUrl &&
            (req.url.startsWith('/') || req.url.startsWith(serverUrl))
          ) {
            // if so, call the server
            return next.handle(
              req.clone({
                url: `${serverUrl}${req.url}`,
              }),
            );
          }
          return next.handle(req);
        },
      }),
      multi: true,
    });
  }

  return renderApplication(
    () =>
      bootstrapApplication(layout ?? page, {
        providers: [
          ...providers,
          ...extraProviders,
          provideServerRendering(),
          provideClientHydration(),
          provideHttpClient(withInterceptorsFromDi(), withFetch()),
          importProvidersFrom(imports),
          {
            provide: SSR_PAGE_PROPS,
            useValue: { page, layout },
          },
          SSR_PAGE_PROPS_HOOK_PROVIDER,
        ],
      }),
    {
      document,
      url: urlOriginal,
    },
  );
};
