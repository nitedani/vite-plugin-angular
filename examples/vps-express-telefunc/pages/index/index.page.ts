import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { UseQuery } from '@ngneat/query';
import { Layout } from 'pages/default.layout';
import { from } from 'rxjs';
import { AppService } from 'services/app.service';
import { getPets } from './index.telefunc';

export { Page, Layout };

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `<div>
    <div>Index page works</div>

    <div *ngIf="pets.result$ | async as pets">
      <p *ngIf="pets.isError">Error...</p>
      <div *ngIf="pets.data">
        <div *ngFor="let pet of pets.data.results">
          <div>{{ pet.name }}</div>
        </div>
      </div>
    </div>
  </div>`,
})
class Page implements OnInit {
  private appService = inject(AppService);
  private useQuery = inject(UseQuery);

  pets = this.useQuery(['pets'], () => from(getPets()));

  ngOnInit() {
    console.log(this.appService.getHello());
  }
}
