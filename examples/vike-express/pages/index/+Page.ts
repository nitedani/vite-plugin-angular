import { PageContext } from '#root/renderer/types';
import { AppService } from '#root/services/app.service';
import { Component, OnInit, inject } from '@angular/core';

@Component({
  standalone: true,
  template: `<div>Index page works</div>`,
})
export default class Page implements OnInit {
  appService = inject(AppService);
  pageContext = inject(PageContext);

  ngOnInit(): void {
    this.appService.getHello();
    console.log('Page props', this.pageContext.pageProps);
  }
}
