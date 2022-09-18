import '@angular/compiler';
import '@angular/platform-server/init';
import 'zone.js/dist/zone.js';

import {
  ApplicationRef,
  ComponentMirror,
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

if (import.meta.env.PROD) {
  enableProdMode();
}

export const SSR_PAGE_PROPS = new InjectionToken<{
  pageProps: Record<string, unknown>;
  page: Parameters<typeof renderApplication>[0] | null;
  mirror: ComponentMirror<unknown>;
}>('@nitedani/vite-plugin-angular/ssr-props', {
  factory() {
    return {
      pageProps: {},
      page: null,
      mirror: {} as ComponentMirror<unknown>,
    };
  },
});

export const SSR_PAGE_PROPS_HOOK_PROVIDER: Provider = {
  provide: BEFORE_APP_SERIALIZED,
  useFactory: (
    appRef: ApplicationRef,
    {
      pageProps,
      page,
      layout,
    }: {
      pageProps: Record<string, unknown>;
      page: any;
      layout: any;
    }
  ) => {
    return () => {
      const compRef = appRef.components[0];

      if (page || layout) {
        mountPage({
          page,
          compRef,
          pageProps,
          layout,
        });
      }
    };
  },
  deps: [ApplicationRef, SSR_PAGE_PROPS],
  multi: true,
};

export const renderToString = async <T, U>({
  page,
  layout,
  pageProps,
  providers = [],
}: {
  page: Type<T>;
  layout: Type<U>;
  pageProps: any;
  providers?: Array<Provider | ImportedNgModuleProviders>;
}) => {
  const appId = 'ng-component';
  const document = `<${appId}></${appId}>`;

  if (pageProps || layout) {
    providers.push(
      {
        provide: SSR_PAGE_PROPS,
        useValue: { pageProps, page, layout },
      },
      SSR_PAGE_PROPS_HOOK_PROVIDER
    );
  }

  return renderApplication(DefaultWrapper, {
    appId,
    document,
    providers,
  });
};
