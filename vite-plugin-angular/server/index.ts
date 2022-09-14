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
  reflectComponentType,
  Type,
  ViewContainerRef,
} from '@angular/core';
import {
  BEFORE_APP_SERIALIZED,
  renderApplication,
} from '@angular/platform-server';
import { mountPage } from '../shared/mountPage.js';

if (import.meta.env.PROD) {
  enableProdMode()
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

// Run beforeAppInitialized hook to set Input on the ComponentRef
// before the platform renders to string
export const SSR_PAGE_PROPS_HOOK_PROVIDER: Provider = {
  provide: BEFORE_APP_SERIALIZED,
  useFactory: (
    appRef: ApplicationRef,
    {
      pageProps,
      page,
      mirror,
    }: {
      pageProps: Record<string, unknown>;
      page: any;
      mirror: ComponentMirror<unknown>;
    }
  ) => {
    return () => {
      const compRef = appRef.components[0];

      const instance = compRef.instance;
      const containerRef = instance.page;

      if (containerRef && page) {
        mountPage({
          page,
          containerRef,
          pageProps,
        });
      }

      if (compRef && (pageProps || page) && mirror) {
        for (const i of mirror.inputs) {
          if (pageProps) {
            if (i.propName in pageProps || i.templateName in pageProps) {
              compRef.setInput(i.propName, pageProps[i.propName]);
            }
            if (i.propName === 'pageProps' || i.templateName === 'pageProps') {
              compRef.setInput('pageProps', pageProps);
            }
          }
          if (page) {
            if (i.propName === 'page' || i.templateName === 'page') {
              compRef.setInput('page', page);
            }
          }
        }
        compRef.changeDetectorRef.detectChanges();
      }
    };
  },
  deps: [ApplicationRef, SSR_PAGE_PROPS],
  multi: true,
};

interface WrapperPage<T> {
  page: ViewContainerRef;
}

export const renderToString = <T, U extends WrapperPage<T>>({
  page,
  wrapperPage,
  pageProps,
  providers = [],
}: {
  page: Type<T>;
  wrapperPage: Type<U>;
  pageProps: any;
  providers?: Array<Provider | ImportedNgModuleProviders>;
}) => {
  const rootPage = wrapperPage || page;

  //@ts-ignore
  const mirror = reflectComponentType(rootPage);

  const appId = mirror?.selector || rootPage.name.toString().toLowerCase();
  const document = `<${appId}></${appId}>`;

  if (pageProps || wrapperPage) {
    providers.push(
      {
        provide: SSR_PAGE_PROPS,
        useValue: { pageProps, page, mirror },
      },
      SSR_PAGE_PROPS_HOOK_PROVIDER
    );
  }

  //   @ts-ignore
  return renderApplication<T>(rootPage, {
    appId,
    document,
    providers,
  });
};
