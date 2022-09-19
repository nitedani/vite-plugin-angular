import { ComponentRef, reflectComponentType, Type } from '@angular/core';
import type { DefaultWrapper } from './angular/wrapper.js';

export const mountPage = <T, U>({
  compRef,
  page,
  pageProps,
  layout,
}: {
  compRef: ComponentRef<DefaultWrapper>;
  page: Type<T>;
  pageProps: any;
  layout?: Type<U>;
}) => {
  let pageRef: ComponentRef<T> | null = null;
  let layoutRef: ComponentRef<U> | null = null;

  if (!layout) {
    pageRef = compRef.instance.page.createComponent(page);
  } else {
    pageRef = compRef.instance.resolver
      .resolveComponentFactory(page)
      .create(compRef.injector);

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
      layoutRef.changeDetectorRef.detectChanges();
    }

    if (pageRef && pageProps) {
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
      pageRef.changeDetectorRef.detectChanges();
    }
  }
};
