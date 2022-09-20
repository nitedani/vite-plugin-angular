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

@Component({
  standalone: true,
  template: `<ng-template #page></ng-template>`,
})
export class DefaultWrapper implements IDefaultWrapper {
  constructor(
    @Inject(ComponentFactoryResolver)
    public resolver: ComponentFactoryResolver
  ) {}
  @ViewChild('page', { static: true, read: ViewContainerRef })
  page: ViewContainerRef;
}
