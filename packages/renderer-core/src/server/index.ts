import { XhrFactory } from '@angular/common';
import {
  HTTP_INTERCEPTORS,
  HttpHandler,
  HttpRequest,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import '@angular/compiler';
import {
  APP_BOOTSTRAP_LISTENER,
  ApplicationRef,
  Component,
  ComponentRef,
  ImportProvidersSource,
  InjectionToken,
  NgZone,
  Provider,
  Type,
  enableProdMode,
  importProvidersFrom,
} from '@angular/core';
import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import {
  provideServerRendering,
  renderApplication,
} from '@angular/platform-server';
import '@angular/platform-server/init';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { filter, firstValueFrom } from 'rxjs';
import { fileURLToPath } from 'url';
import xhr2 from 'xhr2';
import 'zone.js/node';
import { LayoutComponent, mountPage } from '../shared/mountPage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class ServerXhr implements XhrFactory {
  build(): XMLHttpRequest {
    xhr2.prototype._restrictedHeaders.cookie = false;
    return new xhr2.XMLHttpRequest();
  }
}

if (import.meta.env.PROD) {
  enableProdMode();
}

export const SSR_PAGE_PROPS = new InjectionToken<{
  pageProps: Record<string, unknown>;
  page: Type<{}> | null;
  layout: Type<{}> | null;
}>('@nitedani/vite-plugin-angular/ssr-props', {
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
    return async (componentRef: ComponentRef<any>) => {
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

let indexHtmlString: string | null = null;
export interface RenderToStringOptions<T = any, U = any>
  extends Pick<Component, 'selector'> {
  imports?: ImportProvidersSource;
  providers?: Provider[];
  page: Type<T>;
  layout?: Type<U>;
  pageContext?: { pageProps?: any; req?: any; res?: any; urlOriginal?: string };
  document?: string;
  serverUrl?: string;
  indexHtml?: boolean;
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
  indexHtml,
  root,
  selector,
  url,
}: RenderToStringOptions<T, U>) => {
  const { root: projectRoot, swc } = globalThis.__vite_plugin_angular;

  const rootComponent = layout ?? page;
  selector ??= 'app-root';
  //@ts-ignore
  rootComponent.ɵcmp.selectors = [[selector]];
  document ??= `<${selector}></${selector}>`;
  root ??= join(__dirname, '..', 'client');
  const urlOriginal = url ?? pageContext?.urlOriginal;

  if (indexHtml) {
    const documentPath = import.meta.env.DEV
      ? join(projectRoot, 'index.html')
      : join(root, 'index.html');

    indexHtmlString ??= await readFile(documentPath, 'utf-8');
    document = indexHtmlString.replace('<body>', `<body>${document}`);
    if (import.meta.env.DEV) {
      const devScript = `<script type="module" src="/@vite/client"></script>`;
      document = document.replace('</head>', `${devScript}</head>`);
    }
  }
  if (import.meta.env.DEV && swc) {
    const compilerScript = `<script type="module" src="/@angular/compiler"></script>`;
    document = document.replace('</head>', `${compilerScript}</head>`);
  }
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
          provideHttpClient(withInterceptorsFromDi()),
          importProvidersFrom(imports),
          { provide: XhrFactory, useClass: ServerXhr },
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
