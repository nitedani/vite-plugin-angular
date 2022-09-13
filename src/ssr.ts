import '@angular/compiler';
import '@angular/platform-server/init';
import 'zone.js/dist/zone.js';

import {
  ApplicationRef,
  ComponentMirror,
  InjectionToken,
  Provider,
  reflectComponentType,
  Type,
} from '@angular/core';
import {
  BEFORE_APP_SERIALIZED,
  renderApplication,
} from '@angular/platform-server';

export const SSR_PAGE_PROPS = new InjectionToken<{
  pageProps: Record<string, unknown>;
  page: Parameters<typeof renderApplication>[0];
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

export const renderToString = <T>(
  rootComponent: Type<T>,
  options: Partial<
    Parameters<typeof renderApplication>[1] & { pageProps: any }
  >,
  wrapper: Type<T> = null
) => {
  if (wrapper === null) {
    wrapper = rootComponent;
  }

  const mirror = reflectComponentType(wrapper);
  options.appId ??= mirror?.selector || wrapper.name.toString().toLowerCase();
  options.document ??= `<${options.appId}></${options.appId}>`;

  const providers: Provider[] = [];
  if (options.pageProps || wrapper !== rootComponent) {
    providers.push(
      {
        provide: SSR_PAGE_PROPS,
        useValue: { pageProps: options.pageProps, page: rootComponent, mirror },
      },
      SSR_PAGE_PROPS_HOOK_PROVIDER
    );
  }

  return renderApplication<T>(wrapper, {
    appId: options.appId,
    document: options.document,
    providers: [...providers, ...(options.providers || [])],
  });
};
