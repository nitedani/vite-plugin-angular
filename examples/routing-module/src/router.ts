import { Routes } from '@angular/router';
import { AboutPage } from './pages/about/about.page';
import { IndexPage } from './pages/index/index.page';

export const routes: Routes = [
  { path: 'index', component: IndexPage },
  { path: 'about', component: AboutPage },
];
