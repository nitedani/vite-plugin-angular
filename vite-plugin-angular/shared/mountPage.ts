import { reflectComponentType, Type, ViewContainerRef } from '@angular/core';

export const mountPage = <T>({
  containerRef,
  page,
  pageProps,
}: {
  containerRef: ViewContainerRef;
  page: Type<T>;
  pageProps: any;
}) => {
  const pageRef = containerRef.createComponent(page);
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
};
