import { ComponentRef, Type, ViewContainerRef } from '@angular/core';

export interface LayoutComponent<U> {
  page: ViewContainerRef;
}

export const mountPage = <T, U>({
  compRef,
  page,
  layout,
}: {
  compRef: ComponentRef<T | LayoutComponent<U>>;
  page: Type<T>;
  layout?: Type<LayoutComponent<U>>;
}) => {
  let pageRef: ComponentRef<T> | null = null;
  let layoutRef: ComponentRef<LayoutComponent<U>> | null = null;

  if (!layout) {
    pageRef = compRef as ComponentRef<T>;
  } else {
    layoutRef = compRef as ComponentRef<LayoutComponent<U>>;
    pageRef = layoutRef.instance.page.createComponent(page);
  }

  return {
    pageRef,
    layoutRef,
  };
};
