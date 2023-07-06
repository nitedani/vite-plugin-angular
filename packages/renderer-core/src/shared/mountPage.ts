import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  reflectComponentType,
  Type,
} from '@angular/core';
import type { IDefaultWrapper } from './angular/wrapper.js';

export const mountPage = <T, U>({
  compRef,
  page,
  pageProps,
  layout,
  appRef,
}: {
  compRef: ComponentRef<IDefaultWrapper>;
  page: Type<T>;
  pageProps: any;
  layout?: Type<U>;
  appRef: ApplicationRef;
}) => {
  let pageRef: ComponentRef<T> | null = null;
  let layoutRef: ComponentRef<U> | null = null;

  if (!layout) {
    pageRef = compRef.instance.page.createComponent(page);
  } else {
    pageRef = createComponent(page, { environmentInjector: appRef.injector });

    appRef.components.push(pageRef);
    appRef.attachView(pageRef.hostView);
    layoutRef = compRef.instance.page.createComponent(layout, {
      projectableNodes: [[pageRef.location.nativeElement]],
    });
  }

  if (pageProps || page) {
    if (layoutRef && layout) {
      const mirror = reflectComponentType(layout);
      if (!mirror) {
        throw new Error('Could not reflect component type');
      }
      for (const i of mirror.inputs) {
        if (pageProps) {
          if (i.propName in pageProps || i.templateName in pageProps) {
            layoutRef.setInput(i.propName, pageProps[i.propName]);
          }
          if (i.propName === 'pageProps' || i.templateName === 'pageProps') {
            layoutRef.setInput('pageProps', pageProps);
          }
        }

        if (page) {
          if (i.propName === 'page' || i.templateName === 'page') {
            layoutRef.setInput('page', page);
          }
        }
      }
    }

    if (pageRef) {
      if (pageProps) {
        const mirror = reflectComponentType(page);
        if (!mirror) {
          throw new Error('Could not reflect component type');
        }
        for (const i of mirror.inputs) {
          if (i.propName in pageProps || i.templateName in pageProps) {
            pageRef.setInput(i.propName, pageProps[i.propName]);
          }
          if (i.propName === 'pageProps' || i.templateName === 'pageProps') {
            pageRef.setInput('pageProps', pageProps);
          }
        }
      }
    }
  }
  return {
    pageRef,
    layoutRef,
  };
};
