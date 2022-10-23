import { Component, OnInit } from '@angular/core';
import { Layout } from 'pages/default.layout';
import { AppService } from 'services/app.service';
import { getPets } from './index.telefunc';
export { Page, Layout };

@Component({
  standalone: true,
  template: `<div>Index page works</div>`,
})
class Page implements OnInit {
  constructor(private appService: AppService) {}

  async ngOnInit() {
    console.log(this.appService.getHello());
    console.log(await getPets());
  }
}
