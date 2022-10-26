import { Component, Inject, Input, OnInit } from '@angular/core';
import { Layout } from 'pages/default.layout';
import { AppService } from 'services/app.service';
export { Page, Layout };

@Component({
  standalone: true,
  template: `<div>Index page works</div>`,
})
class Page implements OnInit {
  @Input() pageProps: any;

  // pageContext is globally available for injection
  constructor(
    @Inject('pageContext') pageContext: any,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    console.log(this.appService.getHello());
    console.log('Page props', this.pageProps);
  }
}
