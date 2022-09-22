import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AboutPage } from './pages/about/about.page';
import { IndexPage } from './pages/index/index.page';

const routes: Routes = [
  { path: 'index', component: IndexPage },
  { path: 'about', component: AboutPage },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class RoutingModule {}
