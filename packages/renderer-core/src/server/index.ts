import '@angular/compiler';
import '@angular/platform-server/init';
import 'zone.js/dist/zone.js';

import {
  ApplicationRef,
  Component,
  enableProdMode,
  ImportedNgModuleProviders,
  InjectionToken,
  Provider,
  Type,
} from '@angular/core';
import {
  BEFORE_APP_SERIALIZED,
  renderApplication,
} from '@angular/platform-server';
import { DefaultWrapper } from '../shared/angular/wrapper.js';
import { mountPage } from '../shared/mountPage.js';
import { XhrFactory } from '@angular/common';
import xhr2 from 'xhr2';
import {
  HttpHandler,
  HttpRequest,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { readFile } from 'fs/promises';
import { cwd } from 'process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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
  provide: BEFORE_APP_SERIALIZED,
  useFactory: (
    appRef: ApplicationRef,
    {
      page,
      layout,
      pageProps,
    }: {
      page: Type<{}>;
      layout?: Type<{}>;
      pageProps?: Record<string, unknown>;
    }
  ) => {
    return () => {
      const compRef = appRef.components[0];
      mountPage({
        page,
        compRef,
        pageProps,
        layout,
      });
    };
  },
  deps: [ApplicationRef, SSR_PAGE_PROPS],
  multi: true,
};

let indexHtmlString: string | null = null;
export interface RenderToStringOptions<T = any, U = any>
  extends Pick<Component, 'imports' | 'selector'> {
  page: Type<T>;
  layout?: Type<U>;
  pageContext?: { pageProps?: any; req?: any; res?: any; urlOriginal?: string };
  document?: string;
  providers?: Array<Provider | ImportedNgModuleProviders>;
  serverUrl?: string;
  indexHtml?: boolean;
  root?: string;
}

export const renderToString = async <T, U>({
  page,
  layout,
  pageContext,
  providers = [],
  document,
  serverUrl,
  indexHtml,
  root,
  ...componentParameters
}: RenderToStringOptions<T, U>) => {
  const appId = 'server-app';
  componentParameters.imports ??= [];
  componentParameters.selector ??= 'app-root';
  document ??= `<${componentParameters.selector}></${componentParameters.selector}>`;
  root ??= join(__dirname, '..', 'client');

  //@ts-ignore
  DefaultWrapper.ɵcmp.selectors = [[componentParameters.selector]];
  //@ts-ignore
  DefaultWrapper.ɵcmp.dependencies = componentParameters.imports;
  //TODO: check if anything else needs to be set

  if (indexHtml) {
    const documentPath = import.meta.env.DEV
      ? join(cwd(), 'index.html')
      : join(root, 'index.html');

    indexHtmlString ??= await readFile(documentPath, 'utf-8');
    document = indexHtmlString.replace('<body>', `<body>${document}`);
    if (import.meta.env.DEV) {
      const devScript = `<script type="module" src="/@vite/client"></script>`;
      document = document.replace('</head>', `${devScript}</head>`);
    }
  }

  if (!serverUrl && pageContext?.req) {
    serverUrl = `${pageContext.req.protocol}://${pageContext.req.get('host')}`;
  }

  if (serverUrl) {
    providers.push({
      provide: HTTP_INTERCEPTORS,
      useFactory: () => ({
        intercept(req: HttpRequest<any>, next: HttpHandler) {
          // check if the request is for the server
          if (req.url.startsWith('/') || req.url.startsWith(serverUrl!)) {
            // if so, call the server
            return next.handle(
              req.clone({
                url: `${serverUrl}${req.url}`,
              })
            );
          }
          return next.handle(req);
        },
      }),
      multi: true,
    });
  }

  return renderApplication(DefaultWrapper, {
    appId,
    document,

    providers: [
      ...providers,
      {
        provide: 'pageContext',
        useValue: pageContext,
      },
      { provide: XhrFactory, useClass: ServerXhr },
      {
        provide: SSR_PAGE_PROPS,
        useValue: { pageProps: pageContext?.pageProps, page, layout },
      },
      SSR_PAGE_PROPS_HOOK_PROVIDER,
    ],
  });
};
