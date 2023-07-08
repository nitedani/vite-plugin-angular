import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppService } from '../services/app.service';

@Component({
  standalone: true,
  selector: 'app-component',
  imports: [RouterModule],
  template: `<h1>Angular Router App</h1>
    <!-- This nav gives you links to click, which tells the router which route to use (defined in the routes constant in  AppRoutingModule) -->
    <nav>
      <ul>
        <li>
          <a
            routerLink="/index"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            >Index Page</a
          >
        </li>
        <li>
          <a
            routerLink="/about"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            >About Page</a
          >
        </li>
      </ul>
    </nav>
    <!-- The routed views render in the <router-outlet>-->
    <router-outlet></router-outlet>`,
})
export class RootComponent {
  constructor(private appService: AppService) {
    console.log(appService.getHello());
  }
}
