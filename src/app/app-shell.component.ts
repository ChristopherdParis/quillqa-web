import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppBottomNavComponent } from './shared/app-bottom-nav.component';
import { AppSidebarNavComponent } from './shared/app-sidebar-nav.component';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterOutlet, AppSidebarNavComponent, AppBottomNavComponent],
  template: `
    <div class="app-shell">
      <app-app-sidebar-nav />
      <main class="content-area">
        <router-outlet />
      </main>
      <app-app-bottom-nav />
    </div>
  `,
})
export class AppShellComponent {}
