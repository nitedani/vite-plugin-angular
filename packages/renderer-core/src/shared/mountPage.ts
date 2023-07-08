import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  reflectComponentType,
  Type,
  ViewContainerRef,
} from '@angular/core';

export interface LayoutComponent<U> {
  page: ViewContainerRef;
}

export const mountPage = <T, U>({
  compRef,
  page,
  pageProps,
  layout,
  appRef,
}: {
  compRef: ComponentRef<T | LayoutComponent<U>>;
  page: Type<T>;
  pageProps: any;
  layout?: Type<LayoutComponent<U>>;
  appRef: ApplicationRef;
}) => {
  let pageRef: ComponentRef<T> | null = null;
  let layoutRef: ComponentRef<LayoutComponent<U>> | null = null;

  if (!layout) {
    pageRef = compRef as ComponentRef<T>;
  } else {
    layoutRef = compRef as ComponentRef<LayoutComponent<U>>;
    pageRef = layoutRef.instance.page.createComponent(page);
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
