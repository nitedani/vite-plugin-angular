import {
  Component,
  Inject,
  ComponentFactoryResolver,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

@Component({
  standalone: true,
  template: `<ng-template #page></ng-template>`,
})
export class DefaultWrapper {
  constructor(
    @Inject(ComponentFactoryResolver) public resolver: ComponentFactoryResolver
  ) {}
  @ViewChild('page', { static: true, read: ViewContainerRef })
  page: ViewContainerRef;
}
