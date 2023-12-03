import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { UseQuery } from '@ngneat/query';
import { wait$ } from '@nitedani/angular-renderer-core';
import { AppService } from 'services/app.service';
import { getPokemon } from './index.telefunc';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `<div>
    <div>Index page works</div>

    <div *ngIf="pokemon.result$ | async as pokemon">
      <p *ngIf="pokemon.isError">Error...</p>
      <div *ngIf="pokemon.data">
        <div *ngFor="let pet of pokemon.data.results">
          <div>{{ pet.name }}</div>
        </div>
      </div>
    </div>
  </div>`,
})
export default class Page implements OnInit {
  private appService = inject(AppService);
  private useQuery = inject(UseQuery);

  pokemon = this.useQuery(['pets'], () => wait$(getPokemon()));

  ngOnInit() {
    console.log(this.appService.getHello());
  }
}
