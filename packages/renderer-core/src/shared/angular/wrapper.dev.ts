import {
  Component,
  ComponentFactoryResolver,
  Inject,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

export interface IDefaultWrapper {
  page: ViewContainerRef;
  resolver: ComponentFactoryResolver;
}

export function getWrapper(options?: Component) {
  @Component({
    standalone: true,
    template: `<ng-template #page></ng-template>`,
    selector: options?.selector,
    styles: options?.styles,
    imports: options?.imports,
  })
  class DefaultWrapper implements IDefaultWrapper {
    constructor(
      @Inject(ComponentFactoryResolver)
      public resolver: ComponentFactoryResolver
    ) {}
    @ViewChild('page', { static: true, read: ViewContainerRef })
    page: ViewContainerRef;
  }

  return DefaultWrapper;
}
