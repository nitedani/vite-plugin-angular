import '@angular/compiler';
import '@angular/platform-server/init';
import 'zone.js/dist/zone.js';

import {
  ApplicationRef,
  ComponentMirror,
  InjectionToken,
  Provider,
  reflectComponentType,
} from '@angular/core';
import {
  BEFORE_APP_SERIALIZED,
  renderApplication,
} from '@angular/platform-server';

export const SSR_PAGE_PROPS = new InjectionToken<{
  props: Record<string, unknown>;
  mirror: ComponentMirror<unknown>;
}>('@nitedani/vite-plugin-angular/ssr-props', {
  factory() {
    return { props: {}, mirror: {} as ComponentMirror<unknown> };
  },
});

// Run beforeAppInitialized hook to set Input on the ComponentRef
// before the platform renders to string
export const SSR_PAGE_PROPS_HOOK_PROVIDER: Provider = {
  provide: BEFORE_APP_SERIALIZED,
  useFactory: (
    appRef: ApplicationRef,
    {
      props,
      mirror,
    }: {
      props: Record<string, unknown>;
      mirror: ComponentMirror<unknown>;
    }
  ) => {
    return () => {
      const compRef = appRef.components[0];

      if (compRef && props && mirror) {
        for (const [key, value] of Object.entries(props)) {
          if (
            // we double-check inputs on ComponentMirror
            // because Astro might add additional props
            // that aren't actually Input defined on the Component
            mirror.inputs.some(
              ({ templateName, propName }) =>
                templateName === key || propName === key
            )
          ) {
            compRef.setInput(key, value);
          }
        }

        if (
          mirror.inputs.some(
            ({ templateName, propName }) =>
              templateName === 'pageProps' || propName === 'pageProps'
          )
        ) {
          compRef.setInput('pageProps', props);
        }
        compRef.changeDetectorRef.detectChanges();
      }
    };
  },
  deps: [ApplicationRef, SSR_PAGE_PROPS],
  multi: true,
};

export const renderToString = <T>(
  rootComponent: Parameters<typeof renderApplication>[0],
  options: Partial<Parameters<typeof renderApplication>[1] & { pageProps: any }>
) => {
  const mirror = reflectComponentType(rootComponent);
  options.appId ??=
    mirror?.selector || rootComponent.name.toString().toLowerCase();
  options.document ??= `<${options.appId}></${options.appId}>`;

  const providers: Provider[] = [];
  if (options.pageProps) {
    providers.push(
      {
        provide: SSR_PAGE_PROPS,
        useValue: { props: options.pageProps, mirror },
      },
      SSR_PAGE_PROPS_HOOK_PROVIDER
    );
  }

  return renderApplication(rootComponent, {
    appId: options.appId,
    document: options.document,
    providers: [...providers, ...(options.providers || [])],
  });
};
